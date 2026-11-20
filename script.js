'use strict';

/* ---------- Configuration par défaut (modifiable dans l'appli, stockée en localStorage) ---------- */
const CLE = 'hc-config-v1';
const DEFAUT = {
    appareils: [
        { id: 'seche-linge',    nom: 'Sèche-linge',    duree: 203, type: 'fin',   pas: 60, conso: 2.5 },
        { id: 'lave-linge',     nom: 'Lave-linge',     duree: 60,  type: 'debut', pas: 10, conso: 1.0 },
        { id: 'lave-vaisselle', nom: 'Lave-vaisselle', duree: 210, type: 'debut', pas: 60, conso: 1.2 }
    ],
    plages: [
        { nom: 'Après-midi', debut: '14:04', fin: '16:04' },
        { nom: 'Nuit',       debut: '00:04', fin: '06:04' }
    ],
    prix: { hp: 0.27, hc: 0.20 },
    selection: 'seche-linge'
};

const $ = id => document.getElementById(id);
const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function valider(r) {
    if (!r || !Array.isArray(r.appareils) || !r.appareils.length || !Array.isArray(r.plages)) return null;
    const base = clone(DEFAUT);
    const appareils = r.appareils.map((a, i) => ({
        id: String(a.id || 'app-' + i),
        nom: String(a.nom || 'Appareil'),
        duree: Math.max(1, parseInt(a.duree, 10) || 60),
        type: a.type === 'fin' ? 'fin' : 'debut',
        pas: Math.max(1, parseInt(a.pas, 10) || 30),
        conso: Math.max(0, parseFloat(a.conso) || 0)
    }));
    const hhmm = /^\d{1,2}:\d{2}$/;
    const plages = r.plages
        .filter(p => p && hhmm.test(p.debut) && hhmm.test(p.fin))
        .map(p => ({ nom: String(p.nom || 'Plage'), debut: p.debut, fin: p.fin }));
    return {
        appareils,
        plages,
        prix: { hp: parseFloat(r.prix && r.prix.hp) || base.prix.hp, hc: parseFloat(r.prix && r.prix.hc) || base.prix.hc },
        selection: appareils.some(a => a.id === r.selection) ? r.selection : appareils[0].id
    };
}

function charger() {
    try {
        const v = valider(JSON.parse(localStorage.getItem(CLE)));
        if (v) return v;
    } catch (e) { /* stockage indisponible ou JSON invalide */ }
    return clone(DEFAUT);
}

function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(cfg)); } catch (e) { /* ignoré */ }
}

let cfg = charger();
let heureManuelle = false;

