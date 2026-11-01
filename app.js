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

// FORMATTAZIONE DATA ICS COMPATIBILE SAMSUNG
function formattaData(dataObj) {
  const yyyy = dataObj.getUTCFullYear();
  const mm = String(dataObj.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dataObj.getUTCDate()).padStart(2, "0");
  const hh = String(dataObj.getUTCHours()).padStart(2, "0");
  const min = String(dataObj.getUTCMinutes()).padStart(2, "0");
  const ss = String(dataObj.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

// GESTIONE FARMACI
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
      ? `<br><small style="color: var(--primary);">📝 Note: ${f.note}</small>`
      : "";
    let colore = f.colore || "#0ea5e9";

    li.innerHTML = `
      <span>
        <span style="height: 12px; width: 12px; background-color: ${colore}; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
        <strong>💊 ${f.nome}</strong> - ${f.dosaggio}<br>
        <small style="color: var(--text-muted); margin-left: 20px;">Ore: ${f.ora} (${dettaglioFreq})</small>${notaHtml}
      </span>
      <div class="item-actions">
        <button class="btn success" onclick="esportaSingoloFarmaco(${idx})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">📅 Cal</button>
        <button class="btn-delete" onclick="eliminaFarmaco(${idx})">Elimina</button>
      </div>
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
  const colore = document.getElementById("colore-farmaco")
    ? document.getElementById("colore-farmaco").value
    : "#0ea5e9";
  const note = document.getElementById("note-farmaco").value;

  farmaci.push({ nome, dosaggio, ora, frequenza, giorno, colore, note });
  salvaERendendiFarmaci();
  formFarmaco.reset();
  giornoSettimanaSelect.style.display = "none";
});

window.eliminaFarmaco = function (index) {
  farmaci.splice(index, 1);
  salvaERendendiFarmaci();
};

// ESPORTA NOTIFICA DISCRETA PER SINGOLO FARMACO
window.esportaSingoloFarmaco = function (index) {
  const f = farmaci[index];
  const ora = f.ora || "08:00";

  let dataEvento = new Date();
  const parti = ora.split(":");
  dataEvento.setHours(parseInt(parti[0], 10), parseInt(parti[1], 10), 0, 0);

  let dtstart = formattaData(dataEvento);
  let dataFine = new Date(dataEvento.getTime() + 15 * 60000);
  let dtend = formattaData(dataFine);

  const mappaGiorniICS = {
    Lunedì: "MO",
    Martedì: "TU",
    Mercoledì: "WE",
    Giovedì: "TH",
    Venerdì: "FR",
    Sabato: "SA",
    Domenica: "SU",
  };

  let icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Salute App//IT",
    "BEGIN:VEVENT",
    `SUMMARY:💊 Terapia ore ${ora}`,
    `DESCRIPTION:Apri l'app Salute per controllare le assunzioni.`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
  ];

  if (f.frequenza === "Ogni giorno" || f.frequenza === "2-3 volte al giorno") {
    icsLines.push("RRULE:FREQ=DAILY");
  } else if (f.frequenza === "1 volta a settimana") {
    if (f.giorno && mappaGiorniICS[f.giorno]) {
      icsLines.push(`RRULE:FREQ=WEEKLY;BYDAY=${mappaGiorniICS[f.giorno]}`);
    } else {
      icsLines.push("RRULE:FREQ=WEEKLY");
    }
  }

  icsLines.push("END:VEVENT");
  icsLines.push("END:VCALENDAR");

  scaricaFileIcs(
    icsLines.join("\r\n"),
    `Terapia_ore_${ora.replace(":", "")}.ics`,
  );
};

// ESPORTA TUTTE LE TERAPIE IN UN UNICO FILE (SICURO CONTRO GLI ERRORI)
window.esportaTerapieRaggruppate = function () {
  if (!window.farmaci || farmaci.length === 0) {
    alert("Aggiungi prima almeno un farmaco.");
    return;
  }

  try {
    // Normalizziamo ogni orario in modo sicuro, gestendo eventuali valori mancanti o scritti male
    const orariUnici = [
      ...new Set(
        farmaci.map((f) => {
          let oraStr =
            f && f.ora ? String(f.ora).trim().replace(".", ":") : "08:00";
          if (!oraStr.includes(":")) oraStr = "08:00";
          return oraStr;
        }),
      ),
    ].sort((a, b) => {
      const partiA = a.split(":");
      const partiB = b.split(":");
      const oreA = parseInt(partiA[0], 10) || 0;
      const minA = parseInt(partiA[1], 10) || 0;
      const oreB = parseInt(partiB[0], 10) || 0;
      const minB = parseInt(partiB[1], 10) || 0;
      return oreA * 60 + minA - (oreB * 60 + minB);
    });

    if (orariUnici.length === 0) {
      alert("Nessun orario valido trovato nei farmaci.");
      return;
    }

    // Costruiamo il file ICS cumulativo
    let icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Salute App//IT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    orariUnici.forEach((ora) => {
      let dataEvento = new Date();
      const parti = ora.split(":");
      let ore = parseInt(parti[0], 10) || 8;
      let minuti = parseInt(parti[1], 10) || 0;

      dataEvento.setHours(ore, minuti, 0, 0);

      let dtstart = formattaData(dataEvento);
      let dataFine = new Date(dataEvento.getTime() + 15 * 60000);
      let dtend = formattaData(dataFine);

      icsLines.push(
        "BEGIN:VEVENT",
        `SUMMARY:💊 Terapia ore ${ora}`,
        `DESCRIPTION:Apri l'app Salute per controllare le assunzioni programmate.`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        "RRULE:FREQ=DAILY",
        "END:VEVENT",
      );
    });

    icsLines.push("END:VCALENDAR");

    // Download sicuro tramite Data URI
    const fileContent = icsLines.join("\r\n");
    const encodedUri =
      "data:text/calendar;charset=utf-8," + encodeURIComponent(fileContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Tutte_le_Terapie.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(
      `Sincronizzazione completata! Orari inclusi: ${orariUnici.join(", ")}`,
    );
  } catch (err) {
    console.error("Errore esportazione:", err);
    alert(
      "Si è verificato un errore durante la generazione del file. Controlla gli orari inseriti.",
    );
  }
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
      <div class="item-actions">
        <button class="btn success" onclick="esportaSingoloAppuntamento(${idx})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">📅 Cal</button>
        <button class="btn-delete" onclick="eliminaAppuntamento(${idx})">Elimina</button>
      </div>
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

