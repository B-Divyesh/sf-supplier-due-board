# Due Board demo sandbox

- **Demo URL:** `/demo` (the landing page’s **Try it with sample data** action uses this URL). `?demo=1` also enters the same mode.
- **Sample:** five realistic supplier bills: an overdue paper invoice, an electric bill due today, a due-soon supply bill, a later maintenance bill, and a recently paid hardware bill with a receipt note.
- **Storage isolation:** the real board uses IndexedDB database `supplier-due-board`; the demo uses the separate `demo:supplier-due-board` database and a separate demo currency preference. The demo never opens the real database.
- **Reset:** **Reset demo** replaces only the demo database with the shipped sample.
- **Leaving:** **Start for real** deletes the demo database and returns to `/`; it never copies sample changes into the real board.
- **Offline:** the service worker caches the `/demo` app shell. Once the sample has loaded, its separately stored sample data remains available after an offline reload.