/* ---------- Utilitaires de temps ---------- */
function toMin(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function fmtHeure(mins) {
    mins = ((mins % 1440) + 1440) % 1440;
    return String(Math.floor(mins / 60)).padStart(2, '0') + 'h' + String(mins % 60).padStart(2, '0');
}

// Heure + indication du jour (t = minutes depuis aujourd'hui 00:00)
function fmtAbs(t) {
    const j = Math.floor(t / 1440);
    return fmtHeure(t) + (j === 1 ? ' (demain)' : j >= 2 ? ` (+${j} j)` : '');
}

function fmtDuree(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h === 0) return m + ' min';
    return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function heureLocale() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function majHeure() {
    $('horaire').value = heureLocale();
}

/* ---------- Moteur de calcul ---------- */
// Plages sous forme [debut, fin[ en minutes, étendues sur plusieurs jours (j-1 à j+3)
function plagesEtendues() {
    const out = [];
    for (let j = -1; j <= 3; j++) {
        for (const p of cfg.plages) {
            const d = toMin(p.debut), f = toMin(p.fin);
            out.push([d + j * 1440, f + j * 1440 + (f <= d ? 1440 : 0)]);
        }
    }
    return out;
}

// Prochaine plage d'heures creuses qui commence strictement après l'heure actuelle
function prochainePlage(now) {
    let best = null;
    for (let j = 0; j <= 2; j++) {
        for (const p of cfg.plages) {
            const d = toMin(p.debut), f = toMin(p.fin);
            const s = d + j * 1440, e = f + j * 1440 + (f <= d ? 1440 : 0);
            if (s > now && (!best || s < best.s)) best = { nom: p.nom, s, e };
        }
    }
    return best;
}

function recouvrement(debut, fin, plages) {
    let total = 0;
    for (const [s, e] of plages) total += Math.max(0, Math.min(fin, e) - Math.max(debut, s));
    return total;
}

function candidats(app, now, plages) {
    const liste = [];
    const ajouter = (decalage, debut) => {
        const fin = debut + app.duree;
        const hc = recouvrement(debut, fin, plages);
        liste.push({ decalage, debut, fin, hc, taux: hc / app.duree });
    };
    ajouter(0, now); // démarrage immédiat
    for (let d = app.pas; d <= 1440; d += app.pas) {
        if (app.type === 'fin') {
            const debut = now + d - app.duree;
            if (debut < now) continue;
            ajouter(d, debut);
        } else {
            ajouter(d, now + d);
        }
    }
    return liste;
}

function coutCycle(app, taux) {
    if (!(app.conso > 0)) return null;
    return app.conso * (taux * cfg.prix.hc + (1 - taux) * cfg.prix.hp);
}

const euro = v => v.toFixed(2).replace('.', ',') + ' €';

/* ---------- Affichage ---------- */
function frise(now, c, plages) {
    const fenetre = 1440;
    const pos = t => Math.min(100, Math.max(0, ((t - now) / fenetre) * 100));
    let html = '<div class="frise">';
    for (const [s, e] of plages) {
        if (e <= now || s >= now + fenetre) continue;
        html += `<div class="hc" style="left:${pos(s)}%;width:${pos(e) - pos(s)}%"></div>`;
    }
    html += `<div class="cycle" style="left:${pos(c.debut)}%;width:${Math.max(1, pos(c.fin) - pos(c.debut))}%"></div></div>`;
    const reperes = [0, 6, 12, 18, 24].map(h => `<span>${fmtHeure(now + h * 60)}</span>`).join('');
    return html + `<div class="frise-legende">${reperes}</div>`;
}

function carte(app, c, now, plages, badge, reference) {
    const classe = c.taux >= 0.95 ? 'ok' : c.taux >= 0.5 ? 'mid' : 'bad';
    let action;
    if (c.decalage === 0) action = 'Démarrez maintenant';
    else if (app.type === 'fin') action = `Programmez la fin dans ${fmtDuree(c.decalage)}`;
    else action = `Programmez le départ dans ${fmtDuree(c.decalage)}`;

    let cout = '';
    const prix = coutCycle(app, c.taux);
    if (prix !== null) {
        cout = `<p class="cout">Coût estimé : ${euro(prix)}`;
        const ref = coutCycle(app, reference.taux);
        if (c !== reference && ref - prix > 0.005) cout += ` · <span class="eco">−${euro(ref - prix)} vs maintenant</span>`;
        cout += '</p>';
    }

    return `<article class="carte ${classe}${badge.principal ? ' principale' : ''}">
        <span class="badge${badge.principal ? '' : ' neutre'}">${esc(badge.texte)}</span>
        <h3>${action}</h3>
        <p>Début <b>${fmtAbs(c.debut)}</b> → Fin <b>${fmtAbs(c.fin)}</b></p>
        <p>${String(Math.round(c.taux * 1000) / 10).replace('.', ',')} % en heures creuses (${fmtDuree(c.hc)} sur ${fmtDuree(app.duree)})</p>
        ${badge.note ? `<p class="cout">${badge.note}</p>` : ''}
        ${frise(now, c, plages)}
        ${cout}
    </article>`;
}

function calculer() {
    const res = $('resultat');
    const app = cfg.appareils.find(a => a.id === cfg.selection) || cfg.appareils[0];
    if (!$('horaire').value) { res.innerHTML = '<p class="vide">Indiquez l\'heure actuelle.</p>'; return; }
    if (!cfg.plages.length) { res.innerHTML = '<p class="vide">Ajoutez au moins une plage d\'heures creuses dans les réglages.</p>'; return; }

    const now = toMin($('horaire').value);
    const plages = plagesEtendues();
    const liste = candidats(app, now, plages);
    const maintenant = liste[0];

    // Meilleur taux ; à égalité on garde le plus tôt (la liste est triée par décalage croissant)
    const meilleur = liste.reduce((b, x) => (x.hc > b.hc ? x : b), liste[0]);

    // Réglage visant la prochaine plage : celui qui y passe le plus de temps (le plus tôt à égalité)
    const pn = prochainePlage(now);
    let suivant = null, noteSuivant = '';
    if (pn) {
        const cible = [[pn.s, pn.e]];
        let o = recouvrement(liste[0].debut, liste[0].fin, cible);
        suivant = liste[0];
        for (const x of liste) {
            const ox = recouvrement(x.debut, x.fin, cible);
            if (ox > o) { o = ox; suivant = x; }
        }
        noteSuivant = `Plage « ${esc(pn.nom)} » (${fmtAbs(pn.s)} – ${fmtHeure(pn.e)}) : ${fmtDuree(o)} de fonctionnement dedans`;
    }

    const cartes = [];
    const vus = new Set();
    const pousser = (c, texte, principal, note) => {
        if (!c || vus.has(c)) return;
        vus.add(c);
        cartes.push(carte(app, c, now, plages, { texte, principal, note }, maintenant));
    };
    let labelMeilleur = 'Recommandé';
    if (meilleur === maintenant) labelMeilleur += ' · maintenant';
    if (meilleur === suivant) labelMeilleur += ' · prochaine plage';
    pousser(meilleur, labelMeilleur, true, meilleur === suivant ? noteSuivant : '');
    pousser(suivant, 'Prochaine plage', true, noteSuivant);
    pousser(maintenant, 'Si vous lancez maintenant', false);

    res.innerHTML = cartes.join('');
}

/* ---------- Éditeurs de réglages ---------- */
function majSelect() {
    const sel = $('appareil');
    sel.innerHTML = cfg.appareils.map(a => `<option value="${esc(a.id)}">${esc(a.nom)}</option>`).join('');
    sel.value = cfg.selection;
}

// Champ durée en heures + minutes (la valeur stockée reste en minutes)
function champHM(nom, total) {
    const h = Math.floor(total / 60), m = total % 60;
    return `<div class="hm">
        <input data-f="${nom}-h" type="number" inputmode="numeric" min="0" value="${h}" aria-label="heures"><span>h</span>
        <input data-f="${nom}-m" type="number" inputmode="numeric" min="0" max="59" value="${m}" aria-label="minutes"><span>min</span>
    </div>`;
}

function rendreAppareils() {
    $('editeur-appareils').innerHTML = cfg.appareils.map((a, i) => `
        <div class="ligne-edit" data-i="${i}">
            <input data-f="nom" value="${esc(a.nom)}" aria-label="Nom">
            <div class="grille-2">
                <label>Durée${champHM('duree', a.duree)}</label>
                <label>Pas de programmation${champHM('pas', a.pas)}</label>
                <label>Réglage
                    <select data-f="type">
                        <option value="debut"${a.type === 'debut' ? ' selected' : ''}>Départ différé</option>
                        <option value="fin"${a.type === 'fin' ? ' selected' : ''}>Fin différée</option>
                    </select>
                </label>
                <label>Conso (kWh/cycle)<input data-f="conso" type="number" step="0.1" min="0" value="${a.conso}"></label>
            </div>
            <button type="button" class="danger" data-act="suppr">Supprimer</button>
        </div>`).join('');
}

function rendrePlages() {
    $('editeur-plages').innerHTML = cfg.plages.map((p, i) => `
        <div class="ligne-edit" data-i="${i}">
            <input data-f="nom" value="${esc(p.nom)}" aria-label="Nom de la plage">
            <div class="grille-2">
                <label>Début<input data-f="debut" type="time" value="${esc(p.debut)}"></label>
                <label>Fin<input data-f="fin" type="time" value="${esc(p.fin)}"></label>
            </div>
            <button type="button" class="danger" data-act="suppr">Supprimer</button>
        </div>`).join('') || '<p class="aide">Aucune plage définie.</p>';
}

function toutRendre() {
    majSelect();
    rendreAppareils();
    rendrePlages();
    $('prix-hp').value = cfg.prix.hp;
    $('prix-hc').value = cfg.prix.hc;
    calculer();
}

function changement(e) {
    const champ = e.target.dataset.f;
    const ligne = e.target.closest('.ligne-edit');
    if (!champ || !ligne) return;
    const i = Number(ligne.dataset.i);
    const cible = ligne.parentElement.id === 'editeur-appareils' ? cfg.appareils[i] : cfg.plages[i];

    // Champs heures / minutes : on recalcule le total en minutes et on normalise l'affichage
    const hm = champ.match(/^(duree|pas)-(h|m)$/);
    if (hm) {
        const base = hm[1];
        const hEl = ligne.querySelector(`[data-f="${base}-h"]`);
        const mEl = ligne.querySelector(`[data-f="${base}-m"]`);
        const total = Math.max(1, (parseInt(hEl.value, 10) || 0) * 60 + (parseInt(mEl.value, 10) || 0));
        cible[base] = total;
        hEl.value = Math.floor(total / 60);
        mEl.value = total % 60;
        sauver();
        calculer();
        return;
    }

    let v = e.target.value;
    if (champ === 'conso') v = Math.max(0, parseFloat(v) || 0);
    else if ((champ === 'debut' || champ === 'fin') && !v) return;
    else if (champ === 'nom' && !v.trim()) v = cible.nom;
    cible[champ] = v;
    sauver();
    majSelect();
    calculer();
}

function suppression(e) {
    if (e.target.dataset.act !== 'suppr') return;
    const ligne = e.target.closest('.ligne-edit');
    const i = Number(ligne.dataset.i);
    if (ligne.parentElement.id === 'editeur-appareils') {
        if (cfg.appareils.length === 1) { alert('Il faut garder au moins un appareil.'); return; }
        cfg.appareils.splice(i, 1);
        if (!cfg.appareils.some(a => a.id === cfg.selection)) cfg.selection = cfg.appareils[0].id;
    } else {
        cfg.plages.splice(i, 1);
    }
    sauver();
    toutRendre();
}

function msg(t) { $('msg-json').textContent = t; }

/* ---------- Initialisation ---------- */
document.addEventListener('DOMContentLoaded', () => {
    majHeure();
    toutRendre();

    $('appareil').addEventListener('change', e => { cfg.selection = e.target.value; sauver(); calculer(); });
    $('horaire').addEventListener('input', () => { heureManuelle = true; calculer(); });
    $('btn-maintenant').addEventListener('click', () => { heureManuelle = false; majHeure(); calculer(); });

    // L'heure suit l'horloge tant que vous ne l'avez pas modifiée à la main
    setInterval(() => { if (!heureManuelle && document.visibilityState === 'visible') { majHeure(); calculer(); } }, 30000);
    document.addEventListener('visibilitychange', () => { if (!heureManuelle && document.visibilityState === 'visible') { majHeure(); calculer(); } });

    for (const id of ['editeur-appareils', 'editeur-plages']) {
        $(id).addEventListener('change', changement);
        $(id).addEventListener('click', suppression);
    }

    $('btn-ajout-appareil').addEventListener('click', () => {
        cfg.appareils.push({ id: 'app-' + Date.now(), nom: 'Nouvel appareil', duree: 60, type: 'debut', pas: 30, conso: 0 });
        sauver(); toutRendre();
    });
    $('btn-ajout-plage').addEventListener('click', () => {
        cfg.plages.push({ nom: 'Nouvelle plage', debut: '12:00', fin: '14:00' });
        sauver(); toutRendre();
    });

    for (const k of ['hp', 'hc']) {
        $('prix-' + k).addEventListener('change', e => {
            const v = parseFloat(e.target.value);
            if (v >= 0) { cfg.prix[k] = v; sauver(); calculer(); }
        });
    }

    $('btn-export').addEventListener('click', () => {
        const txt = JSON.stringify(cfg, null, 2);
        $('zone-json').value = txt;
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => msg('Copié dans le presse-papiers.'), () => msg('Texte prêt à copier ci-dessus.'));
        else msg('Texte prêt à copier ci-dessus.');
    });
    $('btn-import').addEventListener('click', () => {
        try {
            const v = valider(JSON.parse($('zone-json').value));
            if (!v) throw new Error('format');
            cfg = v; sauver(); toutRendre(); msg('Réglages importés.');
        } catch (e) { msg('Import impossible : texte invalide.'); }
    });
    $('btn-reset').addEventListener('click', () => {
        if (!confirm('Revenir aux réglages d\'origine ?')) return;
        cfg = clone(DEFAUT); sauver(); toutRendre(); msg('Réglages réinitialisés.');
    });

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
});
