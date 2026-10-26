# Hospitálási naptár

Az adminnál az évfolyam kiválasztása után a Hospitálás szakaszban érhető el. A résztvevő a portál főoldalán látja a saját évfolyamának és az összes évfolyamnak meghirdetett alkalmakat.

- Napra kattintás automatikusan kitölti a dátumot. Az új időpont gomb a mai napot adja.
- Egynapos 08–16, félnapos 09–13, kétnapos mindkét nap 08–16. A második dátum a következő nap, külön átírható.
- Minden nap 1 férőhellyel indul, számmezővel/fel-le nyíllal módosítható.
- A helyszín és a program szabad szöveg. Tab a helyszínről közvetlenül a programra lép.
- Alapesetben csak az aktuális évfolyam. Minden évfolyam opció az összes jóváhagyott korábbi és jelenlegi tag számára elérhető, közös férőhelyekkel.
- Jelentkezésnél alapból mindkét nap, választható csak az első/második nap. Naponként külön sorrend és kapacitás.
- Az adatbázis sorzárral sorosítja a jelentkezéseket. Az aktív jelentkezések sorrendje határozza meg a helyet és a várólistát; lemondás után automatikusan az első várakozó jut be.
- A nevek, saját jelentkezés és várólista látszik az alkalom ablakában. Frissítés gombbal kérhető az aktuális lista; nincs automatikus e-mail-értesítés.
- Alkalom szerkeszthető és lemondható. Jelentkezők mellett a napok/időtartam/meghirdetés köre rögzített, férőhely csak növelhető. Meglévő jelentkezők miatt az idő vagy program változtatását az adminnak külön egyeztetnie kell; automatikus értesítések később.
- A lemondás megőrzi az adatbázisban a korábbi jelentkezéseket, a naptárból eltűnik.
- Új időpont félbehagyott űrlapja helyben piszkozatként visszaáll, nap/fiók/évfolyam szerint elkülönítve.
- Az évfolyam tananyagának másolása nem másolja át a hospitálási alkalmakat vagy jelentkezéseket.

Ellenőrzés: 61 alkalmazásteszt, 18 adatbázisteszt, böngészős mintaadat-próba napra kattintással, kétnapos beállítással, Tab váltással, mentéssel és jelentkezési ablak megnyitásával. Az első saját éles adminpróba következik. E-mail értesítési preferenciák megbeszélése későbbre halasztva, a korábbi döntés szerint.
