# Bekötés és próba – fejlesztői állapot

## Elkészült kód, még nem üzembe helyezett portál

A gyökér `index.html` már a valódi Supabase belépési folyamatra és az adminisztráció első részére épül. Ez nem a beszélgetésben bemutatott mintaadatokkal működő képernyőváz. Üres `portal/config.json` mellett beállítás alatt álló felületet mutat és nem indít regisztrációt.

Előkészített műveletek:

- E-mail/jelszó belépés, meghívóhoz kötött regisztráció, jelszó-visszaállítás.
- Saját fiókhoz és évfolyamhoz kötött Kikötő-mentés, központi változatütközés kezelése.
- Hálózati hiba esetén helyi tartalék, újrapróbálás és fájlexport.
- Adminnak jelentkezők jóváhagyása, résztvevőlista, eredmények, pontok, tényleges teremrajz és aktivitás.
- Új évfolyam készítése az előző teljes tartalmának önálló másolatából, zárt napokkal.
- A meglévő, korábban is nyilvános Kikötő-tananyag első átvétele.

## Még szükséges a működő próbához

1. ELKÉSZÜLT: külön Supabase-projekt (`explorer-kikoto`, Frankfurt, Free), meglévő más alkalmazás adatainak felhasználása nélkül.
2. Az ingyenes projekt és az e-mail-szolgáltatás korlátainak ellenőrzése. Fizetős szolgáltatás csak a felhasználó külön jóváhagyásával.
3. ELKÉSZÜLT: a `supabase/schema.sql` és az `access-and-indexes.sql` a külön projektben alkalmazva. A szerveroldali migrációk az `applied-migrations.json` fájlban szerepelnek. A `schema.sql` az alkalmazott alap séma pillanatképe, nem kézzel számozott CLI-migráció.
4. ELKÉSZÜLT: az oszlopjogok és az RLS a tényleges projektben ellenőrizve; a biztonsági tanácsadó nem jelez hibát. A nyilvános API-n a meghívó feloldható, a résztvevők adatai anonimként nem olvashatók.
5. ELKÉSZÜLT: nyilvános projektcím és publishable kulcs a `portal/config.json` fájlban. Titkos/service_role kulcs nincs benne.
6. Kezdő regisztráció a saját évfolyammeghívón keresztül, majd Máté és Adri adminisztrátori jogának biztonságos beállítása a privát admin-táblában. A név és felhasználói metadata nem adhat jogosultságot.
7. A megerősítő és visszaállító levelek működésének ellenőrzése, pontos visszatérési címekkel. A Supabase alap e-mail-küldése nem tekinthető ellenőrzés nélkül résztvevőknek használható levelezésnek.
8. A próbafelület közzététele, majd tényleges, két fiókkal és két böngészővel végzett használati próba.

## Ellenőrzések

`npm test`: a meglévő 49 Kikötő-ellenőrzés és a 6 új kliensoldali mentés/konfiguráció ellenőrzése.

`npm run test:database`: valódi, beágyazott PostgreSQL motoron végzett jogosultsági és tranzakciós próba, a Supabase auth séma egyszerű helyettesítésével. Ez ellenőrzi az adatbázislogikát, de nem bizonyítja a tényleges Supabase API, JWT, levelezés vagy projektbeállítások működését.

## Tudatos első körös korlátok

- A pontok továbbra is a meglévő, kliensoldali gyakorlóprogramból származnak. Ez fejlesztő tanulási felület, nem hitelesített vizsgarendszer.
- A változatos napi kérdésbank és adaptív ismétlés későbbi feladat marad.
- A hospitálás, tananyag-szerkesztés, esettanulmányok kölcsönös megosztása és teremgaléria teljes terve megvan, de ezek a működő portálkódban még nincsenek bekötve.
- A régi böngészős eredmények kézi JSON-exporttal/importtal hozhatók át. Automatikus régiadat-átvitel még nincs.
- Az első kör a belépés és a tartós, jogosultságokkal védett adatmegőrzés kipróbálására szolgál.

## Webes közzététel előkészítve, még nincs engedélyezve

- GitHub Pages a `web` ág gyökerét szolgálja majd ki. A `main` a fejlesztési forrás; nem ezt kell webhelyként közzétenni.
- A `node scripts/build-static.mjs` készíti a csomagot. A `content.json`, az adatbázisséma, a dokumentáció és a tesztek nem kerülnek bele.
- A `web` ág csak a belépőfelületet és a működéshez szükséges programfájlokat tartalmazza. Az aktuális tananyagokat a jóváhagyott felhasználók az adatbázisból kapják meg.
- A Pages mentése automatikus jóváhagyási ellenőrzésen megállt. A felhasználótól a nyilvános belépőoldal és a programfájlok közzétételének külön engedélyezését kell kérni. Nem történt publikálás.
- Ezután még szükséges a Supabase visszatérési címének beállítása, az első regisztráció, a saját adminjogosultság és a teljes használati próba.
