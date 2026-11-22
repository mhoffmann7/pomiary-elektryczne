# Pomiary elektryczne

Aplikacja (PWA) do tworzenia protokołów z pomiarów instalacji elektrycznej wg PN-HD 60364-6,
z kartą pomiarów przewodów grzejnych.

- Aplikacja: https://mhoffmann7.github.io/pomiary-elektryczne/
- Makieta (pierwszy prototyp): https://mhoffmann7.github.io/pomiary-elektryczne/makieta/

Działa w przeglądarce telefonu, można ją zainstalować na ekranie głównym i używać bez internetu.
Dane (protokoły, zdjęcia) są zapisywane lokalnie w telefonie (IndexedDB); kopia zapasowa do pliku JSON.

Struktura: `index.html`, `css/app.css`, `js/app.js` (interfejs, oceny), `js/export.js` (PDF/Word),
`sw.js` (praca offline), `vendor/` (pdfmake 0.2, docx 9 – licencje MIT w `vendor/`).
Przy każdej nowej wersji zmień `CACHE` w `sw.js` i `APP_VERSION` w `js/app.js`.
