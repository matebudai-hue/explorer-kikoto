# Explorer Kikötő – önálló portál

A jelenlegi Kikötő önálló másolata és a portál elfogadott követelményei.

## Jelenlegi állapot

- Az `explorer/` könyvtár a működő Kikötő átvett forrása, saját tesztjeivel.
- Saját GitHub-repó: `matebudai-hue/explorer-kikoto`.
- A belépés, központi adatmentés és a portál adminisztrációja még nincs megvalósítva.
- Az eredeti `matebudai-hue/ultimatum` repó nem változott.

## Helyi indítás

`python3 -m http.server 8000`, majd a böngészőben `/explorer/`.

Ellenőrzés: `node --test explorer/tests/*.mjs`.

## Fejlesztési alap

Az elfogadott működés: [docs/elfogadott-mukodes.md](docs/elfogadott-mukodes.md).
Az átvett fájlok azonosítói: `docs/source-snapshot.json`.

Az átvett példány beépített adminsegédjének feltöltési hivatkozásai már az önálló repóra mutatnak. Ezt a segédet az új portál saját adminfelülete váltja majd fel. Ez a forrásalap még nem a belépéssel és központi mentéssel működő portál.
