## vnpsp: een VNDS-interpreter voor de Sony PSP

Een interpreter voor VNDS-scripts (visual novels van de Nintendo DS) die draait op de PSP. Geschreven in C++ met pspsdk. Mijn eerste echte project. Dit project staat onder mijn alt-account Hermes-Digital, omdat ik het publiek wilde releasen zonder mijn echte naam eraan te koppelen.

[GitHub](https://github.com/Hermes-Digital234/vnpsp-RE)
(De herschrijving staat in de branch "Rewrite".)

**Status:** pre-release beschikbaar ([download](https://github.com/Hermes-Digital234/vnpsp-RE/releases/tag/0.0.3)). Werkt op PPSSPP, PS Vita en op PSP's met 64 MB RAM (PSP-3000, PSP Go en PSP Street). De PSP-1000 met 24 MB bruikbaar RAM wordt in de herschrijving ondersteund. Bovenop de pre-release bouw ik nu een volledige herschrijving die schoner, uitbreidbaar en makkelijker te porten is. De huidige pre-release is nog closed source. Hieronder staan een paar snippets.

**Hoe ik het gebouwd heb:** de pre-release heb ik grotendeels zelf geschreven. Een AI-codeeragent heeft me geholpen met onderdelen die ik vervelend vond, vooral het grafische werk en het conversiescript voor mijn eigen assetformaten. Het ontwerp, de bestandsformaten en de technische keuzes waren van mij, en het testen en debuggen op echte hardware deed ik zelf. De herschrijving schrijf ik volledig zelf, zonder gegenereerde code. AI gebruik ik daar alleen als sparringpartner om efficiëntere en schonere oplossingen te vinden, en dat blijft zo.

### Gebruikers

Een interpreter voor visual novels op de PSP is een niche binnen een niche, maar mensen gebruiken hem echt. De meest recente pre-release is 9 keer gedownload. Eén gebruiker heeft bevestigd dat het bij hen goed werkt (Narcissu 2 op een PSP Street), en de andere acht hebben geen problemen gemeld. De repo heeft inmiddels 3 sterren op GitHub. Dat zijn kleine aantallen, maar het is wel het verschil tussen software die alleen op mijn eigen apparaat draait en software waar anderen mee werken. Het gaf me ook mijn eerste ervaring met feedback van gebruikers en met het publiek uitbrengen van een project.

**Zelf getest op een PSP-3000 en een PSP Go:** *Tsukihime*, *Kagetsu Tohya* en *Narcissu 2*. *Tsukihime* is de interessantste test: die game maakt, wijzigt en leest zowel lokale als globale variabelen, en dat ontbreekt bij veel interpreters of werkt daar maar half. Dat die game werkt, laat zien dat de scripting-kant van de interpreter echt klopt, niet alleen het tonen van tekst en plaatjes.

### Wat ik ervan geleerd heb

- **Een emulator is geen echte PSP.** De eerste testbuild draaide prima in PPSSPP, maar op een PSP Go schakelde hij zonder foutmelding uit. Ik leerde via USB debuggen met PSPLINK en de oorzaak te vinden in plaats van te gokken.
- **Geheugen is een budget, geen gegeven.** Op een PSP 1000 met 24 MB (alle andere modellen hebben ongeveer 54 MB) bruikbaar RAM moet je van tevoren beslissen waar elke megabyte heen gaat.
- **Hardware en CPU-cache lopen niet vanzelf gelijk.** De GPU en de MP3-decoder lezen en schrijven geheugen buiten de CPU om, dus je moet de cache zelf legen of ongeldig maken.
- **Meet voordat je alloceert.** Mijn eerste schatting voor de audiocache was veel te ruim (zie hieronder).

### Beslissingen en waarom

- **Eigen `.bpp`-afbeeldingen:** 8-bit gepalet en al in het natieve texture-formaat van de PSP. De bestanden zijn klein (ik heb er geen gezien boven 150 KB), laden in één leesactie zonder omrekenen per pixel en laten meer RAM over voor geluid.
- **Kleine MP3's volledig in het geheugen laden i.p.v. streamen:** de geheugenkaart van de PSP heeft geen constante sequentiële leessnelheid, waardoor streamen haperde. De audio komt van de DS en hoeft niet hoogwaardig te zijn, dus de bestanden zijn klein genoeg om in het RAM te passen.
- **Een fout die ik gemaakt heb:** ik reserveerde 30 MB voor de audiocache, terwijl de meeste tracks onder 5 MB blijven (geen enkele is groter dan 12 MB, voice-lines blijven onder 500 KB). Dat is te veel voor de PSP-1000 en kan daar crashes veroorzaken. In de herschrijving komt een eigen geheugenmanager die bij het opstarten controleert of er minder dan 28 MB heap beschikbaar is en dan de budgetten per assettype verlaagt. De 64 MB-modellen hebben ongeveer 54 MB bruikbaar, dus daar is genoeg marge.

### Waar ik trots op ben

- Dat het echt draait: een publieke pre-release die op meerdere apparaten werkt, inclusief echte hardware.
- Het audiosysteem: twee kanalen (muziek en geluid), een LRU-cache en de hardware-MP3-decoder van de PSP, zonder haperingen.
- Dat ik de zwakke plekken van mijn eigen eerste versie kan benoemen en in de herschrijving gericht aanpak.

### Code-highlights

De code hieronder komt uit de pre-release. Hij is niet de netste, maar wel snel op de PSP. In de herschrijving staat dezelfde logica achter nette interfaces voor graphics, input en audio.

**1. Een afbeelding laden in één allocatie en één leesactie (`bpp.cpp`)**

```cpp
// (header lezen en valideren weggelaten: afmetingen moeten machten van 2 zijn, max 512)

// Eén allocatie: eerst het palet, daarna de pixels. memalign(16) omdat de
// GE (graphics engine) beide 16-byte uitgelijnd wil hebben.
size_t total = (size_t)BPP_CLUT_BYTES + (size_t)tw * th;
unsigned char* mem = (unsigned char*)memalign(16, total);
if (!mem) { fclose(f); return false; }
if (fread(mem, 1, total, f) != total) { free(mem); fclose(f); return false; }
fclose(f);

// De CPU heeft dit geheugen net geschreven: flush het zodat de GE
// geen verouderde cache-regels ziet.
sceKernelDcacheWritebackRange(mem, (unsigned int)total);

img.clut   = (unsigned int*)mem;
img.pixels = mem + BPP_CLUT_BYTES;
img.block  = mem;
```

*Waarom zo:* het bestand is al in het formaat dat de GPU wil, dus laden is gewoon een grote leesactie zonder per-pixel conversie. Eén allocatie betekent minder fragmentatie op een apparaat met weinig RAM. Het cache-flushen is nodig omdat de GPU anders oude data kan lezen.

**2. Audiocache met LRU-verwijdering (`audio.cpp`)**

```cpp
// Verwijder de minst recent gebruikte tracks tot neededBytes in de cache past.
// Tracks die nu afspelen worden overgeslagen.
static void ensureCacheSpace(size_t neededBytes)
{
    lock();
    while (currentCacheSize + neededBytes > MAX_CACHE_BYTES && !lruList.empty())
    {
        bool evicted = false;
        for (std::list<std::string>::iterator r = lruList.end(); r != lruList.begin(); )
        {
            --r;
            CacheMap::iterator c = audioCache.find(*r);
            if (c == audioCache.end())
            {
                lruList.erase(r);
                evicted = true;
                break;
            }
            if (isProtected(c->second.first.data)) continue;

            currentCacheSize -= c->second.first.dataLen;
            if (c->second.first.data) free(c->second.first.data);
            audioCache.erase(c);
            lruList.erase(r);
            evicted = true;
            break;
        }
        if (!evicted) break;    // alles wat overblijft speelt nu
    }
    unlock();
}
```

*Waarom zo:* omdat ik hele tracks in het RAM houd, moet er een regel zijn voor wat eruit gaat als het vol is. LRU past bij visual novels, waar je vaak even terugkeert naar dezelfde muziek. De `isProtected`-controle voorkomt dat een track wordt vrijgegeven terwijl de audiothread hem nog leest. *Wat ik anders zou doen:* de limiet was hier vast op 30 MB. In de herschrijving hangt hij af van het beschikbare geheugen.

**3. Doorlopende afspeellogica: loopen en stoppen (`audio.cpp`)**

```cpp
// Wordt aangeroepen als het huidige PCM-blok op is. Regelt het einde van het
// bestand (loopen of stoppen). Geeft false terug als er niets meer te spelen is.
static bool nextChunk(Stream& st)
{
    if (decodeNext(st) > 0) return true;

    bool more = st.loop || st.playsLeft < 0 || st.playsLeft > 1;
    if (!more)
    {
        stopStream(st);
        return false;
    }
    if (st.playsLeft > 0)
        --st.playsLeft;

    sceMp3ResetPlayPosition(st.handle);
    if (decodeNext(st) > 0) return true;

    stopStream(st);         // herstart mislukt: opgeven in plaats van eindeloos proberen
    return false;
}
```

*Waarom zo:* VNDS-scripts kunnen een geluid een bepaald aantal keer laten herhalen en muziek laten loopen. Deze ene functie handelt dat af op het moment dat de decoder het einde bereikt, en de laatste regel voorkomt dat een kapot bestand de audiothread in een eindeloze lus zet.