window.esportaSingoloAppuntamento = function (index) {
  const a = appuntamenti[index];
  let d = new Date(a.data);
  if (isNaN(d)) return;

  let dtstart = formattaData(d);
  let dataFine = new Date(d.getTime() + 30 * 60000);
  let dtend = formattaData(dataFine);

  let icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Salute App//IT",
    "BEGIN:VEVENT",
    `SUMMARY:Visita ${a.titolo}`,
    `DESCRIPTION:Presso ${a.luogo || "Studio medico"}`,
    `LOCATION:${a.luogo || "Non specificato"}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  scaricaFileIcs(icsLines.join("\r\n"), `${a.titolo.replace(/\s+/g, "_")}.ics`);
};

// DOWNLOAD FILE ICS
function scaricaFileIcs(content, filename) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

// GESTIONE PDF
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
        <a href="${doc.dataBase64}" download="${doc.nome}.pdf" class="btn success" style="text-decoration:none; padding: 0.3rem 0.6rem; font-size: 0.8rem;">Apri</a>
        <button class="btn-delete" onclick="eliminaDocumento(${idx})">Elimina</button>
      </div>
    `;
    listaDocumenti.appendChild(li);
  });
}

cercaPdfInput.addEventListener("input", (e) =>
  salvaERendendiDocumenti(e.target.value),
);

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

// RIEPILOGO GIORNALIERO
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
    )
      return true;
    if (f.frequenza === "1 volta a settimana" && f.giorno === nomeGiornoOggi)
      return true;
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
      htmlContent += `<p>💊 <strong>Farmaci oggi (${farmaciOggi.length}):</strong> ${farmaciOggi.map((f) => `${f.nome} (${f.dosaggio}, ore ${f.ora})`).join(", ")}</p>`;
    }
    if (appuntamentiOggi.length > 0) {
      htmlContent += `<p>📅 <strong>Visite oggi (${appuntamentiOggi.length}):</strong> ${appuntamentiOggi.map((a) => `${a.titolo} a ${a.luogo}`).join(", ")}</p>`;
    }
  }
  riepilogoElem.innerHTML = htmlContent;
}

// BACKUP JSON
document.getElementById("btn-esporta").addEventListener("click", () => {
  const datiBackup = {
    farmaci: JSON.parse(localStorage.getItem("farmaci")) || [],
    appuntamenti: JSON.parse(localStorage.getItem("appuntamenti")) || [],
    documenti: JSON.parse(localStorage.getItem("documenti_salute")) || [],
  };
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(datiBackup, null, 2));
  const anchor = document.createElement("a");
  anchor.setAttribute("href", dataStr);
  anchor.setAttribute(
    "download",
    `backup_salute_${new Date().toISOString().slice(0, 10)}.json`,
  );
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
});

document.getElementById("file-importa").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const dati = JSON.parse(evt.target.result);
      if (dati.farmaci)
        localStorage.setItem("farmaci", JSON.stringify(dati.farmaci));
      if (dati.appuntamenti)
        localStorage.setItem("appuntamenti", JSON.stringify(dati.appuntamenti));
      if (dati.documenti)
        localStorage.setItem(
          "documenti_salute",
          JSON.stringify(dati.documenti),
        );
      alert("Backup ripristinato con successo!");
      location.reload();
    } catch (err) {
      alert("Errore nel file di backup.");
    }
  };
  reader.readAsText(file);
});

impostaSaluto();
salvaERendendiFarmaci();
salvaERendendiAppuntamenti();
salvaERendendiDocumenti();

// GESTIONE CAMBIO SCHEDA (NAVIGAZIONE IN BASSO)
const navButtons = document.querySelectorAll(".nav-btn");
const tabContents = document.querySelectorAll(".tab-content");

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");

    navButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((t) => t.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(targetId).classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
