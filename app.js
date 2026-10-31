// GESTIONE TEMA GIORNO / NOTTE
const themeToggleBtn = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  document.body.classList.add("dark-mode");
  themeToggleBtn.textContent = "☀️";
} else {
  themeToggleBtn.textContent = "🌙";
}

themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  themeToggleBtn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// SALUTO DINAMICO ALL'AVVIO
function impostaSaluto() {
  const salutoElem = document.getElementById("app-saluto");
  const oraAttuale = new Date().getHours();
  let saluto = "🏥 Salute & Promemoria";

  if (oraAttuale >= 5 && oraAttuale < 12) {
    saluto = "🌅 Buongiorno!";
  } else if (oraAttuale >= 12 && oraAttuale < 18) {
    saluto = "☀️ Buon pomeriggio!";
  } else {
    saluto = "🌙 Buonasera!";
  }
  salutoElem.textContent = saluto;
}

// REGISTRAZIONE SERVICE WORKER
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then(() => console.log("Service Worker attivo"))
    .catch((err) => console.error("Errore SW:", err));
}

// GESTIONE FARMACI E FREQUENZA SETTIMANALE
const formFarmaco = document.getElementById("form-farmaco");
const listaFarmaci = document.getElementById("lista-farmaci");
const frequenzaSelect = document.getElementById("frequenza-farmaco");
const giornoSettimanaSelect = document.getElementById("giorno-settimana");

frequenzaSelect.addEventListener("change", (e) => {
  if (e.target.value === "1 volta a settimana") {
    giornoSettimanaSelect.style.display = "block";
    giornoSettimanaSelect.required = true;
  } else {
    giornoSettimanaSelect.style.display = "none";
    giornoSettimanaSelect.required = false;
  }
});

let farmaci = JSON.parse(localStorage.getItem("farmaci")) || [];

function salvaERendendiFarmaci() {
  localStorage.setItem("farmaci", JSON.stringify(farmaci));
  listaFarmaci.innerHTML = "";
  farmaci.forEach((f, idx) => {
    const li = document.createElement("li");
    let dettaglioFreq = f.frequenza;
    if (f.frequenza === "1 volta a settimana" && f.giorno) {
      dettaglioFreq = `Ogni ${f.giorno}`;
    }

    let notaHtml = f.note
      ? `<br><small style="color: var(--primary);">📝 Note/Scadenza: ${f.note}</small>`
      : "";

    li.innerHTML = `
      <span><strong>💊 ${f.nome}</strong> - ${f.dosaggio}<br><small style="color: var(--text-muted)">Ore: ${f.ora} (${dettaglioFreq})</small>${notaHtml}</span>
      <button class="btn-delete" onclick="eliminaFarmaco(${idx})">Elimina</button>
    `;
    listaFarmaci.appendChild(li);
  });
  aggiornaRiepilogoOggi();
}

formFarmaco.addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = document.getElementById("nome-farmaco").value;
  const dosaggio = document.getElementById("dosaggio").value;
  const ora = document.getElementById("ora-farmaco").value;
  const frequenza = frequenzaSelect.value;
  const giorno =
    frequenza === "1 volta a settimana" ? giornoSettimanaSelect.value : "";
  const note = document.getElementById("note-farmaco").value;

  farmaci.push({ nome, dosaggio, ora, frequenza, giorno, note });
  salvaERendendiFarmaci();
  formFarmaco.reset();
  giornoSettimanaSelect.style.display = "none";
});

window.eliminaFarmaco = function (index) {
  farmaci.splice(index, 1);
  salvaERendendiFarmaci();
};

// GESTIONE APPUNTAMENTI
const formAppuntamento = document.getElementById("form-appuntamento");
const listaAppuntamenti = document.getElementById("lista-appuntamenti");
let appuntamenti = JSON.parse(localStorage.getItem("appuntamenti")) || [];

function salvaERendendiAppuntamenti() {
  localStorage.setItem("appuntamenti", JSON.stringify(appuntamenti));
  listaAppuntamenti.innerHTML = "";
  appuntamenti.forEach((a, idx) => {
    const li = document.createElement("li");
    const dataFormattata = new Date(a.data).toLocaleString("it-IT", {
      dateStyle: "short",
      timeStyle: "short",
    });

    li.innerHTML = `
      <span><strong>📅 ${a.titolo}</strong><br><small style="color: var(--text-muted)">${dataFormattata} - ${a.luogo}</small></span>
      <button class="btn-delete" onclick="eliminaAppuntamento(${idx})">Elimina</button>
    `;
    listaAppuntamenti.appendChild(li);
  });
  aggiornaRiepilogoOggi();
}

