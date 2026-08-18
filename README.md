# Lokální vývoj webu ZUŠ Morava (Shipard + mustache)

Upravuješ u sebe, vidíš výsledek hned, do Shipardu kopíruješ až hotovou verzi.

```bash
npm install
npm start          # http://localhost:3000
```

## Kam co patří (mapa na soubory v Shipardu)

| Shipard | Lokálně |
|---|---|
| `page-web.mustache` | `template/page-web.mustache` |
| `e10.web.articles.mustache`, `e10.web.articleImage.mustache` (obsahové šablony) | `scripts/*.mustache` |
| vlastní webScripty (např. „aktuality") | `scripts/*.mustache` |
| `style.less`, `old_style.less`, `almanach_style.less`, `smycec_style.less`, `old_style.css` | `styles/` |
| `script.js`, `cookieconsent-init.js` | `js/` |
| obsah stránky (editor stránky) | `pages/<slug>.html` |
| parametry stránky (homePage, smycec, almanachPage, layout) | `pages/<slug>.json` |
| obsah patičky (`page.footerFull`) | `template/footer.html` |
| — | `data/base.json` (globální proměnné, karusel) |
| — | `data/dataviews/<jmeno>.json` (testovací data pro dataView) |

Vše se hlídá, prohlížeč se sám obnoví.

## LESS

`/style.css` se za běhu zkompiluje z `styles/style.less`. Stejně tak
`/old_style.css`, `/almanach_style.css`, `/smycec_style.css`.
Chyba v LESS se vypíše do konzole i jako komentář v CSS.

Pozor: v Shipardu máš `smycec_style.less` třikrát a `old_style` jako `.less`
i `.css`. Zjisti, který záznam je opravdu použitý, zbytek dej do archivu —
jinak budeš lokálně ladit jiný soubor, než jaký je na webu.

## Dva různé druhy šablon v `scripts/`

**1) Obsahová šablona** – Shipard jí nechá vyrobit celý obsah stránky.
Typicky `e10.web.articles.mustache` pro `/aktuality` a detail článku.
Pracuje s `page.articles`, `page.article`, `page.needPagination`, `section.*`.

Lokálně: stránka nemá `.html`, jen `.json` s klíčem `render`:

```json
{ "render": "e10.web.articles", "page": { "articles": [ ... ] } }
```

Viz `pages/aktuality.json` (výpis) a `pages/aktuality/1.json` (detail).
Podsložky fungují, takže URL `/aktuality/1` = `pages/aktuality/1.json`.

**2) webScript** – malý kus HTML vložený doprostřed běžné stránky
přes shortcode `{{dataView;...}}`. Pracuje s `data.*`.

## dataView / webScript

Shortcode ve stránce:

```
{{dataView;classId:e10.web.dataView.Articles;urlPrefix:aktuality;maxCount:6;section:1,3;webScript:aktuality}}
```

Dev server ho rozbalí takto:

1. šablona = `scripts/<webScript>.mustache`, jinak `scripts/<classId>.mustache`,
   jinak `scripts/e10.web.Articles.mustache`, jinak `scripts/Articles.mustache`
2. data = `data/dataviews/<stejná jména>.json`
3. `maxCount` ořízne všechna pole v datech
4. výsledek se vloží na místo shortcode

Když šablona nebo data chybí, na stránce se objeví červený rámeček
s výpisem, co přesně hledal.

## Assety

Co se nenajde v `public/`, `js/` ani `styles/`, se přesměruje na
`https://zusmorava.cz` — obrázky z `/att/...` tedy fungují bez stahování.

Skutečné hodnoty `scRoot` / `dsRoot` / `templateRoot` zjistíš ze
„zobrazit zdroj stránky" na živém webu. Prázdný řetězec funguje taky.

## Podstránky stažené z produkce

Soubory v `pages/` (kromě `index`, `aktuality`, `skolne`) jsou **snímek
vykresleného HTML** z zusmorava.cz, ne původní text z editoru Shipardu.
Rozdíl je podstatný, když je budeš kopírovat zpátky:

- `pracoviste.html` — vykreslený výpis poboček jsem nahradil zpátky
  shortcodem `{{dataView;...}}`, aby šel testovat lokálně.
- `prihlaska.html` — formulář generuje Shipard včetně recaptchy.
  Neposílej ho zpátky, přepsal bys funkční formulář statickým HTML.
- `vystavy.html` — obsahuje `card-deck`, který na produkci nejspíš
  vyrábí dataView. Ověř si to v editoru, než budeš kopírovat.

Ostatní stránky jsou obyčejný text a nadpisy, ty jsou v pořádku.

Google mapa na `/pracoviste` hlásí lokálně chybu, protože `gmApiKey`
v `data/base.json` je prázdný. Na produkci klíč je.

## Atrapy dataView musí sedět s produkcí

Šablony v `scripts/` pro dataView jsou lokální náhrady za to, co na
produkci vykresluje Shipard. Musí vypisovat **stejné HTML**, jinak si
lokálně naladíš styly na třídy, které na webu neexistují.

Přesně to se stalo u poboček: atrapa vypisovala vlastní
`.location-list`, kdežto Shipard vypisuje
`<ul class="dataView-places-list">` s `<li>` a odkazem. Lokálně to
vypadalo dobře, na produkci zůstal holý seznam s odrážkami.

Když nevíš, jak výstup vypadá, stáhni si stránku z produkce a podívej
se do zdroje.

## Nová stránka

