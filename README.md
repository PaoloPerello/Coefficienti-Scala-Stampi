# Coefficiente di scala stampi/modelli — autoclave

App per calcolare il coefficiente di scala di uno stampo/modello in composito
per compensare la differenza di dilatazione termica tra stampo e parte durante
un ciclo di cura in autoclave. Calcola il coefficiente sia a fine cura (T di
picco) sia al punto di gel della resina, incrociando i dati di gel-time del
datasheet con la dilatazione simulata dello stampo (modello a capacità
concentrata, numero di Biot).

Pagina singola, autonoma (`index.html`): React è incluso nel file stesso,
nessuna build necessaria. `app.source.jsx` è il sorgente leggibile (JSX) da
cui `index.html` è stato generato — utile se in futuro serve modificare la
logica o i dati.

## Pubblicare su GitHub Pages (senza terminale)

1. Su [github.com](https://github.com), crea un nuovo repository (pulsante
   verde **New**). Dagli un nome, es. `coefficiente-scala-stampi`, lascialo
   **Public**, e **non** selezionare "Add a README file" (lo stai già
   caricando).
2. Nella pagina del repository appena creato, clicca **Add file → Upload
   files**, trascina dentro `index.html` (e se vuoi anche `app.source.jsx` e
   questo `README.md`), poi in basso clicca **Commit changes**.
3. Vai su **Settings → Pages** (menu a sinistra).
4. Sotto "Build and deployment", in **Source** scegli **Deploy from a
   branch**; in **Branch** scegli `main` e cartella `/ (root)`, poi **Save**.
5. Aspetta 1-2 minuti: in cima alla stessa pagina Settings → Pages comparirà
   il link pubblico, del tipo:
   `https://<tuo-utente>.github.io/coefficiente-scala-stampi/`

Quel link funziona da PC e da telefono, è stabile (non cambia più) e puoi
condividerlo con chiunque. Per aggiornare l'app in futuro: ripeti "Add file →
Upload files" con la nuova versione di `index.html` sullo stesso repository —
GitHub Pages si aggiorna da solo in 1-2 minuti dopo ogni commit.

## Dati e fonti

I valori dei materiali (CTE, densità, conducibilità, gel-time, cura→Tg) sono
tratti dai datasheet elencati in fondo alla pagina dell'app stessa; i valori
segnati "STIMA" sono stime di letteratura dichiarate come tali, quelli "N/D"
vanno inseriti manualmente quando disponibili. Vedi i badge colorati in ogni
sezione dell'app per la provenienza di ciascun valore.