formAppuntamento.addEventListener("submit", (e) => {
  e.preventDefault();
  const titolo = document.getElementById("titolo-visita").value;
  const data = document.getElementById("data-visita").value;
  const luogo =
    document.getElementById("luogo-visita").value || "Non specificato";

  appuntamenti.push({ titolo, data, luogo });
  salvaERendendiAppuntamenti();
  formAppuntamento.reset();
});

window.eliminaAppuntamento = function (index) {
  appuntamenti.splice(index, 1);
  salvaERendendiAppuntamenti();
};

// GESTIONE PDF CON FILTRO DI RICERCA
const formDocumento = document.getElementById("form-documento");
const listaDocumenti = document.getElementById("lista-documenti");
const cercaPdfInput = document.getElementById("cerca-pdf");
let documenti = JSON.parse(localStorage.getItem("documenti_salute")) || [];

function salvaERendendiDocumenti(filtro = "") {
  localStorage.setItem("documenti_salute", JSON.stringify(documenti));
  listaDocumenti.innerHTML = "";

  const documentiFiltrati = documenti.filter((doc) =>
    doc.nome.toLowerCase().includes(filtro.toLowerCase()),
  );

  if (documentiFiltrati.length === 0) {
    listaDocumenti.innerHTML =
      '<li style="color: var(--text-muted); font-size: 0.9rem;">Nessun documento trovato.</li>';
    return;
  }

  documentiFiltrati.forEach((doc, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>📄 <strong>${doc.nome}</strong></span>
      <div class="item-actions">
        <a href="${doc.dataBase64}" download="${doc.nome}.pdf" class="btn success" style="text-decoration:none;">Apri</a>
        <button class="btn-delete" onclick="eliminaDocumento(${idx})">Elimina</button>
      </div>
    `;
    listaDocumenti.appendChild(li);
  });
}

cercaPdfInput.addEventListener("input", (e) => {
  salvaERendendiDocumenti(e.target.value);
});

formDocumento.addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = document.getElementById("nome-doc").value;
  const fileInput = document.getElementById("file-pdf");
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (evt) {
      documenti.push({ nome, dataBase64: evt.target.result });
      salvaERendendiDocumenti();
      formDocumento.reset();
    };
    reader.readAsDataURL(file);
  }
});

window.eliminaDocumento = function (index) {
  documenti.splice(index, 1);
  salvaERendendiDocumenti();
};

// GENERAZIONE FILE .ICS CORRETTO PER ORARI E MULTI-FARMACO
document.getElementById("btn-sync-ics").addEventListener("click", () => {
  if (farmaci.length === 0 && appuntamenti.length === 0) {
    alert(
      "Aggiungi prima almeno un farmaco o un appuntamento da sincronizzare.",
    );
    return;
  }

  let icsContent =
    "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//App Salute Personale//IT\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

  // Funzione di supporto per formattare la data nel formato ICS corretto (YYYYMMDDTHHMMSSZ)
  function formattaDataICS(dataObj) {
    const anno = dataObj.getUTCFullYear();
    const mese = String(dataObj.getUTCMonth() + 1).padStart(2, "0");
    const giorno = String(dataObj.getUTCDate()).padStart(2, "0");
    const ore = String(dataObj.getUTCHours()).padStart(2, "0");
    const min = String(dataObj.getUTCMinutes()).padStart(2, "0");
    const sec = String(dataObj.getUTCSeconds()).padStart(2, "0");
    return `${anno}${mese}${giorno}T${ore}${min}${sec}Z`;
  }

  // Aggiungi Farmaci con orari corretti
  farmaci.forEach((f) => {
    let dataEvento = new Date();
    if (f.ora) {
      const [ore, min] = f.ora.split(":");
      dataEvento.setHours(parseInt(ore, 10), parseInt(min, 10), 0);
    } else {
      dataEvento.setHours(9, 0, 0);
    }

    let dataInizioStr = formattaDataICS(dataEvento);
    // Durata fittizia di 15 minuti per l'evento
    let dataFineObj = new Date(dataEvento.getTime() + 15 * 60000);
    let dataFineStr = formattaDataICS(dataFineObj);

    icsContent += "BEGIN:VEVENT\n";
    icsContent += `SUMMARY:💊 Assumi ${f.nome} (${f.dosaggio})\n`;
    icsContent += `DESCRIPTION:Dosaggio: ${f.dosaggio} - Frequenza: ${f.frequenza} - Note: ${f.note || "Nessuna"}\n`;
    icsContent += `DTSTART:${dataInizioStr}\n`;
    icsContent += `DTEND:${dataFineStr}\n`;

    if (
      f.frequenza === "Ogni giorno" ||
      f.frequenza === "2-3 volte al giorno"
    ) {
      icsContent += "RRULE:FREQ=DAILY\n";
    } else if (f.frequenza === "1 volta a settimana") {
      icsContent += "RRULE:FREQ=WEEKLY\n";
    }
    icsContent += "END:VEVENT\n";
  });

  // Aggiungi Appuntamenti con data/ora esatta
  appuntamenti.forEach((a) => {
    let d = new Date(a.data);
    if (!isNaN(d)) {
      let dataInizioStr = formattaDataICS(d);
      let dataFineObj = new Date(d.getTime() + 30 * 60000); // 30 minuti di durata
      let dataFineStr = formattaDataICS(dataFineObj);

      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:📅 Visita: ${a.titolo}\n`;
      icsContent += `DESCRIPTION:Visita medica presso ${a.luogo}\n`;
      icsContent += `LOCATION:${a.luogo}\n`;
      icsContent += `DTSTART:${dataInizioStr}\n`;
      icsContent += `DTEND:${dataFineStr}\n`;
      icsContent += "END:VEVENT\n";
    }
  });

  icsContent += "END:VCALENDAR";

  // Scarica il file .ics
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "promemoria_salute.ics";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);

  alert(
    "File di calendario aggiornato con tutti i farmaci e gli orari corretti!",
  );
});

