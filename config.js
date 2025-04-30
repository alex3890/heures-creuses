let appareils = JSON.parse(localStorage.getItem('appareils')) || [
  { nom: "Sèche-linge", duree: 210, type: "fin" },
  { nom: "Lave-linge", duree: 120, type: "debut" },
  { nom: "Lave-vaisselle", duree: 210, type: "debut" }
];

let heuresCreuses = JSON.parse(localStorage.getItem('heuresCreuses')) || [
  { nom: "Après-midi", debut: "14:50", fin: "16:50" },
  { nom: "Nuit", debut: "01:50", fin: "07:50" }
];