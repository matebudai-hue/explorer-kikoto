# Explorer Kikötő – elfogadott működés

Rögzítve: 2026. október 26. Ez követelményleírás, nem elkészült funkciók listája.

## Alapelv

Máté felhasználó, nem informatikus. A technikai döntések, kockázatok és megvalósítás a fejlesztő feladata. Az adminisztráció legyen egyszerű: kevés kattintás, jó alapértékek, automatikus kitöltés. A meglévő Kikötő bevált működése megőrzendő. A program saját `explorer-kikoto` repóba kerüljön, a régi működő felület megváltoztatása nélkül. Később saját webcímhez kapcsolható legyen, fiókok és adatok elvesztése nélkül.

## Belépés és jogosultság

- A résztvevő maga regisztrál, adminisztrátori jóváhagyás után fér hozzá.
- Máté és Adri külön fiókkal, azonos adminjogosultsággal dolgozik.
- Résztvevők évfolyamokhoz tartoznak. Saját munka több eszközről elérhető.
- Saját teszteredmények, pontok, aktivitás személyesek, az adminok láthatják.
- Esettanulmányoknál saját beadás után nyílnak meg az évfolyamtársak válaszai.
- A tréningtermek egymás közötti láthatósága évfolyamonként kapcsolható, alapból kikapcsolva.
- Képzés után a saját munka és az évfolyam megnyitott tananyagai elérhetők maradnak.
- Jogosultságot a háttérrendszer is ellenőrizzen; a menü elrejtése nem elég.

## Admin áttekintés

- Évfolyam és résztvevő kezelése, regisztrációk jóváhagyása.
- Utolsó belépés, megkezdett teszt állása, kitöltések időpontjai, első/legutóbbi/legjobb eredmény és fejlődés.
- Megszerzett, elköltött és elkölthető pontok.
- Résztvevő terme és a teremváltozások előzményei. Visszamenőleges, korábban nem mentett teremállapotok nem rekonstruálhatók.
- Kézi pontozási beavatkozás nem része az elfogadott első körnek.

## Tananyag és másolás – kritikus

- Napokhoz rendelhető teszt, szöveg, fájl, link és esettanulmány.
- Szöveg a portálon szerkeszthető; fájlfeltöltés és Drive/egyéb link is használható.
- Évfolyamonként nyithatók az új napok. A megnyitott napok olvashatók és gyakorolhatók maradnak.
- Résztvevői napválasztó lenyíló menü legyen a meglévő Kikötő mintájára.
- Egy alkalommal elkészített teljes képzési tartalom évfolyamok között másolható.
- Másolandó: napok, sorrend, tesztkérdések, válaszok, helyes megoldások, magyarázatok, pontozás, tananyagok, fájlok/linkek és esettanulmányok.
- Ne másolódjanak résztvevők, eredmények, pontok, termek és jelentkezések.
- Az új évfolyam önálló példány, módosítása a korábbi évfolyamot nem érinti. Új példány napjai kezdetben zártak.
- Teljes évfolyam mellett később egyetlen nap/teszt átvétele is támogatandó.

## Hospitálás

- Havi naptárnézet, jelölt programnapokkal, kattintható részletekkel.
- Admin a napra kattintva felugró ablakban adhat hozzá programot; dátum kitöltve, mezőben átírható.
- Időtartam-választó: egynapos (alapérték), fél napos, kétnapos.
- Egynapos alapidő: 08:00–16:00. Fél napos: 09:00–13:00. Kétnapos: mindkét nap 08:00–16:00. Időpontok módosíthatók.
- Helyszín és program szabad szöveges. A Hol? mezőből Tab visz a Milyen program? mezőre.
- Férőhely alapból 1; látható számmező fel/le nyilakkal, közvetlen beírással. Kétnaposnál naponként külön keret és várólista.
- Kétnapos jelentkezés: Mindkét nap (alapértelmezett), Csak az első nap, Csak a második nap.
- Naponként egyértelműen látszódjon, hogy biztos hely vagy várólista jutott. Lemondáskor sorrend szerinti automatikus előrelépés.
- Alapból az adott évfolyamnak szól; átkapcsolható minden évfolyamra, a korábbi évfolyamok jóváhagyott résztvevőit is beleértve. Ez nem nyilvános internetes hozzáférés.
- Több évfolyamnak szóló programnak közös férőhelyei és várólistái vannak.
- Résztvevők látják a programra jelentkezők és várólistások nevét.
- E-mailes értesítés kérhető legyen majd az új lehetőségekről. Az összes értesítési esemény és beállítás megtervezése későbbi feladat, az összes funkció ismeretében.

## Későbbre rögzített tesztfejlesztés

- Naponként nagyobb kérdésbank, például 30 kérdésből 20 kérdéses napi teszt.
- Véletlen kérdésválasztás, kérdéssorrend és válaszlehetőség-sorrend.
- A későbbi tesztek néhány korábbi kérdést is tartalmaznak, a résztvevő gyengébben tudott kérdéseit előnyben részesítve.
- A megkezdett teszt és válaszsorrend rögzített, visszatéréskor változatlan.
- Kérdésbank és válogatási szabályok évfolyamok között másolódnak.
- Új és ismétlő kérdések aránya később döntendő el. Korábban már jóváírt pontok ismét nem fizethetők ki.
- Ez most feljegyzett jövőbeli fejlesztés, nem az első integráció kötelező bővítése.

## Átállás és próba

- A meglévő böngészős munkák fiókba átvitelét meg kell oldani.
- Először külön próba, majd kis csoport, végül teljes évfolyam.
- Elfogadási próba: jelentkezés, jóváhagyás, teszt, pont és terem mentése; másik eszközről folytatás; admin számára helyes megjelenés.
- A képernyőváz nem központi adatbázis és nem éles portál. A bejelentkezés, megőrzés és hozzáférések még elkészítendők.
