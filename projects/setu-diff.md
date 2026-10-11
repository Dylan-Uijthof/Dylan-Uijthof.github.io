## setu-diff: een JSON-vergelijkingstool in Java

Een proof of concept voor een tool die twee versies van JSON-documenten met elkaar vergelijkt. Ik maakte dit project toen ik bij Randstad aan mijn stage begon, om te laten zien dat ik de oplossing kon bouwen. De tool kan een bestaand document uit MongoDB ophalen, een nieuw JSON-bestand verwerken en de verschillen overzichtelijk tonen. Ik heb twee frontendvarianten gemaakt: één in de stijl van Git-diffs en één met de wijzigingen in een tabel.

[GitHub](https://github.com/Dylan-Uijthof/setu-diff)

**Context:** proof of concept voor mijn stage bij Randstad. De uiteindelijke versie werd geïntegreerd in hun eigen enterprise-systeem en daar in productie gebruikt. Die productiecode is eigendom van Randstad en kan ik niet openbaar delen. De repository bevat alleen mijn eigen proof of concept, waarvoor ik toestemming heb gekregen om die op mijn privé-GitHub te zetten en als portfolio-materiaal te gebruiken.

### Waarom ik het maakte

Het idee was om niet alleen te bepalen dát twee documenten verschillen, maar ook duidelijk te maken welke waarden zijn toegevoegd, verwijderd of aangepast.

### Wat ik ervan geleerd heb

- **Java in een enterprise-omgeving:** werken met een duidelijke scheiding tussen controllers en services, in plaats van alle logica op één plek te zetten.
- **Een backend bouwen met Spring Boot:** API-endpoints maken voor het ophalen, zoeken, opslaan en vergelijken van documenten.
- **JSON-documenten verwerken:** oude en nieuwe JSON-data inlezen en met elkaar vergelijken, zodat toevoegingen, verwijderingen en wijzigingen als aparte resultaten terugkomen.
- **Samenwerken met testers:** tijdens mijn stage werkte ik regelmatig met testers om het gedrag van de oplossing nauwkeurig te controleren en te verbeteren.
- **Geautomatiseerd testen:** voor de uiteindelijke oplossing heb ik geautomatiseerde unit tests gemaakt. De testcode van de productieversie staat niet in deze publieke proof of concept.

### Beslissingen en waarom

- **Controllers en services gescheiden.** De `LearningController` verwerkt HTTP-verzoeken en stuurt het werk door naar `MongoService`. De service bevat de logica voor het ophalen en vergelijken van data. Daardoor blijven de API-laag en de verwerkingslogica beter van elkaar gescheiden.
- **MongoDB voor de documenten.** De proof of concept gebruikt Spring Data MongoDB om documenten op te slaan en terug te vinden.
- **JSON-aware diff in plaats van alleen tekst vergelijken.** De bibliotheek zjsonpatch berekent het verschil tussen de twee JSON-structuren als JSON Patch, en mijn eigen code zet het resultaat om naar een formaat met de bewerking, het pad en de oude en nieuwe waarde. Daardoor kan de frontend de wijzigingen op een begrijpelijke manier tonen.
- **Twee manieren om verschillen te bekijken.** Ik heb zowel een Git-achtige diffweergave als een tabelweergave gemaakt. Zo kon ik verschillende manieren uitproberen om de wijzigingen leesbaar te presenteren.

### Code-highlights

De voorbeelden hieronder komen uit de publieke proof of concept, niet uit de productieversie van Randstad. Ik heb ze ingekort en er commentaar bij gezet.

**1. De controller houdt de API-laag overzichtelijk (`LearningController.java`)**

```java
@PostMapping(
        value = "/diff/{id}",
        consumes = "multipart/form-data",
        produces = "application/json")
public ResponseEntity<?> getJsonDiff(
        @PathVariable("id") String id,
        @RequestParam("file") MultipartFile file) {
    try {
        List<Map<String, Object>> diffResult = mongoService.diffJsonFiles(id, file);
        return ResponseEntity.ok(diffResult);
    } catch (RuntimeException e) {
        return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
    } catch (Exception e) {
        return new ResponseEntity<>(
                "Failed to process diff: " + e.getMessage(),
                HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

*Waarom zo:* de controller ontvangt het document-ID en het geüploade JSON-bestand, en laat de service het daadwerkelijke vergelijkingswerk doen. Het resultaat wordt als JSON teruggegeven aan de frontend.

**2. JSON-structuren vergelijken (`MongoService.java`)**

```java
JsonNode oldJsonNode = objectMapper.readTree(oldDocument.toJson());
JsonNode newJsonNode = objectMapper.readTree(newFile.getInputStream());
JsonNode patch = JsonDiff.asJson(oldJsonNode, newJsonNode);
return convertPatchToCustomFormat(patch, oldJsonNode);
```

*Waarom zo:* door de documenten als JSON-structuren te behandelen, kan de code verschillen per veld verwerken in plaats van alleen twee tekstbestanden regel voor regel te vergelijken. `JsonDiff.asJson` komt uit de bibliotheek zjsonpatch en levert een JSON Patch op. Daarna zet `convertPatchToCustomFormat` de bewerkingen om naar gegevens die de frontend kan weergeven.

**3. Het verschil omzetten naar een eigen formaat (`MongoService.java`)**

```java
private List<Map<String, Object>> convertPatchToCustomFormat(JsonNode patch, JsonNode oldJsonNode) {
    List<Map<String, Object>> customDiffOutput = new ArrayList<>();

    for (JsonNode operation : patch) {
        Map<String, Object> diffDetail = new LinkedHashMap<>();
        String op = operation.get("op").asText();
        String path = operation.get("path").asText();
        diffDetail.put("operation", op);
        diffDetail.put("path", path);

        switch (op) {
            case "replace":
                // Het pad is een JSON Pointer: daarmee haal ik de oude waarde uit het oude document
                JsonNode oldValueNode = oldJsonNode.at(path);
                diffDetail.put("from", objectMapper.convertValue(oldValueNode, Object.class));
                diffDetail.put("to", objectMapper.convertValue(operation.get("value"), Object.class));
                break;
            case "add":
                diffDetail.put("from", null);
                diffDetail.put("to", objectMapper.convertValue(operation.get("value"), Object.class));
                break;
            case "remove":
                JsonNode removedValueNode = oldJsonNode.at(path);
                diffDetail.put("from", objectMapper.convertValue(removedValueNode, Object.class));
                diffDetail.put("to", null);
                break;
        }

        customDiffOutput.add(diffDetail);
    }

    return customDiffOutput;
}
```

*Waarom zo:* een JSON Patch zegt bij een `replace` of `remove` alleen waar iets veranderde, niet wat er eerst stond. Daarom zoek ik de oude waarde op in het oude document aan de hand van het pad. Zo heeft elke wijziging een "van" en een "naar", en hoeft de frontend niets over JSON Patch te weten. *Wat ik anders zou doen:* een `default`-tak voor operaties die ik niet behandel.

### Waar ik trots op ben

- Dat mijn eerste proof of concept uiteindelijk onderdeel werd van het systeem van Randstad en in productie werd gebruikt.
- Dat ik de verschillen niet alleen als tekst laat zien, maar per veld uitleg (toegevoegd, verwijderd of aangepast) kan geven.

### Wat ik zou verbeteren

- De controller zet elke `RuntimeException` om in een 404. Een ontbrekend document en een echte fout zijn daardoor niet van elkaar te onderscheiden. Ik zou specifieke excepties gebruiken en per soort een passende statuscode teruggeven.
- De `switch` kent alleen `add`, `remove` en `replace`. Geeft de bibliotheek ooit een andere bewerking terug (zoals `move` of `copy`), dan komt die zonder "van" en "naar" in het resultaat. Ik zou die gevallen expliciet afhandelen of een duidelijke fout geven.