// RIEPILOGO GIORNALIERO (OGGI)
function aggiornaRiepilogoOggi() {
  const riepilogoElem = document.getElementById("riepilogo-oggi");
  const oggi = new Date();
  const oggiStr = oggi.toISOString().slice(0, 10);

  const giorniSettimana = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];
  const nomeGiornoOggi = giorniSettimana[oggi.getDay()];

  const farmaciOggi = farmaci.filter((f) => {
    if (
      f.frequenza === "Ogni giorno" ||
      f.frequenza === "2-3 volte al giorno" ||
      f.frequenza === "Al bisogno"
    ) {
      return true;
    }
    if (f.frequenza === "1 volta a settimana" && f.giorno === nomeGiornoOggi) {
      return true;
    }
    return false;
  });

  const appuntamentiOggi = appuntamenti.filter(
    (a) => a.data && a.data.startsWith(oggiStr),
  );

  let htmlContent = "";

  if (farmaciOggi.length === 0 && appuntamentiOggi.length === 0) {
    htmlContent =
      '<p style="color: var(--text-muted);">Nessuna terapia o visita registrata per oggi. Giornata tranquilla! 😊</p>';
  } else {
    if (farmaciOggi.length > 0) {
      htmlContent += `<p>💊 <strong>Farmaci da prendere oggi (${farmaciOggi.length}):</strong> ${farmaciOggi.map((f) => `${f.nome} (${f.dosaggio} - ore ${f.ora})`).join(", ")}</p>`;
    }
    if (appuntamentiOggi.length > 0) {
      htmlContent += `<p>📅 <strong>Visite in programma oggi (${appuntamentiOggi.length}):</strong> ${appuntamentiOggi.map((a) => `${a.titolo} a ${a.luogo}`).join(", ")}</p>`;
    }
  }

  riepilogoElem.innerHTML = htmlContent;
}

// BACKUP E RIPRISTINO DATI JSON
document.getElementById("btn-esporta").addEventListener("click", () => {
  const datiBackup = {
    farmaci: JSON.parse(localStorage.getItem("farmaci")) || [],
    appuntamenti: JSON.parse(localStorage.getItem("appuntamenti")) || [],
    documenti: JSON.parse(localStorage.getItem("documenti_salute")) || [],
  };

  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(datiBackup, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute(
    "download",
    `backup_salute_${new Date().toISOString().slice(0, 10)}.json`,
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

document.getElementById("file-importa").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const datiImportati = JSON.parse(evt.target.result);
      if (datiImportati.farmaci)
        localStorage.setItem("farmaci", JSON.stringify(datiImportati.farmaci));
      if (datiImportati.appuntamenti)
        localStorage.setItem(
          "appuntamenti",
          JSON.stringify(datiImportati.appuntamenti),
        );
      if (datiImportati.documenti)
        localStorage.setItem(
          "documenti_salute",
          JSON.stringify(datiImportati.documenti),
        );

      alert("Backup ripristinato con successo!");
      location.reload();
    } catch (err) {
      alert(
        "Errore nel file di backup. Assicurati che sia un file JSON valido.",
      );
    }
  };
  reader.readAsText(file);
});

// Caricamento iniziale
impostaSaluto();
salvaERendendiFarmaci();
salvaERendendiAppuntamenti();
salvaERendendiDocumenti();
