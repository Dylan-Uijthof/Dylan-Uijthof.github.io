## r-utils: mijn eigen minimale coreutils in Rust

Een set Unix-commando's in Rust: `rls`, `rfind`, `rgrep`, `rcp`, `rmv`, `rrm`, `rkill`, `rcat`, `rhead`, `rtail`, `rwc`, `rtouch`, `rmkdir` en `recho`. Het idee is een minimale versie van zoiets als uutils. Ik heb de tools gemaakt die ik zelf het vaakst gebruik, elk in één klein bronbestand.

**Status:** hobbyproject ([code](https://github.com/Dylan-Uijthof/r-utils)). Ik werk er pas weer aan als mijn VNDS-herschrijving af is.

### Waarom ik het maakte

GNU `ls` is duizenden regels code, en dat vond ik veel voor een programma dat bestanden toont. Het leek me ook gewoon grappig om zelf een kleine set van de basis-tools te bouwen. Het doel was niet om GNU te vervangen, maar om te zien hoe weinig code je nodig hebt voor de dingen die ik echt gebruik, en wat dat doet voor de snelheid.

### Wat ik ervan geleerd heb

- **Hoe low-level je Rust kunt gebruiken voor systeemtools:** bestanden en mappen via `std::fs`, signalen sturen met de `nix`-crate en processen opzoeken via `/proc`.
- **Waar snelheid vandaan komt in zo'n simpele tool.** Bij `rfind` zit het vooral in minder syscalls: gebufferde uitvoer en het bestandstype uit de directory-entry halen in plaats van elk bestand apart op te vragen.
- **Hoe je met je release-profiel de compiler kunt sturen.** Ik gebruik `lto = "fat"`, `codegen-units = 1` en `panic = "abort"` voor kleinere en snellere binaries.

### Beslissingen en waarom

- **Bewust minimaal.** Elke tool doet alleen wat ik gebruik, bijvoorbeeld `rrm` met `-r` en `-f`, en `rmkdir` met `-p`. Dat houdt de code klein en leesbaar, maar het betekent ook dat het geen drop-in vervanging is.
- **Gebufferde uitvoer in `rfind`.** Eén lock op stdout en een `BufWriter` in plaats van een `println!` per pad.
- **`rmv` probeert eerst `rename`.** Binnen één bestandssysteem is dat bijna gratis. Alleen als dat mislukt kopieert hij en verwijdert hij daarna het origineel.
- **Snelheid:** ik mat het recursief doorlopen van mijn `/var`-map. `rfind` deed er ongeveer 16 ms over zonder cache en ongeveer 8 ms met cache, GNU `find` ongeveer 31 ms en 18 ms. Dat is in beide gevallen ongeveer 2x zo snel. Eén keer liet ik `rfind` mijn hele bestandssysteem (`/`) doorlopen, en met cache was dat binnen 8 seconden klaar. `rfind` doet wel veel minder (geen filters of opties), dus de vergelijking gaat over dat ene geval.

### Wat ik zou verbeteren

- Foutmeldingen horen op stderr; nu komen ze in dezelfde stroom als de gewone uitvoer.
- `rmv` valt bij elke `rename`-fout terug op kopiëren en verwijderen, niet alleen als het om een ander bestandssysteem gaat. Eigenlijk wil ik daar specifiek op controleren.
- `rkill` zoekt op de procesnaam uit `/proc/<pid>/comm`, die de kernel afkapt op 15 tekens. Langere namen worden dus niet gevonden.
- `rtail` leest het hele bestand in het geheugen, wat bij grote bestanden niet handig is.

### Code-highlights

De code staat hier ingekort en de commentaren heb ik naar het Nederlands vertaald.

**1. Recursief mappen doorlopen met gebufferde uitvoer (`rfind.rs`)**

```rust
fn main() {
    // ... argumenten lezen ...
    let stdout = io::stdout();
    let mut out = BufWriter::new(stdout.lock());

    walk(Path::new(start), &mut out);
}

fn walk(dir: &Path, out: &mut impl Write) {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(e) => {
            let _ = writeln!(out, "rfind: {}: {e}", dir.display());
            return;
        }
    };

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(e) => {
                let _ = writeln!(out, "rfind: {e}");
                continue;
            }
        };

        let path = entry.path();
        let _ = writeln!(out, "{}", path.display());

        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
        if is_dir {
            walk(&path, out);
        }
    }
}
```

*Waarom zo:* de `BufWriter` rond één stdout-lock scheelt een schrijfaanroep per regel, en `entry.file_type()` gebruikt meestal de informatie die de directory-lezing al meegeeft, zonder aparte `stat` per bestand. Die methode volgt ook geen symlinks, waardoor je niet in een lus van symlinks terechtkomt. *Wat ik anders zou doen:* foutmeldingen naar stderr schrijven.

**2. Verplaatsen met een snel pad en een terugvaloptie (`rmv.rs`)**

```rust
// Snel pad: zelfde bestandssysteem, het besturingssysteem wijst de naam alleen om.
if fs::rename(src, dst).is_ok() {
    return;
}

// Terugval: andere schijven, rename kan daar niet overheen.
// Kopieer eerst alles, verwijder daarna pas het origineel.
let copy_result = if src.is_dir() {
    copy_dir(src, dst)
} else {
    fs::copy(src, dst).map(|_| ())
};

if let Err(e) = copy_result {
    println!("rmv: {e}");
    return;
}

let remove_result = if src.is_dir() {
    fs::remove_dir_all(src)
} else {
    fs::remove_file(src)
};

if let Err(e) = remove_result {
    println!("rmv: copied but failed to remove original: {e}");
}
```

*Waarom zo:* een `rename` binnen één bestandssysteem verplaatst niets, het wijst alleen de naam om. Tussen schijven kan dat niet, dus moet je kopiëren en daarna pas verwijderen. De volgorde is belangrijk: het origineel wordt nooit verwijderd voordat de kopie gelukt is. *Wat ik anders zou doen:* nu valt hij bij elke `rename`-fout terug op kopiëren, ook bij bijvoorbeeld een rechtenfout. Ik wil specifiek controleren op "andere schijf" (`ErrorKind::CrossesDevices`).

**3. Processen op naam vinden via `/proc` (`rkill.rs`)**

```rust
fn find_pids_by_name(name: &str) -> Vec<i32> {
    let mut matches = Vec::new();

    let entries = match fs::read_dir("/proc") {
        Ok(e) => e,
        Err(_) => return matches,
    };

    for entry in entries.flatten() {
        let file_name = entry.file_name();
        let Some(pid_num) = file_name.to_str().and_then(|s| s.parse::<i32>().ok()) else {
            continue; // geen PID-map (bijv. /proc/cpuinfo)
        };

        let comm_path = entry.path().join("comm");
        if let Ok(comm) = fs::read_to_string(comm_path) {
            if comm.trim() == name {
                matches.push(pid_num);
            }
        }
    }

    matches
}
```

*Waarom zo:* in Linux is elk proces een map in `/proc` met het PID als naam. Door alleen mappen met een getal te nemen sla ik bestanden als `cpuinfo` over, en `comm` bevat de procesnaam. Zo heb ik geen externe crate nodig om op naam te killen. *Wat ik anders zou doen:* de kernel kapt `comm` af op 15 tekens, dus lange namen matchen niet.