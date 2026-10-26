# Explorer Kikötő – önálló portál

A jelenlegi Kikötő önálló másolata és a portál elfogadott követelményei.

## Jelenlegi állapot

- Az `explorer/` könyvtár a működő Kikötő átvett forrása, saját tesztjeivel.
- Saját GitHub-repó: `matebudai-hue/explorer-kikoto`.
- A belépés, központi adatmentés és az adminisztráció első részének kódja elkészült. A Supabase-bekötés és az élő használati ellenőrzés még hátravan; a portál nem üzemkész.
- Az eredeti `matebudai-hue/ultimatum` repó nem változott.

## Helyi indítás

`python3 -m http.server 8000`, majd a böngészőben `/explorer/`.

Ellenőrzés: `npm ci`, majd `npm test` és `npm run test:database`.

## Fejlesztési alap

Az elfogadott működés: [docs/elfogadott-mukodes.md](docs/elfogadott-mukodes.md).
Az aktuális készültség és a bekötési lépések: [docs/bekotes-es-proba.md](docs/bekotes-es-proba.md).
Az átvett fájlok azonosítói: `docs/source-snapshot.json`.

Az átvett példány beépített adminsegédjének feltöltési hivatkozásai már az önálló repóra mutatnak. Ezt a segédet az új portál saját adminfelülete váltja majd fel. Ez a forrásalap még nem a belépéssel és központi mentéssel működő portál.
