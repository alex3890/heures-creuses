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

  const plageHC = getProchainePlage(nowMins);
  const hcStart = plageHC.debutAbs;
  const hcEnd = plageHC.finAbs;

  let meilleur = { heures: 0, tempsHC: 0 };

  let alternative = { heures: 0, tempsHC: 0 };

  if (type === "fin") {
    // Le cycle doit se terminer à une heure pleine <= hcEnd
    for (let h = 1; h <= 24; h++) {
      const finReelle = nowMins + h * 60;
      const debutReel = finReelle - duree;
      if (debutReel < nowMins) continue;
      const tempsHC = Math.max(0, Math.min(finReelle, hcEnd) - Math.max(debutReel, hcStart));
      if (tempsHC > meilleur.tempsHC) {
        meilleur = {
          heures: h,
          tempsHC,
          debut: debutReel % 1440,
          fin: finReelle % 1440
        };
      }
    }

    // Vérifier la plage suivante
    const plageSuivante = getProchainePlage(hcEnd + 1);
    const hcStartSuivante = plageSuivante.debutAbs;
    const hcEndSuivante = plageSuivante.finAbs;

    for (let h = 1; h <= 24; h++) {
      const finReelle = hcStartSuivante + h * 60;
      const debutReel = finReelle - duree;
      const tempsHC = Math.max(0, Math.min(finReelle, hcEndSuivante) - Math.max(debutReel, hcStartSuivante));
      if (tempsHC > alternative.tempsHC) {
        alternative = {
          heures: h,
          tempsHC,
          debut: debutReel % 1440,
          fin: finReelle % 1440
        };
      }
    }
  } else {
    // Le cycle doit commencer à une heure pleine >= nowMins
    for (let h = 1; h <= 24; h++) {
      const debutReel = nowMins + h * 60;
      const finReel = debutReel + duree;
      const tempsHC = Math.max(0, Math.min(finReel, hcEnd) - Math.max(debutReel, hcStart));
      if (tempsHC > meilleur.tempsHC) {
        meilleur = {
          heures: h,
          tempsHC,
          debut: debutReel % 1440,
          fin: finReel % 1440
        };
      }
    }

    // Vérifier la plage suivante
    const plageSuivante = getProchainePlage(hcEnd + 1);
    const hcStartSuivante = plageSuivante.debutAbs;
    const hcEndSuivante = plageSuivante.finAbs;

    for (let h = 1; h <= 24; h++) {
      const debutReel = hcStartSuivante + h * 60;
      const finReel = debutReel + duree;
      const tempsHC = Math.max(0, Math.min(finReel, hcEndSuivante) - Math.max(debutReel, hcStartSuivante));
      if (tempsHC > alternative.tempsHC) {
        alternative = {
          heures: h,
          tempsHC,
          debut: debutReel % 1440,
          fin: finReel % 1440
        };
      }
    }
  }

  // N'afficher l'alternative que si elle est strictement meilleure
  if (alternative.tempsHC > meilleur.tempsHC) {
    afficherResultat(meilleur, appareil, plageHC, alternative);
  } else {
    afficherResultat(meilleur, appareil, plageHC);
  }
}

function afficherResultat(resultat, appareil, plageHC, alternative) {
  const res = document.getElementById('resultat');
  const dureeTotale = appareils[appareil].duree;
  const taux = ((resultat.tempsHC / dureeTotale) * 100).toFixed(1);

  let html = `
    <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 8px; background-color: #f9f9f9;">
      <b>Proposition principale</b><br>
      Programmez <b>${resultat.heures}h</b><br>
      Début : ${formatHeure(resultat.debut)}<br>
      Fin : ${formatHeure(resultat.fin)}<br>
      <i>${taux}% du cycle en heures creuses</i><br>
      <small>Plage ciblée : ${formatHeure(plageHC.debutAbs)} - ${formatHeure(plageHC.finAbs)}</small>
    </div>
  `;

  // Afficher l'alternative uniquement si elle est strictement meilleure
  if (alternative && alternative.tempsHC > resultat.tempsHC) {
    const tauxAlternative = ((alternative.tempsHC / dureeTotale) * 100).toFixed(1);
    html += `
      <div style="border: 1px solid #90caf9; padding: 10px; border-radius: 8px; background-color: #e3f2fd;">
        <b>Proposition alternative (plus avantageuse en heures creuses)</b><br>
        Programmez <b>${alternative.heures}h</b><br>
        Début : ${formatHeure(alternative.debut)}<br>
        Fin : ${formatHeure(alternative.fin)}<br>
        <i>${tauxAlternative}% du cycle en heures creuses</i><br>
        <small>Plage suivante : ${formatHeure(plageHC.debutAbs)} - ${formatHeure(plageHC.finAbs)}</small>
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
