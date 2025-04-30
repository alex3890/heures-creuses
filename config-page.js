function afficherAppareils() {
  const cont = document.getElementById("liste-appareils");
  const appareils = getAppareils();
  cont.innerHTML = Object.entries(appareils).map(([nom, obj]) =>
    `<div>${nom} - ${obj.duree}min - ${obj.type}</div>`
  ).join("");
}

function ajouterAppareil() {
  const nom = document.getElementById("nomAppareil").value;
  const duree = parseInt(document.getElementById("dureeAppareil").value);
  const type = document.getElementById("typeAppareil").value;

  if (!nom || isNaN(duree)) return alert("Remplir tous les champs");

  const appareils = getAppareils();
  appareils[nom] = { duree, type };
  saveAppareils(appareils);
  afficherAppareils();
}

function afficherHC() {
  const cont = document.getElementById("liste-hc");
  const hc = getHeuresCreuses();
  cont.innerHTML = hc.map(h =>
    `<div>${h.nom} - ${format(h.debut)} à ${format(h.fin)}</div>`
  ).join("");
}

function format(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}h${m}`;
}

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function ajouterHC() {
  const nom = document.getElementById("nomHC").value;
  const debut = toMinutes(document.getElementById("debutHC").value);
  const fin = toMinutes(document.getElementById("finHC").value);

  if (!nom || isNaN(debut) || isNaN(fin)) return alert("Champs invalides");

  const hc = getHeuresCreuses();
  const index = hc.findIndex(h => h.nom === nom);
  if (index >= 0) hc[index] = { nom, debut, fin };
  else hc.push({ nom, debut, fin });

  saveHeuresCreuses(hc);
  afficherHC();
}

document.addEventListener("DOMContentLoaded", () => {
  afficherAppareils();
  afficherHC();
});
