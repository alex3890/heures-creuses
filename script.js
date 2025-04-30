function toMinutes(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

function formatHeure(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}h${m.toString().padStart(2, '0')}`;
}

function chargerDonnees() {
  const data = localStorage.getItem('appareils');
  const hcData = localStorage.getItem('heuresCreuses');
  const appareils = data ? JSON.parse(data) : {};
  const heuresCreuses = hcData ? JSON.parse(hcData) : [
    { debut: "01:50", fin: "07:50" },
    { debut: "14:50", fin: "16:50" }
  ];
  return { appareils, heuresCreuses };
}

function getProchainePlage(hcList, nowMins) {
  let meilleure = null;
  let diffMin = Infinity;
  for (const hc of hcList) {
    const debut = toMinutes(hc.debut);
    const t = debut < nowMins ? debut + 1440 : debut;
    const diff = t - nowMins;
    if (diff < diffMin) {
      diffMin = diff;
      meilleure = hc;
    }
  }
  return meilleure;
}

function calculer() {
  const { appareils, heuresCreuses } = chargerDonnees();
  const nomAppareil = document.getElementById('appareil').value;
  const appareil = appareils[nomAppareil];
  if (!appareil) return;

  const now = document.getElementById('horaire').value;
  const nowMins = toMinutes(now);

  const plage = getProchainePlage(heuresCreuses, nowMins);
  const hcStart = toMinutes(plage.debut);
  const hcEnd = toMinutes(plage.fin) + (toMinutes(plage.fin) <= toMinutes(plage.debut) ? 1440 : 0);

  let meilleur = null;
  let maxHC = -1;

  for (let h = 0; h <= 24; h++) {
    const offset = h * 60;
    let debut, fin;

    if (appareil.type === "fin") {
      fin = nowMins + offset;
      debut = fin - appareil.duree;
    } else {
      debut = nowMins + offset;
      fin = debut + appareil.duree;
    }

    const overlap = Math.max(0, Math.min(fin, hcEnd) - Math.max(debut, hcStart));
    if (overlap > maxHC) {
      maxHC = overlap;
      meilleur = { h, debut: debut % 1440, fin: fin % 1440 };
    }
  }

  const pourcentage = ((maxHC / appareil.duree) * 100).toFixed(1);
  const res = document.getElementById('resultat');
  res.innerHTML = `
    <b>Programmez ${meilleur.h}h</b><br>
    Début : ${formatHeure(meilleur.debut)}<br>
    Fin : ${formatHeure(meilleur.fin)}<br>
    <i>${pourcentage}% du cycle en heures creuses</i>
  `;
}

window.onload = () => {
  const heure = document.getElementById('horaire');
  const now = new Date();
  heure.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const { appareils, heuresCreuses } = chargerDonnees();
  const select = document.getElementById('appareil');
  for (const nom in appareils) {
    const opt = document.createElement('option');
    opt.value = nom;
    opt.textContent = nom;
    select.appendChild(opt);
  }

  const hcBox = document.getElementById('plages-hc');
  hcBox.innerHTML = "<b>Plages d'heures creuses :</b><br>" +
    heuresCreuses.map(p => `${p.debut} - ${p.fin}`).join("<br>");
};
