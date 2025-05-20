// Configuration des plages et appareils
let heuresCreuses = [
    { nom: "après-midi", debut: "14:50", fin: "16:50" },
    { nom: "nuit", debut: "01:50", fin: "07:50" }
];

let appareils = {
    "seche-linge": { duree: 203, type: "fin", pas: 60 },
    "lave-linge": { duree: 60, type: "debut", pas: 10 },
    "lave-vaisselle": { duree: 210, type: "debut", pas: 60 }
};

// Fonctions utilitaires
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
    document.getElementById('horaire').value = 
        now.getHours().toString().padStart(2, '0') + ':' + 
        now.getMinutes().toString().padStart(2, '0');
}

function getPlageHC(nowMins) {
    return heuresCreuses.map(hc => {
        const debut = toMinutes(hc.debut);
        const fin = toMinutes(hc.fin);
        return {
            nom: hc.nom,
            debut: debut,
            fin: fin,
            debutAbs: debut + (debut <= nowMins ? 1440 : 0),
            finAbs: fin + (fin <= debut ? 1440 : 0) + (debut <= nowMins ? 1440 : 0)
        };
    }).sort((a, b) => a.debutAbs - b.debutAbs);
}

function trouverMeilleureOption(nowMins, appareil, hcPlage) {
    const config = appareils[appareil];
    let meilleur = null;

    // Test départ immédiat
    let debut0 = nowMins;
    let fin0 = config.type === "fin" ? nowMins + config.duree : nowMins + config.duree;
    let tempsHC0 = Math.max(0, Math.min(fin0, hcPlage.finAbs) - Math.max(debut0, hcPlage.debutAbs));
    meilleur = { decalage: 0, tempsHC: tempsHC0, debut: debut0 % 1440, fin: fin0 % 1440 };

    // Boucle avec pas personnalisé
    for (let decalage = config.pas; decalage <= 24 * 60; decalage += config.pas) {
        let debutReel, finReel;
        
        if (config.type === "fin") {
            finReel = nowMins + decalage;
            debutReel = finReel - config.duree;
            if (debutReel < nowMins) continue;
        } else {
            debutReel = nowMins + decalage;
            finReel = debutReel + config.duree;
        }

        const tempsHC = Math.max(0, Math.min(finReel, hcPlage.finAbs) - Math.max(debutReel, hcPlage.debutAbs));
        
        if (tempsHC > meilleur.tempsHC) {
            meilleur = { decalage, tempsHC, debut: debutReel % 1440, fin: finReel % 1440 };
        }
    }
    return meilleur;
}

function estDansHC(nowMins, hc) {
    const debut = toMinutes(hc.debut);
    const fin = toMinutes(hc.fin);
    const minActuelle = nowMins % 1440;
    
    if (debut < fin) {
        // Plage standard (ex: 14h50-16h50)
        return minActuelle >= debut && minActuelle < fin;
    } else {
        // Plage chevauchant minuit (ex: 22h-6h)
        return minActuelle >= debut || minActuelle < fin;
    }
}

