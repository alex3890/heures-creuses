function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatHeure(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  const heures = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${heures.toString().padStart(2,'0')}h${minutes.toString().padStart(2,'0')}`;
}

function chargerConfig() {
  if (!localStorage.getItem("appareils")) {
    localStorage.setItem("appareils", JSON.stringify({
      "seche-linge": { duree: 210, type: "fin" },
      "lave-linge": { duree: 120, type: "debut" },
      "lave-vaisselle": { duree: 210, type: "debut" }
    }));
  }

  if (!localStorage.getItem("heuresCreuses")) {
    localStorage.setItem("heuresCreuses", JSON.stringify([
      { nom: "après-midi", debut: 14 * 60 + 50, fin: 16 * 60 + 50 },
      { nom: "nuit", debut: 1 * 60 + 50, fin: 7 * 60 + 50 }
    ]));
  }

  return {
    appareils: JSON.parse(localStorage.getItem("appareils")),
    heuresCreuses: JSON.parse(localStorage.getItem("heuresCreuses"))
  };
}

function getProchainePlage(nowMins, hcList) {
  const sorted = [...hcList].sort((a, b) => a.debut - b.debut);
  for (let plage of sorted) {
    const debut = plage.debut;
    const fin = plage.fin > plage.debut ? plage.fin : plage.fin + 1440;
    if (nowMins < debut) return plage;
  }
  return sorted[0]; // prochaine dispo après minuit
}

function calculer() {
  const { appareils, heuresCreuses } = chargerConfig();
  const appareilId = document.getElementById("appareil").value;
  const { duree, type } = appareils[appareilId];
  const nowMins = toMinutes(document.getElementById("horaire").value);
  const plage = getProchainePlage(nowMins, heuresCreuses);

  const hcStart = plage.debut;
  const hcEnd = plage.fin > plage.debut ? plage.fin : plage.fin + 1440;

  let resultat = null;

  if (type === "fin") {
    for (let h = 1; h <= 12; h++) {
      const fin = nowMins + h * 60;
      const debut = fin - duree;
      const overlap = Math.max(0, Math.min(fin, hcEnd) - Math.max(debut, hcStart));
      if (!resultat || overlap > resultat.tempsHC) {
        resultat = { heures: h, tempsHC: overlap, debut, fin };
      }
    }
  } else {
    for (let h = 1; h <= 12; h++) {
      const debut = nowMins + h * 60;
      const fin = debut + duree;
      const overlap = Math.max(0, Math.min(fin, hcEnd) - Math.max(debut, hcStart));
      if (!resultat || overlap > resultat.tempsHC) {
        resultat = { heures: h, tempsHC: overlap, debut, fin };
      }
    }
  }

  const res = document.getElementById("resultat");
  if (resultat.tempsHC > 0) {
    const pct = ((resultat.tempsHC / duree) * 100).toFixed(1);
    res.innerHTML = `
      <b>Programmez ${resultat.heures}h</b><br>
      Début : ${formatHeure(resultat.debut)}<br>
      Fin : ${formatHeure(resultat.fin)}<br>
      <i>${pct}% du cycle en heures creuses</i>
    `;
  } else {
    res.innerHTML = "Aucun créneau viable dans la prochaine plage HC";
  }
}

function chargerInterface() {
  const { appareils, heuresCreuses } = chargerConfig();

  const select = document.getElementById("appareil");
  for (let nom in appareils) {
    const opt = document.createElement("option");
    opt.value = nom;
    opt.textContent = nom;
    select.appendChild(opt);
  }

  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  document.getElementById("horaire").value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const infoDiv = document.getElementById("hcInfo");
  infoDiv.innerHTML = heuresCreuses.map(p => {
    return `• ${p.nom}: ${formatHeure(p.debut)} – ${formatHeure(p.fin)}`;
  }).join("<br>");
}

window.addEventListener("DOMContentLoaded", chargerInterface);
