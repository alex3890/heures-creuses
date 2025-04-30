// Chargement depuis le localStorage ou valeurs par défaut
function chargerAppareils() {
  return JSON.parse(localStorage.getItem('appareils')) || {
    "seche-linge": { duree: 210, type: "fin" },    // 3h30
    "lave-linge": { duree: 120, type: "debut" },   // 2h
    "lave-vaisselle": { duree: 210, type: "debut" }// 3h30
  };
}

function chargerHeuresCreuses() {
  return JSON.parse(localStorage.getItem('heuresCreuses')) || [
    { nom: "après-midi", debut: 14 * 60 + 50, fin: 16 * 60 + 50 },
    { nom: "nuit", debut: 1 * 60 + 50, fin: 7 * 60 + 50 }
  ];
}

let appareils = chargerAppareils();
let heuresCreuses = chargerHeuresCreuses();

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

function getProchainePlage(nowMins) {
  const maintenant = nowMins;
  let prochaines = heuresCreuses
    .map(p => {
      let debut = p.debut;
      let fin = p.fin;
      if (fin <= debut) fin += 1440;
      if (debut <= maintenant) {
        debut += 1440;
        fin += 1440;
      }
      return { ...p, debut, fin };
    })
    .sort((a, b) => a.debut - b.debut);
  return prochaines[0];
}

function calculer() {
  appareils = chargerAppareils();
  heuresCreuses = chargerHeuresCreuses();

  const appareilNom = document.getElementById('appareil').value;
  const { duree, type } = appareils[appareilNom];
  const nowMins = toMinutes(document.getElementById('horaire').value);

  const plage = getProchainePlage(nowMins);

  const hcStart = plage.debut;
  const hcEnd = plage.fin;

  let resultat;

  if (type === "fin") {
    // Programme par heure de fin, donc on teste des heures pleines qui finissent dans la HC
    for (let h = 1; h <= 12; h++) {
      const finCandidat = nowMins + h * 60;
      const debut = finCandidat - duree;
      if (debut >= nowMins && debut < hcEnd) {
        const tempsHC = Math.max(0, Math.min(finCandidat, hcEnd) - Math.max(debut, hcStart));
        if (!resultat || tempsHC > resultat.tempsHC) {
          resultat = { heures: h, tempsHC, debut: debut % 1440, fin: finCandidat % 1440 };
        }
      }
    }
  } else {
    // Programme par heure de début, donc on teste des heures pleines à partir de maintenant
    for (let h = 1; h <= 12; h++) {
      const debut = nowMins + h * 60;
      const fin = debut + duree;
      if (debut >= nowMins && debut < hcEnd) {
        const tempsHC = Math.max(0, Math.min(fin, hcEnd) - Math.max(debut, hcStart));
        if (!resultat || tempsHC > resultat.tempsHC) {
          resultat = { heures: h, tempsHC, debut: debut % 1440, fin: fin % 1440 };
        }
      }
    }
  }

  afficherResultat(resultat, appareilNom);
}

function afficherResultat(resultat, appareil) {
  const res = document.getElementById('resultat');
  const dureeTotale = appareils[appareil].duree;
  const taux = ((resultat.tempsHC / dureeTotale) * 100).toFixed(1);

  if (resultat && resultat.tempsHC > 0) {
    res.innerHTML = `
      <b>Programmez ${resultat.heures}h</b><br>
      Début : ${formatHeure(resultat.debut)}<br>
      Fin : ${formatHeure(resultat.fin)}<br>
      <i>${taux}% du cycle en heures creuses</i>
    `;
  } else {
    res.innerHTML = "Aucun créneau disponible dans la prochaine plage HC";
  }
}

function chargerInterface() {
  const select = document.getElementById('appareil');
  appareils = chargerAppareils();
  heuresCreuses = chargerHeuresCreuses();

  select.innerHTML = '';
  for (const nom in appareils) {
    const option = document.createElement('option');
    option.value = nom;
    option.textContent = nom;
    select.appendChild(option);
  }

  // Affiche les heures creuses actuelles
  const hcDiv = document.getElementById('heures-creuses');
  hcDiv.innerHTML = '<b>Heures creuses :</b><br>' + heuresCreuses.map(hc =>
    `${hc.nom} : ${formatHeure(hc.debut)} - ${formatHeure(hc.fin)}`
  ).join('<br>');
}

// Met à jour automatiquement l'heure actuelle dans le champ
function initialiserHeureActuelle() {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  document.getElementById('horaire').value = `${hh}:${mm}`;
}

// Réagit aux modifications du localStorage
window.addEventListener('storage', (event) => {
  if (event.key === 'appareils' || event.key === 'heuresCreuses') {
    chargerInterface();
  }
});

// Initialisation
window.addEventListener('DOMContentLoaded', () => {
  chargerInterface();
  initialiserHeureActuelle();
});
