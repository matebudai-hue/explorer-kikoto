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

1. A Supabase projektkezelő eszközök elérhetősége, új külön projekt kiválasztása/létrehozása a felhasználó fiókjában. Meglévő más alkalmazás adatbázisát nem használjuk fel.
2. Az ingyenes projekt és az e-mail-szolgáltatás korlátainak ellenőrzése. Fizetős szolgáltatás csak a felhasználó külön jóváhagyásával.
3. A `supabase/schema-draft.sql` telepítése és ellenőrzése a külön projektben. Ez egy helyben tesztelt terv, még nem alkalmazott Supabase-migráció. A végleges migrációt a Supabase CLI saját parancsával kell generálni.
4. A Data API kitettség, oszlopjogok, RLS, RPC végrehajtási jogok és biztonsági tanácsadók ellenőrzése a tényleges projektben.
5. Nyilvános projektcím és publishable kulcs a `portal/config.json` fájlba. Titkos/service_role kulcs nem kerülhet sem böngészőbe, sem repóba.
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
