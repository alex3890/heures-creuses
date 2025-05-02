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

function getProchainePlage(nowMins) {
  let minDiff = Infinity;
  let prochaine = null;

  for (const hc of heuresCreuses) {
    let debutAbs = hc.debut;
    if (debutAbs <= nowMins) debutAbs += 1440;

    const diff = debutAbs - nowMins;
    if (diff < minDiff) {
      minDiff = diff;
      prochaine = {
        ...hc,
        debutAbs: debutAbs,
        finAbs: hc.fin + (hc.fin <= hc.debut ? 1440 : 0) + (debutAbs >= 1440 ? 1440 : 0)
      };
    }
  }

  return prochaine;
}

function calculer() {
  const appareil = document.getElementById('appareil').value;
  const { duree, type } = appareils[appareil];
  const nowMins = toMinutes(document.getElementById('horaire').value);

  // Cherche si on est actuellement dans une plage HC
  const plageActuelle = heuresCreuses.find(hc => {
    const debut = hc.debut;
    const fin = hc.fin > debut ? hc.fin : hc.fin + 1440;
    const now = nowMins < debut ? nowMins + 1440 : nowMins;
    return now >= debut && now < fin;
  });

  const plagePrincipale = plageActuelle || getProchainePlage(nowMins);
  const debutHC = plagePrincipale.debut;
  const finHC = plagePrincipale.fin;

  const debutAbs = debutHC + (debutHC <= nowMins ? 1440 : 0);
  const finAbs = finHC + (finHC <= debutHC ? 1440 : 0) + (debutAbs >= 1440 ? 1440 : 0);

  let meilleur = { heures: -1, tempsHC: -1 };
  let alternative = null;

  function calculerMeilleur(hcStart, hcEnd) {
    let meilleurLocal = { heures: -1, tempsHC: -1 };
    for (let h = 0; h <= 24; h++) {
      let debutReel, finReel;
      if (type === "fin") {
        finReel = nowMins + h * 60;
        debutReel = finReel - duree;
        if (debutReel < nowMins) continue;
      } else {
        debutReel = nowMins + h * 60;
        finReel = debutReel + duree;
      }

      const tempsHC = Math.max(0, Math.min(finReel, hcEnd) - Math.max(debutReel, hcStart));
      if (tempsHC > meilleurLocal.tempsHC) {
        meilleurLocal = {
          heures: h,
          tempsHC,
          debut: debutReel % 1440,
          fin: finReel % 1440
        };
      }
    }
    return meilleurLocal;
  }

  // Proposition principale
  meilleur = calculerMeilleur(debutAbs, finAbs);
  plagePrincipale.debutAbs = debutAbs;
  plagePrincipale.finAbs = finAbs;

  // Proposition alternative (cycle suivant)
  const prochainePlage = getProchainePlage(plagePrincipale.finAbs);
  const debutAlt = prochainePlage.debut + 1440;
  const finAlt = prochainePlage.fin + (prochainePlage.fin <= prochainePlage.debut ? 1440 : 0) + 1440;

  const alt = calculerMeilleur(debutAlt, finAlt);
  if (alt.tempsHC > meilleur.tempsHC) {
    alternative = alt;
    prochainePlage.debutAbs = debutAlt;
    prochainePlage.finAbs = finAlt;
  }

  afficherResultat(meilleur, appareil, plagePrincipale, alternative, prochainePlage);
}

function afficherResultat(resultat, appareil, plageHC, alternative, altPlage) {
  const res = document.getElementById('resultat');
  const dureeTotale = appareils[appareil].duree;

  let html = `
    <div style="border: 2px solid #4caf50; padding: 10px; margin-bottom: 10px;">
      <b>Proposition principale : Programmez ${resultat.heures}h</b><br>
      Début : ${formatHeure(resultat.debut)}<br>
      Fin : ${formatHeure(resultat.fin)}<br>
      <i>${((resultat.tempsHC / dureeTotale) * 100).toFixed(1)}% du cycle en heures creuses</i><br>
      <small>Plage ciblée : ${formatHeure(plageHC.debutAbs)} - ${formatHeure(plageHC.finAbs)}</small>
    </div>
  `;

  if (alternative) {
    html += `
      <div style="border: 2px dashed #2196f3; padding: 10px;">
        <b>Alternative possible : Programmez ${alternative.heures}h</b><br>
        Début : ${formatHeure(alternative.debut)}<br>
        Fin : ${formatHeure(alternative.fin)}<br>
        <i>${((alternative.tempsHC / dureeTotale) * 100).toFixed(1)}% du cycle en heures creuses</i><br>
        <small>Plage ciblée : ${formatHeure(altPlage.debutAbs)} - ${formatHeure(altPlage.finAbs)}</small>
      </div>
    `;
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
