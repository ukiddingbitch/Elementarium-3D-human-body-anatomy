(function () {
  if (location.protocol !== 'file:') return;
  document.addEventListener('DOMContentLoaded', function () {
    var language = (navigator.language || 'en').slice(0, 2);
    var labels = {
      sk: ['Spusti Elementarium', 'V hlavnom priečinku dvakrát klikni na Elementarium.exe. Periodická tabuľka aj 3D atlas sa otvoria v prehliadači automaticky.', 'Tento HTML súbor nie je spúšťač aplikácie.', 'Nie je potrebný terminál ani pripojenie na internet.'],
      en: ['Start Elementarium', 'Double-click Elementarium.exe in the main folder. The periodic table and 3D atlas will open in your browser automatically.', 'This HTML file is not the application launcher.', 'No terminal or internet connection is needed.'],
      it: ['Avvia Elementarium', 'Fai doppio clic su Elementarium.exe nella cartella principale. La tavola periodica e l’atlante 3D si apriranno automaticamente nel browser.', 'Questo file HTML non è il programma di avvio.', 'Non servono terminale o connessione a Internet.'],
      la: ['Elementarium aperi', 'Elementarium.exe in principali directorio bis preme. Tabula periodica et atlas tridimensionalis in navigatro aperientur.', 'Hic fasciculus HTML applicationem non incipit.', 'Termino vel conexione interretiali opus non est.']
    }[language];
    if (!labels) { language = 'en'; labels = ['Start Elementarium', 'Double-click Elementarium.exe in the main folder. The periodic table and 3D atlas will open in your browser automatically.', 'This HTML file is not the application launcher.', 'No terminal or internet connection is needed.']; }
    document.documentElement.lang = language;
    document.title = 'Elementarium';
    var main = document.createElement('main');
    main.id = 'file-entry-help';
    main.style.cssText = 'max-width:660px;margin:12vh auto;padding:32px;font:19px/1.6 Segoe UI,Arial,sans-serif;background:#142238;border:1px solid #38516b;border-radius:16px;color:#e9f0f7';
    labels.forEach(function (label, index) { var node = document.createElement(index === 0 ? 'h1' : 'p'); node.textContent = label; main.appendChild(node); });
    document.body.replaceChildren(main);
    document.body.style.cssText = 'margin:0;padding:20px;background:#0b1220;overflow:auto;height:auto;display:block';
  }, {once:true});
})();
