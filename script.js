let heuresCreuses = [
  { nom: "après-midi", debut: 14 * 60 + 50, fin: 16 * 60 + 50 },
  { nom: "nuit", debut: 1 * 60 + 50, fin: 7 * 60 + 50 }
];

let appareils = {
  "seche-linge": { duree: 210, type: "fin" },
  "lave-linge": { duree: 120, type: "debut" },
  "lave-vaisselle": { duree: 210, type: "debut" }
};

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatHeure(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  const heures = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${heures.toString().padStart(2, '0')}h${minutes.toString().padStart(2, '0')}`;
}

function updateHeureActuelle() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  document.getElementById('horaire').value = `${h}:${m}`;
}

function getPlageHC(nowMins) {
  return heuresCreuses.map(hc => {
    const debutAbs = hc.debut + (hc.debut <= nowMins ? 1440 : 0);
    const finAbs = hc.fin + (hc.fin <= hc.debut ? 1440 : 0) + (hc.debut <= nowMins ? 1440 : 0);
    return { ...hc, debutAbs, finAbs };
  }).sort((a, b) => a.debutAbs - b.debutAbs);
}

function estDansHC(min, hc) {
  return hc.debut <= min % 1440 && min % 1440 < hc.fin;
}

function trouverMeilleureOption(nowMins, appareil, hcPlage) {
  const { duree, type } = appareils[appareil];
  let meilleur = null;

  // Tester 0h (départ immédiat)
  const debut0 = nowMins;
  const fin0 = type === "fin" ? nowMins + duree : nowMins + duree;
  const tempsHC0 = Math.max(0, Math.min(fin0, hcPlage.finAbs) - Math.max(debut0, hcPlage.debutAbs));
  meilleur = {
    heures: 0,
    tempsHC: tempsHC0,
    debut: debut0 % 1440,
    fin: fin0 % 1440
  };

  // Tester décalages de 1h à 24h
  for (let h = 1; h <= 24; h++) {
    let debutReel, finReel;
    if (type === "fin") {
      finReel = nowMins + h * 60;
      debutReel = finReel - duree;
      if (debutReel < nowMins) continue;
    } else {
      debutReel = nowMins + h * 60;
      finReel = debutReel + duree;
    }
    const tempsHC = Math.max(0, Math.min(finReel, hcPlage.finAbs) - Math.max(debutReel, hcPlage.debutAbs));
    if (tempsHC > meilleur.tempsHC) {
      meilleur = {
        heures: h,
        tempsHC,
        debut: debutReel % 1440,
        fin: finReel % 1440
      };
    }
  }
  return meilleur;
}

function calculer() {
  const appareil = document.getElementById('appareil').value;
  const nowMins = toMinutes(document.getElementById('horaire').value);
  const plages = getPlageHC(nowMins);

  const plageActuelle = heuresCreuses.find(hc => estDansHC(nowMins, hc));
  const plagePrincipale = plageActuelle ?
    { ...plageActuelle, debutAbs: plageActuelle.debut + (plageActuelle.debut > plageActuelle.fin ? 0 : 0), finAbs: plageActuelle.fin + (plageActuelle.fin <= plageActuelle.debut ? 1440 : 0) } :
    plages[0];

  const proposition = trouverMeilleureOption(nowMins, appareil, plagePrincipale);

  // Calculer proposition alternative sur la plage suivante
  const plageSuivante = plages.find(p => p.debutAbs > plagePrincipale.debutAbs);
  let alternative = null;
  if (plageSuivante) {
    const alt = trouverMeilleureOption(nowMins, appareil, plageSuivante);
    if (alt.tempsHC > proposition.tempsHC) {
      alternative = { ...alt, plage: plageSuivante };
    }
  }

  afficherResultat(proposition, appareil, plagePrincipale, alternative);
}

function afficherResultat(resultat, appareil, plageHC, alternative) {
  const res = document.getElementById('resultat');
  const dureeTotale = appareils[appareil].duree;
  const taux = ((resultat.tempsHC / dureeTotale) * 100).toFixed(1);

  let html = `<div style="border:1px solid #ccc; padding:10px; margin-bottom:10px">`
    + `<b>Proposition principale : Programmez ${resultat.heures}h</b><br>`
    + `Début : ${formatHeure(resultat.debut)}<br>`
    + `Fin : ${formatHeure(resultat.fin)}<br>`
    + `<i>${taux}% du cycle en heures creuses</i><br>`
    + `<small>Plage ciblée : ${formatHeure(plageHC.debutAbs)} - ${formatHeure(plageHC.finAbs)}</small>`
    + `</div>`;

  if (alternative) {
    const tauxAlt = ((alternative.tempsHC / dureeTotale) * 100).toFixed(1);
    html += `<div style="border:1px dashed #999; padding:10px;">
      <b>Alternative possible : Programmez ${alternative.heures}h</b><br>
      Début : ${formatHeure(alternative.debut)}<br>
      Fin : ${formatHeure(alternative.fin)}<br>
      <i>${tauxAlt}% du cycle en heures creuses</i><br>
      <small>Plage alternative : ${formatHeure(alternative.plage.debutAbs)} - ${formatHeure(alternative.plage.finAbs)}</small>
    </div>`;
  }

  res.innerHTML = html;
}

function afficherHeuresCreuses() {
  const hcBox = document.getElementById('heures-creuses');
  hcBox.innerHTML = heuresCreuses.map(hc =>
    `${formatHeure(hc.debut)} - ${formatHeure(hc.fin)}`
  ).join('<br>');
}

window.addEventListener('DOMContentLoaded', () => {
  updateHeureActuelle();
  afficherHeuresCreuses();
});
