function chargerConfig() {
  const appareils = JSON.parse(localStorage.getItem('appareils') || '{}');
  const heuresCreuses = JSON.parse(localStorage.getItem('heuresCreuses') || '[]');
  return { appareils, heuresCreuses };
}

function sauvegarder(appareils, heuresCreuses) {
  localStorage.setItem('appareils', JSON.stringify(appareils));
  localStorage.setItem('heuresCreuses', JSON.stringify(heuresCreuses));
}
