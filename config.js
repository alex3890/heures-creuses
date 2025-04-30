function getAppareils() {
  return JSON.parse(localStorage.getItem("appareils")) || {
    "seche-linge": { duree: 210, type: "fin" },
    "lave-linge": { duree: 120, type: "debut" },
    "lave-vaisselle": { duree: 210, type: "debut" }
  };
}

function saveAppareils(appareils) {
  localStorage.setItem("appareils", JSON.stringify(appareils));
}

function getHeuresCreuses() {
  return JSON.parse(localStorage.getItem("heuresCreuses")) || [
    { nom: "après-midi", debut: 14 * 60 + 50, fin: 16 * 60 + 50 },
    { nom: "nuit", debut: 1 * 60 + 50, fin: 7 * 60 + 50 }
  ];
}

function saveHeuresCreuses(hc) {
  localStorage.setItem("heuresCreuses", JSON.stringify(hc));
}
