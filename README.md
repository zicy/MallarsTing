# Inspectra – Offline kontrolplatform

<p align="center">
  <img src="src/banner.png" alt="Inspectra" width="840">
</p>

Statisk web-app til at bygge og udføre digitale kontroller. Kører uden backend – alt lagres i browseren (`localStorage`). Virksomheden ejer sine data; Inspectra behøver ikke modtage eller opbevare kontroldata.

**Live:** [kontrol.toeffe.uk](https://kontrol.toeffe.uk)

## Grundprincip

En kontrolskabelon (**Kontrol**) bygges frit i [builder.html](builder.html): egne felter, egne svarmuligheder, eget layout. Skabelonen eksporteres som en `.inspectra`-fil og importeres på den enhed, der skal udføre kontrollen ([index.html](index.html)) – typisk PC bygger, telefon/tablet udfører. Enhederne behøver ikke kende hinanden.

```
PC (builder.html)                 Telefon/tablet (index.html)
Byg kontrol                       Importér .inspectra
  │                                     │
  ▼                                     ▼
Eksportér .inspectra  ───(fil)───>  Udfør kontrol offline
                                        │
                                        ▼
                                   Historik + PDF lokalt
```

## Datamodel

```
Template (Kontrol)
  referenceId      permanent, virksomheden vælger selv (fx "AVA2-PK-001")
  version          øges ved hver eksport
  executionView    "oversigt" | "punktvisning" | "begge"
  groups: Group[]

Group                          (fysisk maskine/område)
  points: Kontrolpunkt[]

Kontrolpunkt
  rows: Row[]                  visuel række/kolonne-grid

Row
  columns: 1 | 2 | 3
  fields: Field[]

Field
  type, label, required, config   (se felttyper nedenfor)
```

Svarmuligheder er aldrig hardcodet: et **AnswerSet** er et navngivet, genbrugeligt sæt af muligheder (fx "Tilstand": OK/Slidt/Kritisk), som Enkeltvalg-, Checkbokse- og Dropdown-felter peger på. Sæt redigeres i et sæts egen editor (tilføj/omdøb/flyt/slet/standardsvar) og genbruges på tværs af kontroller.

### Felttyper

| Type | Dansk navn | Bemærkning |
|---|---|---|
| `heading` | Overskrift | Ren sektionstekst, intet svar |
| `short_text` / `long_text` | Kort/lang tekst | Fritekst |
| `comment` | Kommentar | Fritekst, samme render som lang tekst |
| `number` | Tal | Valgfri enhed |
| `yesno` | Ja/Nej | Fast to-valg |
| `single_choice` | Enkeltvalg | Fra et AnswerSet |
| `multi_choice` | Checkbokse | Fra et AnswerSet, flere valg |
| `dropdown` | Dropdown | Fra et AnswerSet |
| `date` | Dato | |
| `photo` | Kontrolbillede | Kamera/galleri/begge, ét eller flere billeder |
| `reference_image` | Referencebillede | Sat ved opbygning, skrivebeskyttet ved udførelse |
| `signature` | Signatur | Frihånds-underskrift på canvas |

Hvert felt kan markeres **påkrævet**.

## Byg en kontrol

1. Åbn [builder.html](builder.html) (live: [kontrol.toeffe.uk/builder.html](https://kontrol.toeffe.uk/builder.html)).
2. Opret en kontrol, tilføj grupper (maskiner/områder) og kontrolpunkter.
3. Byg hvert kontrolpunkts layout: tilføj rækker (1–3 kolonner), placér felter, sæt svarmuligheder op.
4. **Eksportér .inspectra** – dette øger versionsnummeret og downloader `{referenceId}_v{version}.inspectra`. Reference-ID låses efter første eksport.
5. Overfør filen til målenheden (e-mail, USB, delt mappe – hvad virksomheden selv bruger) og **importér** den i [index.html](index.html)'s dashboard.

Findes Reference-ID'et allerede på enheden, vises version-sammenligning og et **Opdater kontrol**-valg. Allerede gennemførte kontroller (historik) påvirkes aldrig af en opdatering – de gemmer et snapshot af den skabelon, de blev udført med.

## Udfør en kontrol

1. **Log ind** – Arbejds-ID (gemmes i `localStorage`)
2. **Vælg kategori og kontrol** på dashboardet
3. **Gennemgå grupper og kontrolpunkter** – Oversigt (alle punkter på én side), Punktvisning (ét ad gangen), eller Begge (skift undervejs), afhængig af kontrollens indstilling
4. **Afslut gruppe** når alle påkrævede felter er udfyldt, derefter **Afslut kontrol**
5. **Historik** gemmer resultatet permanent; **PDF** genereres on-demand (også fra historik)

## Historik

Hver gennemført kontrol gemmes med et fuldt snapshot af den anvendte skabelon plus alle svar, fotos og signatur. En senere opdatering af skabelonen ændrer aldrig en tidligere gemt kontrol. PDF'en genereres fra snapshottet, ikke gemt som fil, for at holde `localStorage` let.

## localStorage-nøgler

| Nøgle | Indhold |
|---|---|
| `inspectra_templates` | `{ referenceId: Template }` – alle installerede kontroller |
| `inspectra_answersets` | `{ id: AnswerSet }` – delt bibliotek af svarmuligheder |
| `inspectra_history` | `{ id: HistoryEntry }` – gennemførte kontroller med snapshot |
| `inspectra_done` | `{ userId: { referenceId: { period, at } } }` – "udført denne periode"-badge |
| `inspectra_user` | Arbejds-ID |
| `inspectra_theme` | `dark` / `light` |
| `inspectra_category_filter` | Sidst valgte kategori-fane |
| `inspectra_view_pref` | Sidst valgte Oversigt/Punktvisning ved "Begge" |

## Tema

Kun sort / hvid (+ grøn til **Udført**). Skift mørk ↔ lys (gemmes). Første besøg følger `prefers-color-scheme`.

## Projektstruktur

```
index.html              # Udførelses-app: dashboard, gruppe/punkt-visning, PDF, historik
builder.html             # Kontrolværktøj: skabelon-, felt- og svarmuligheds-editor
css/styles.css           # Tema, layout, generisk felt-grid, historik, signatur
css/builder.css          # Editor-layout: kontrolpunkt-grid, felt-typevælger, svarmuligheds-editor
js/app.js                # Udførelsesflow, PDF, historik, import, deling
js/builder.js            # Skabelon-/felt-/svarmuligheds-editor, .inspectra eksport/import
js/fields.js             # Felttype-register: rendering, validering, PDF-formatering
js/signature.js          # Frihånds-signaturpad (canvas)
js/store.js              # localStorage-lag for templates/answersets/history/done
js/inspectra-io.js       # .inspectra fil-format, parse/byg, version-konflikt
js/migrate.js            # Konvertering fra det gamle faste skema, seed-installation
js/seed-templates.js     # Medfølgende demo-kontroller i den nye datamodel
js/util.js               # Delte DOM-/id-/download-hjælpere
js/theme.js              # Mørk/lys tema
js/image.js              # Billedkomprimering + lightbox
src/kort.png             # Plantegning (Rengøring)
src/banner.png           # README-banner
CNAME                    # kontrol.toeffe.uk
.github/workflows/pages.yml
```

## Kør lokalt

```bash
npx serve .
# eller en hvilken som helst statisk server
```

Åbn URL'en på telefonen via samme Wi-Fi, eller deploy til Pages for kamera/HTTPS.

## Udgiv (GitHub Pages)

Push til `main` kører [`.github/workflows/pages.yml`](.github/workflows/pages.yml).
Workflow kopierer `index.html`, `builder.html`, `CNAME`, `css/`, `js/` og `src/` til Pages.

**Første gang:**

1. Repo → **Settings** → **Pages**
2. **Source:** GitHub Actions
3. Push til `main` (eller kør workflowen under **Actions**)

**Custom domain** (`kontrol.toeffe.uk`):

- `CNAME` i roden
- DNS: **CNAME** → `toeffe.github.io`
- Slå **Enforce HTTPS** til, når certifikatet er klar

## Ikke i denne version

Ingen Inspectra-cloud, central brugerkonto, live synkronisering, web-dashboard, avanceret statistik, AI, realtime enhed-til-enhed-kommunikation, eller central administration af kundens enheder. Licensmodel (Solo/Business/Enterprise) er en fremtidig kommerciel beslutning, ikke en del af denne kodebase.
