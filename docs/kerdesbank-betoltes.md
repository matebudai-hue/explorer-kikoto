# Második napi kérdésbank

Forrás: a felhasználó által 2026. október 26-án átadott `explorer_tesztkerdesek_17-51.md`. 40 kérdés: 24 egyszeres választás (helyzetelemzés és igaz/hamis is), 8 többszörös választás, 4 párosítás, 3 sorba rendezés, 1 rövid szöveges válasz. Az eredeti kérdések privát adatbázisban vannak, nem a nyilvános webcsomagban.

- Második nap: 40-ből véletlen 20 kérdés, új kitöltésenként új válogatás.
- Az első és második napi új tesztkör kérdés- és válaszsorrendje kevert. Régi, megkezdett kitöltés változatlan marad.
- A gyakorló 10 különböző kérdést vesz az összes megnyitott napból; a gyengébben tudott és kevesebbet gyakorolt kérdések előnyt kapnak. A választott kérdések válaszsorrendje is kevert.
- A teljes kérdés- és válaszsorrend a kitöltés mentett pillanatképébe kerül. Visszatéréskor nem változik.
- A pontjóváírás kérdésazonosító alapján, korábbi maximumhoz képest történik; a válaszok keverése nem eredményez új jutalmat ugyanazért a megoldásért. Napi kérdésbanknál egy későbbi tesztben előkerülő, korábban még nem megoldott kérdésért is járhat pont, de egy kör legfeljebb 200 pontos.
- A sorba rendezés sorszámozott lépésekhez választott elemekkel oldható meg, minden elem egyszer használható.
- A rövid szöveges kérdés a fájlban felsorolt négy egyenértékű választ fogadja el, kis/nagybetű és ékezet eltérését figyelmen kívül hagyva. Nem generatív szövegértékelés.
- Az eredeti diasort nem kaptuk meg; a diákkal való tartalmi egyezés nem ellenőrzött. A megadott kérdések és megoldókulcsok változatlan szakmai tartalommal kerülnek át.
- Másoláskor a bank és a tesztszabályok is másolódnak. Az első nap kérdésbankja, a tananyagok, esetek és résztvevői munkák megmaradnak.
- A későbbi napi tesztek korábbi gyenge kérdésekkel való kiegészítése külön, későbbi fejlesztés; jelenleg a gyakorló súlyoz így.

A `scripts/parse-question-bank.py input.md output.json` az átadott formátum gépi átalakítója. Más formátumú vagy más darabszámú kérdésbankhoz az ellenőrzést és a beolvasást a fejlesztő igazítja; a felhasználónak nem kell kérdéseket kézzel felvinnie.

Ellenőrzés: 66 alkalmazásteszt, az eredeti bank 40 megoldókulcsa és 100 új véletlen kitöltés teljes pontozási/mentési próbája.
