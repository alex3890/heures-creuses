// Chargement des données depuis le localStorage ou valeurs par défaut
let appareils = JSON.parse(localStorage.getItem("appareils")) || {
  "seche-linge": { duree: 210, type: "fin" },
  "lave-linge": { duree: 120, type: "debut" },
  "lave-vaisselle": { duree: 210, type: "debut" }
};

let heuresCreuses = JSON.parse(localStorage.getItem("heuresCreuses")) || [
  { nom: "après-midi", debut: 14 * 60 + 50, fin: 16 * 60 + 50 },
  { nom: "nuit", debut: 1 * 60 + 50, fin: 7 * 60 + 50 }
];

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatHeure(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  const heures = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${heures.toString().padStart(2, "0")}h${minutes.toString().padStart(2, "0")}`;
}

function getProchainePlage(nowMins) {
  const plagesTriees = [...heuresCreuses].map(plage => {
    const debut = plage.debut;
    const fin = plage.fin < debut ? plage.fin + 1440 : plage.fin;
    const start = debut < nowMins ? debut + 1440 : debut;
    return { ...plage, debut, fin, start };
  }).sort((a, b) => a.start - b.start);

  return plagesTriees[0];
}

function calculer() {
  const appareil = document.getElementById("appareil").value;
  const { duree, type } = appareils[appareil];
  const nowMins = toMinutes(document.getElementById("horaire").value);
  const plage = getProchainePlage(nowMins);

  const hcStart = plage.debut < nowMins ? plage.debut + 1440 : plage.debut;
  const hcEnd = plage.fin < hcStart ? plage.fin + 1440 : plage.fin;

  let meilleur;

  if (type === "fin") {
    let maxFin = hcEnd;
    let meilleurTempsHC = -1;
    let meilleurH = 0;

    for (let h = 1; h <= 24; h++) {
      const finReelle = nowMins + h * 60;
      const debutReel = finReelle - duree;
      const tempsHC = Math.max(0, Math.min(finReelle, hcEnd) - Math.max(debutReel, hcStart));

      if (tempsHC > meilleurTempsHC) {
        meilleurTempsHC = tempsHC;
        meilleurH = h;
        meilleur = {
          debut: debutReel % 1440,
          fin: finReelle % 1440,
          heures: h,
          tempsHC
        };
      }
    }
  } else {
    let meilleurTempsHC = -1;
    let meilleurH = 0;

    for (let h = 1; h <= 24; h++) {
      const debutReel = nowMins + h * 60;
      const finReel = debutReel + duree;
      const tempsHC = Math.max(0, Math.min(finReel, hcEnd) - Math.max(debutReel, hcStart));

      if (tempsHC > meilleurTempsHC) {
        meilleurTempsHC = tempsHC;
        meilleurH = h;
        meilleur = {
          debut: debutReel % 1440,
          fin: finReel % 1440,
          heures: h,
          tempsHC
        };
      }
    }
  }

  afficherResultat(meilleur, appareil);
}

function afficherResultat(resultat, appareil) {
  const res = document.getElementById("resultat");
  const dureeTotale = appareils[appareil].duree;
  const taux = ((resultat.tempsHC / dureeTotale) * 100).toFixed(1);

  res.innerHTML = resultat.tempsHC > 0 ? `
    <b>Programmez ${resultat.heures}h</b><br>
    Début : ${formatHeure(resultat.debut)}<br>
    Fin : ${formatHeure(resultat.fin)}<br>
    <i>${taux}% du cycle en heures creuses</i>
  ` : "Aucun créneau disponible dans la prochaine plage HC.";
}

window.onload = function () {
  const now = new Date();
  document.getElementById("horaire").value =
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const select = document.getElementById("appareil");
  select.innerHTML = "";
  for (const key in appareils) {
    const opt = document.createElement("option");
    opt.value = key;
    const type = appareils[key].type === "fin" ? "fin" : "début";
    opt.textContent = `${key} (${appareils[key].duree / 60}h, ${type})`;
    select.appendChild(opt);
  }

  const hcList = document.getElementById("heures-creuses");
  if (hcList) {
    hcList.innerHTML = "<b>Heures creuses :</b><br>" + heuresCreuses.map(hc => {
      return `${hc.nom} : ${formatHeure(hc.debut)} - ${formatHeure(hc.fin)}`;
    }).join("<br>");
  }
};
