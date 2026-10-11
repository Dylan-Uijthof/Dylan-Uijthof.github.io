## Roll-a-ball: mijn eerste stappen in Unity

Een klein 3D-spel in Unity, gemaakt aan de hand van de Unity-tutorial Roll-a-ball. Je rolt een bal door een arena, verzamelt 12 pick-ups en probeert niet geraakt te worden door een vijand die je achtervolgt.

**Status:** tutorialproject, speelbaar. De code waar het om gaat staat hieronder in de tekst.

Dit is een tutorialproject en geen eigen ontwerp. Het was voor mij het project waarin ik leerde hoe een game-engine werkt, en dat staat hieronder.

![in engine screenshot](assets/img/roll-a-ball.png)

### Wat ik ervan geleerd heb

- **De spelloop: `Start` en `Update`.** `Start` draait één keer aan het begin om dingen op te zetten, `Update` elk frame. Ik leerde ook dat er varianten zijn met een eigen moment: `FixedUpdate` voor natuurkunde (een vaste tijdstap) en `LateUpdate` voor dingen die pas moeten bewegen als al het andere klaar is, zoals de camera.
- **Onafhankelijk van de framerate werken.** De pick-ups draaien met `Time.deltaTime`, dus met een snelheid per seconde in plaats van per frame.
- **3D-beweging met natuurkunde.** De invoer wordt een richting, en daar geef ik een kracht aan een `Rigidbody` mee in plaats van de positie direct te veranderen. Zo rolt de bal en reageert hij op botsingen.
- **Een camera die de speler volgt.** Ik onthoud de afstand tussen camera en speler en pas die elk frame toe.
- **AI met een NavMesh.** Unity bakt een NavMesh uit de geometrie van het level. De vijand is een `NavMeshAgent` die zelf een pad zoekt; ik geef alleen een bestemming op.
- **Triggers en botsingen.** Pick-ups zijn triggers (je rolt erdoorheen), de vijand is een echte botsing. Met tags kan de code ze uit elkaar houden.
- **Dezelfde ideeën keren terug in andere engines**, bijvoorbeeld in Unreal Engine met `BeginPlay` en `Tick`, en ook daar met een NavMesh.

### Keuzes die ik heb leren begrijpen

- **Kracht in `FixedUpdate`, niet positie in `Update`.** Natuurkunde draait op een vaste tijdstap. Beweeg je daarbuiten, dan krijg je schokkerig of inconsistent gedrag.
- **Camera in `LateUpdate`.** De volgorde waarin `Update` van verschillende objecten draait is niet gegarandeerd. `LateUpdate` komt na alle `Update`-aanroepen, dus de speler heeft zich dan al bewogen en de camera loopt niet achter.
- **De afstand van de camera berekenen in plaats van vastleggen.** Ik kan de camera in de editor neerzetten waar ik wil, en de code onthoudt die afstand bij het starten.
- **De bestemming van de vijand elk frame bijwerken.** De speler beweegt de hele tijd, dus de vijand moet zijn pad blijven aanpassen.

### Wat ik zou verbeteren

- Het aantal pick-ups (12) staat hard in de code. Beter is het tellen van de pick-ups in de scène.
- De camera controleert niet of de speler nog bestaat, terwijl de vijand dat wel doet. Als de speler verliest en wordt vernietigd, kan de camera daardoor een foutmelding geven.
- Winnen en verliezen delen één tekstobject waarvan de tekst wordt overschreven. Een aparte spelstatus is netter.
- `SetDestination` elk frame is prima voor één vijand, maar bij veel vijanden zou ik dat beperken.

### Code-highlights

De commentaren in de code heb ik toegevoegd; de code zelf is van het project.

**1. Invoer omzetten in natuurkunde (`PlayerController.cs`)**

```csharp
void OnMove(InputValue movementValue)
{
    // De invoer wordt hier alleen bewaard, niet meteen toegepast
    Vector2 movementVector = movementValue.Get<Vector2>();

    movementX = movementVector.x;
    movementY = movementVector.y;
}

private void FixedUpdate()
{
    // Natuurkunde hoort in FixedUpdate: vaste tijdstap, los van de framerate
    Vector3 movement = new Vector3(movementX, 0.0f, movementY);

    rb.AddForce(movement * speed);
}
```

*Waarom zo:* het ontvangen van invoer en het toepassen ervan zijn gescheiden. De invoer komt wanneer de speler iets indrukt, de kracht wordt toegepast op het ritme van de natuurkunde.

**2. De camera laten volgen (`CameraController.cs`)**

```csharp
void Start()
{
    // Onthoud de afstand tussen camera en speler zoals ik die in de editor heb ingesteld
    offset = transform.position - player.transform.position;
}

void LateUpdate()
{
    // LateUpdate draait na alle Update-aanroepen, dus de speler heeft zich al bewogen
    transform.position = player.transform.position + offset;
}
```

*Waarom zo:* `Start` bewaart de afstand één keer en `LateUpdate` past hem elk frame toe. *Wat ik anders zou doen:* controleren of `player` nog bestaat.

**3. Een vijand die de speler achtervolgt (`EnemyMovement.cs`)**

```csharp
void Start()
{
    navMeshAgent = GetComponent<NavMeshAgent>();
}

void Update()
{
    // De speler kan verdwenen zijn (verloren spel), dus eerst controleren
    if (player != null)
    {
        // De NavMeshAgent zoekt zelf een pad over de NavMesh naar de speler
        navMeshAgent.SetDestination(player.position);
    }
}
```

*Waarom zo:* het hele pad zoeken, rond obstakels, doet Unity. Mijn code geeft alleen de bestemming en wordt elk frame bijgewerkt omdat de speler beweegt.
