function saveConfig() {
  const appareils = {};
  const lignes = document.querySelectorAll(".ligne-appareil");
  lignes.forEach(ligne => {
    const nom = ligne.querySelector(".nom").value.trim();
    const duree = parseInt(ligne.querySelector(".duree").value.trim(), 10);
    const type = ligne.querySelector(".type").value;
    if (nom && !isNaN(duree)) {
      appareils[nom] = { duree, type };
    }
  });

  const heuresCreuses = [];
  const plages = document.querySelectorAll(".plage-hc");
  plages.forEach(p => {
    const nom = p.querySelector(".nom-hc").value.trim();
    const debut = toMinutes(p.querySelector(".debut").value);
    const fin = toMinutes(p.querySelector(".fin").value);
    if (nom && !isNaN(debut) && !isNaN(fin)) {
      heuresCreuses.push({ nom, debut, fin });
    }
  });

  localStorage.setItem("appareils", JSON.stringify(appareils));
  localStorage.setItem("heuresCreuses", JSON.stringify(heuresCreuses));
  alert("Configuration enregistrée !");
}

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

window.onload = function () {
  const appareils = JSON.parse(localStorage.getItem("appareils")) || {};
  const heuresCreuses = JSON.parse(localStorage.getItem("heuresCreuses")) || [];

  const appareilsDiv = document.getElementById("appareils");
  for (const nom in appareils) {
    const { duree, type } = appareils[nom];
    appareilsDiv.innerHTML += `
      <div class="ligne-appareil">
        <input class="nom" value="${nom}" placeholder="Nom">
        <input class="duree" type="number" value="${duree}" placeholder="Durée (min)">
        <select class="type">
          <option value="debut" ${type === "debut" ? "selected" : ""}>Début</option>
          <option value="fin" ${type === "fin" ? "selected" : ""}>Fin</option>
        </select>
      </div>`;
  }

  const hcDiv = document.getElementById("heures-creuses-config");
  heuresCreuses.forEach(({ nom, debut, fin }) => {
    hcDiv.innerHTML += `
      <div class="plage-hc">
        <input class="nom-hc" value="${nom}" placeholder="Nom">
        <input class="debut" type="time" value="${formatTime(debut)}">
        <input class="fin" type="time" value="${formatTime(fin)}">
      </div>`;
  });
};
