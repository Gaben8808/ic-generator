# AddIC - Ipari IC & QR Generátor (v1.1.2)

Az **AddIC** egy modern, progresszív webalkalmazás (PWA), amelyet kifejezetten raktári környezetben történő IC számok kezelésére és QR-kódok generálására fejlesztettünk. Az alkalmazás képes offline működésre, így hálózati kimaradás esetén is zavartalanul használható.

## 🚀 Főbb funkciók

- **Dinamikus QR generálás:** Azonnali, nagyfelbontású QR-kódok létrehozása ipari szkenneres leolvasáshoz.
- **IC Adatbázis:** Felhő alapú (Firebase Firestore) adatbázis az ESS és WSS területek IC számainak kezeléséhez.
- **PWA Támogatás:** Kezdőképernyőre telepíthető, natív app-szerű élmény.
- **Sötét Mód:** Szemkímélő felület éjszakai vagy gyenge fényviszonyok melletti munkához.
- **Haptikus visszajelzés:** Rezgőmotoros megerősítés a sikeres műveletekről (támogatott eszközökön).

## 🛠 Technikai specifikációk

A projekt a tiszta kód elveit követi, különválasztott modulokkal:

- **Frontend:** HTML5, CSS3 (Custom minimalist design), Bootstrap 5.3.
- **Backend:** Google Firebase Firestore (NoSQL adatbázis).
- **Offline képesség:** Service Worker (Caching API) és IndexedDB Persistence.
- **Megjelenítés:** A felület a cég specifikus stílusjegyeit használja (pl. `.navbar-center-title`), biztosítva a konzisztens arculatot. Olyan változókkal operál, mint a `logo_path`, `user_role`, és a `current_username` a későbbi bővíthetőség érdekében.

## 📱 Telepítési útmutató

Az alkalmazás nem igényel áruházi letöltést, közvetlenül a böngészőből telepíthető:

### iPhone (Safari)
1. Nyisd meg a linket Safari-ban.
2. Koppints a **Megosztás** ikonra.
3. Válaszd a **Főképernyőhöz adás** opciót.

### Android (Chrome)
1. Nyisd meg a linket Chrome-ban.
2. Koppints a **Menü** (három pötty) ikonra.
3. Válaszd a **Telepítés** vagy **Hozzáadás a kezdőképernyőhöz** lehetőséget.

## 🔄 Frissítési folyamat

Az alkalmazás automatikusan ellenőrzi az új verziókat a háttérben. Amennyiben frissítés (pl. új `sw.js` verzió) érhető el, a képernyő alján megjelenik egy lila **"Frissítés"** banner. Erre kattintva az app azonnal élesíti a legújabb módosításokat.

---
**Fejlesztette:** Kovács Gábor
**Kapcsolat:** gabor.2.kovacs@aumovio.com
