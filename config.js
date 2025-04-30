function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatHeure(m) {
  m = (m + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, '0')}h${min.toString().padStart(2, '0')}`;
}

function charger() {
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

  afficher();
}

function afficher() {
  const appareils = JSON.parse(localStorage.getItem("appareils"));
  const hc = JSON.parse(localStorage.getItem("heuresCreuses"));

  const aDiv = document.getElementById("appareilsList");
  aDiv.innerHTML = "";
  Object.entries(appareils).forEach(([nom, val]) => {
    aDiv.innerHTML += `${nom} – ${val.duree} min (${val.type})<br>`;
  });

  const hDiv = document.getElementById("heuresCreusesList");
  hDiv.innerHTML = "";
  hc.forEach(p => {
    hDiv.innerHTML += `${p.nom}: ${formatHeure(p.debut)} – ${formatHeure(p.fin)}<br>`;
  });
}

function ajouterAppareil() {
  const nom = document.getElementById("nomAppareil").value;
  const duree = parseInt(document.getElementById("dureeAppareil").value, 10);
  const type = document.getElementById("typeAppareil").value;

  if (!nom || !duree || !["debut", "fin"].includes(type)) return;

  const appareils = JSON.parse(localStorage.getItem("appareils"));
  appareils[nom] = { duree, type };
  localStorage.setItem("appareils", JSON.stringify(appareils));
  afficher();
}

function ajouterPlage() {
  const debut = document.getElementById("debutHC").value;
  const fin = document.getElementById("finHC").value;

  if (!debut || !fin) return;

  const heuresCreuses = JSON.parse(localStorage.getItem("heuresCreuses"));
  heuresCreuses.push({ nom: "personnalisée", debut: toMinutes(debut), fin: toMinutes(fin) });
  localStorage.setItem("heuresCreuses", JSON.stringify(heuresCreuses));
  afficher();
}

function sauvegarder() {
  alert("Configuration enregistrée !");
}

window.addEventListener("DOMContentLoaded", charger);
