# Fájlok és esettanulmányok

A képzési nap Szerkesztés nézetében közvetlen feltöltés és esettanulmány-szerkesztés is elérhető.

- Fájl feltöltése: PDF, Word, PowerPoint, Excel, JPG/PNG/WebP, TXT, ZIP; legfeljebb 20 MB fájlonként, több fájl egyszerre.
- A fájl privát Supabase Storage tárolóba kerül. Feltöltése után a napot is menteni kell. Csak a mentett, megnyitott napra jogosult résztvevő töltheti le; admin a piszkozatból is.
- Az eltávolítás a napból veszi ki a hivatkozást. Fizikai törlés nincs, hogy a már másolt évfolyamok és régi piszkozatok hivatkozásai működjenek. Félbehagyott feltöltések takarítása későbbi feladat.
- Másolt évfolyam saját katalógusában hivatkozik ugyanarra a privát fájlra; az új évfolyam napja külön megnyitást igényel.
- Esettanulmány hozzáadása: cím és szöveg. A meglévő közös feldolgozókérdések és saját válaszmezők jelennek meg; üres évfolyamnál három alap kérdés indul.
- Meglévő eset módosítása megőrzi az eset azonosítóját és a korábbi válaszokat. Új eset új azonosítót kap.
- A fájlmetaadatok és az esetek helyi piszkozatba is mentődnek. A publikálás ellenőrzi, hogy más admin közben nem változtatott-e a közös katalóguson.

Ellenőrzés: 60 alkalmazásteszt, 10 adatbázisteszt. A tárolási hozzáférés tesztje zárt/nyitott napot, engedélyezett és tiltott fájlt, résztvevői feltöltési tiltást vizsgál. A valódi böngészős feltöltés első adminpróbája még szükséges.