function calculer() {
    try {
        const appareil = document.getElementById('appareil').value;
        const nowMins = toMinutes(document.getElementById('horaire').value);
        const config = appareils[appareil];
        
        // Vérifier si on est dans une plage HC
        let plageActuelle = null;
        for (const hc of heuresCreuses) {
            if (estDansHC(nowMins, hc)) {
                plageActuelle = {
                    nom: hc.nom,
                    debut: hc.debut,
                    fin: hc.fin
                };
                break;
            }
        }
        
        // Proposition principale
        let principale, plagePrincipale;
        if (plageActuelle) {
            // En HC : démarrage immédiat
            const debutImmediat = nowMins;
            const finImmediate = debutImmediat + config.duree;
            const debutPlage = toMinutes(plageActuelle.debut);
            const finPlage = toMinutes(plageActuelle.fin);
            
            let tempsHC;
            if (debutPlage < finPlage) {
                // Plage standard
                tempsHC = Math.max(0, Math.min(finImmediate, finPlage) - Math.max(debutImmediat, debutPlage));
            } else {
                // Plage traversant minuit
                if (debutImmediat >= debutPlage || debutImmediat < finPlage) {
                    const finJour = 24*60;
                    tempsHC = Math.max(0, Math.min(finImmediate, finPlage) - debutImmediat);
                    if (finImmediate > finJour) {
                        tempsHC += Math.min(finImmediate - finJour, finPlage);
                    }
                }
            }
            
            principale = {
                decalage: 0,
                tempsHC: tempsHC || 0,
                debut: debutImmediat % 1440,
                fin: finImmediate % 1440
            };
            plagePrincipale = plageActuelle;
        } else {
            // Hors HC : optimiser
            const plages = getPlageHC(nowMins);
            plagePrincipale = plages[0];
            principale = trouverMeilleureOption(nowMins, appareil, plagePrincipale);
        }
        
        // Alternative
        let alternative = null;
        const plages = getPlageHC(nowMins);
        const plageSuivante = plages.find(p => p.nom !== plagePrincipale.nom);
        
        if (plageSuivante) {
            const alt = trouverMeilleureOption(nowMins, appareil, plageSuivante);
            if (alt.tempsHC > principale.tempsHC) {
                alternative = { ...alt, plage: plageSuivante };
            }
        }

        afficherResultat(principale, config, plagePrincipale, alternative);
    } catch (error) {
        console.error("Erreur lors du calcul:", error);
    }
}



function afficherResultat(resultat, config, plageHC, alternative) {
    const res = document.getElementById('resultat');
    const taux = ((resultat.tempsHC / config.duree) * 100).toFixed(1);
    
    // Formatage du décalage
    const decalageH = Math.floor(resultat.decalage / 60);
    const decalageM = resultat.decalage % 60;
    const decalageStr = decalageM > 0 
        ? `${decalageH}h${decalageM.toString().padStart(2, '0')}` 
        : `${decalageH}h`;

    // Formatage correct des plages
    const plageDebutStr = typeof plageHC.debut === 'number' ? formatHeure(plageHC.debut) : plageHC.debut;
    const plageFinStr = typeof plageHC.fin === 'number' ? formatHeure(plageHC.fin) : plageHC.fin;

    let html = `<div style="background:#e0f7fa; padding:15px; border-radius:5px;">
        <div style="border:2px solid #0074D9; padding:10px; margin-bottom:10px;">
            <b>Programmez ${decalageStr}</b><br>
            Début : ${formatHeure(resultat.debut)}<br>
            Fin : ${formatHeure(resultat.fin)}<br>
            ${taux}% en heures creuses<br>
            Plage : ${plageHC.nom} (${plageDebutStr}-${plageFinStr})
        </div>`;

    if (alternative) {
        const tauxAlt = ((alternative.tempsHC / config.duree) * 100).toFixed(1);
        const altH = Math.floor(alternative.decalage / 60);
        const altM = alternative.decalage % 60;
        const altStr = altM > 0 
            ? `${altH}h${altM.toString().padStart(2, '0')}` 
            : `${altH}h`;
            
        // Formatage correct des plages alternatives
        const altDebutStr = typeof alternative.plage.debut === 'number' ? formatHeure(alternative.plage.debut) : alternative.plage.debut;
        const altFinStr = typeof alternative.plage.fin === 'number' ? formatHeure(alternative.plage.fin) : alternative.plage.fin;

        html += `<div style="border:2px dashed #0074D9; padding:10px;">
            <b>Alternative : Programmez ${altStr}</b><br>
            Début : ${formatHeure(alternative.debut)}<br>
            Fin : ${formatHeure(alternative.fin)}<br>
            ${tauxAlt}% en heures creuses<br>
            Plage : ${alternative.plage.nom} (${altDebutStr}-${altFinStr})
        </div>`;
    }
    
    html += `</div>`;
    res.innerHTML = html;
}


// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    updateHeureActuelle();
    document.getElementById('btn-calculer').addEventListener('click', calculer);
});
