function afficherConfig() {
  const { appareils, heuresCreuses } = chargerConfig();

  const listeApp = document.getElementById('listeAppareils');
  listeApp.innerHTML = '';
  for (const nom in appareils) {
    const li = document.createElement('li');
    const a = appareils[nom];
    li.textContent = `${nom} - ${a.duree} min - ${a.type}`;
    listeApp.appendChild(li);
  }

  const listeHC = document.getElementById('listeHC');
  listeHC.innerHTML = '';
  heuresCreuses.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.debut} - ${p.fin}`;
    listeHC.appendChild(li);
  });
}

function ajouterAppareil() {
  const nom = document.getElementById('nomAppareil').value;
  const duree = parseInt(document.getElementById('dureeAppareil').value);
  const type = document.getElementById('typeAppareil').value;

  if (!nom || !duree) return;

  const { appareils, heuresCreuses } = chargerConfig();
  appareils[nom] = { duree, type };
  sauvegarder(appareils, heuresCreuses);
  afficherConfig();
}

function ajouterHC() {
  const debut = document.getElementById('debutHC').value;
  const fin = document.getElementById('finHC').value;

  if (!debut || !fin) return;

  const { appareils, heuresCreuses } = chargerConfig();
  const exist = heuresCreuses.find(p => p.debut === debut && p.fin === fin);
  if (!exist) heuresCreuses.push({ debut, fin });
  sauvegarder(appareils, heuresCreuses);
  afficherConfig();
}

window.onload = afficherConfig;