```
pages/hudebniobor.html          <- obsah
pages/hudebniobor.json          <- { "page": { "pageTitle": "Hudební obor" } }
```

## Vzhled

Písmo: **Poppins** na všechno, nahrané v Shipardu pod `/att/`. Žádné
externí CDN. Patkový Playfair Display na nadpisy jsme zkusili a zahodili;
`@font-heading` a `@font-body` zůstaly oddělené, takže jde nadpisové písmo
kdykoliv změnit zvlášť.

`old_style` se už nenačítá. Pravidla, která texty stránek ze Shipardu
opravdu potřebovaly – karty kontaktů a článků, `card-deck`, `thumb`,
tabulky – jsou přenesená ve `styles/style.less` v sekci **10b**.
Prošel jsem 19 stránek na produkci a nic jiného z `old_style` v obsahu
nezůstalo.

Pozor na `.card-deck`: základ (`display`) dodával Bootstrap 4, který už
na webu není, a `old_style` k němu doplňoval jen šířky. Bez sekce 10b by
se karty poskládaly pod sebe.

Aktuality jsou vyvěšované plakáty na A4, karta proto drží poměr 1 : 1,414
a titulek je pod plakátem, ne přes něj. Dřív se plakát ořezával do vodorovné
karty přes `cover`, takže z něj zbyl výřez uprostřed bez nadpisu i termínu.

Seznam studijních zaměření na úvodní stránce (`pages/index.html`, sekce
„Co se u nás dá studovat") odpovídá výběru v elektronické přihlášce.
Když v Shipardu přibude nebo zmizí nástroj, uprav ho i tady.

Barvy, poloměry a stíny jsou proměnné na začátku `styles/style.less`
(sekce 2). Když chceš změnit barvu školy, měníš `@navy` na jednom místě,
ne dvacetkrát po souboru.

Lidový ornament (svislé pruhy po stranách) je vypnutý — v `styles/style.less`
u pravidla `main`. Obrázek na něj věší `old_style`, ale kontejner ho ořezával
na náhodný proužek u kraje obsahu. Když ho budeš chtít zpátky, smaž tam řádek
`background-image: none`.

Web jde do krajů: bootstrapový `.container` má u lišty, obsahu a patičky
zrušenou `max-width` a drží ho jen boční odsazení (`@bleed-x` v sekci 2).
Pravidlo cílí jmenovitě na `#c-main` a spol., aby se nerozbily `.container`
uvnitř textů stránek.

Patička je v `template/footer.html` jako obyčejné HTML, ne jako
escapovaný řetězec v JSONu – dá se odtamtud rovnou zkopírovat do
Shipardu do `page.footerFull`. Dev server si ji z toho souboru načítá
sám, takže je jen na jednom místě.

Pruh se sociálními sítěmi je součástí patičky, takže je na všech
stránkách. Na úvodní stránce už proto samostatná sekce není.

Tlačítka mají `border-radius` s `!important` schválně — ve stránkách ze
Shipardu jsou desítky odkazů s inline `style="border-radius: 0px"`, které by
jinak nový vzhled přebily.

## UIkit je pryč

Web jede čistě na Bootstrapu 5. UIkit (CSS i JS) byl ze šablony odstraněn:

- karusel na úvodní stránce je Bootstrap carousel
- titulní blok almanachu byl karusel o jednom snímku, teď je to obyčejný blok
- skript na `UIkit.accordion` byl mrtvý – element s `id="uk-accordion"`
  není na webu nikde, volal se naprázdno na každé stránce

V textech stránek v Shipardu ale pár `uk-` tříd zůstalo: `uk-container`
(almanach), `uk-padding-remove-bottom`, `uk-button-link` a `uk-table`.
Ty drží při životě sekce **9b** ve `styles/style.less`. Až je z obsahu
vyčistíš, může celá sekce pryč.

Bootstrap carousel potřebuje na jednom snímku třídu `active`. Mustache
neumí poznat první prvek smyčky, takže ji doplňuje krátký skript
v šabloně – nemaž ho, jinak karusel zůstane prázdný.

Naklápění hero podle pohybu myši (vanilla-tilt) je odstraněné včetně
jeho CDN.

## Opravené chyby

Tyhle chyby ve stávajících souborech už jsou opravené, ale pokud budeš
kopírovat starší verzi ze Shipardu, vrátí se:

- `page-web.mustache`, karusel: `href="{{{properties.bd2gq4ckw_27.value}}"`
  mělo tři otevírací a jen dvě zavírací závorky.
- webScript aktuality: `<h4 class="card-title">{{title}}</h5>` — h4 uzavřené `</h5>`.
- `e10.web.articles.mustache`, detail článku: datum a autor se vypisovaly
  dvakrát — jednou natvrdo v `<span class="text-secondary">` a hned podruhé
  v bloku `section.showDateOrAuthor`.
- `UIkit.accordion(document.getElementById("uk-accordion"), ...)` spadlo
  na stránkách, kde element s tím id není.
- Naklápění karuselu volalo `.vanillaTilt.destroy()` na prvku bez tiltu,
  takže na displejích pod 480 px spadl skript.
- Odpočet k datu „March 26, 2024“ běžel `setInterval` každou vteřinu na všech
  stránkách do prvku, který nikde nebyl. Odstraněno.

## Drobnost, o kterou je snadné zakopnout

Mustache tagy se vyhodnocují i uvnitř HTML komentářů. Zakomentovaný blok
s otevřenou sekcí shodí render celé stránky.

## Git

```bash
git init && git add . && git commit -m "init"
```
