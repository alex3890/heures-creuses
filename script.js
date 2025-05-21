document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements for Authentication
    const authSection = document.getElementById('auth-section');
    const loginFormContainer = document.getElementById('login-form-container');
    const loginForm = document.getElementById('login-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const btnLogin = document.getElementById('btn-login');

    const registerFormContainer = document.getElementById('register-form-container');
    const registerForm = document.getElementById('register-form');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const btnRegister = document.getElementById('btn-register');

    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const authMessages = document.getElementById('auth-messages');

    // DOM Elements for User Section
    const userSection = document.getElementById('user-section');
    const userInfo = document.getElementById('user-info');
    const btnLogout = document.getElementById('btn-logout');

    // DOM Elements for Main Application
    const appContent = document.getElementById('app-content');
    const appareilSelect = document.getElementById('appareil');
    const heureActuelleInput = document.getElementById('heure-actuelle');
    const btnCalculer = document.getElementById('btn-calculer');
    const resultatDiv = document.getElementById('resultat');
    const meilleurHoraireP = document.getElementById('meilleur-horaire');

    // HC and Appliance Management (placeholders, will be fully implemented later)
    const listeHc = document.getElementById('liste-hc');
    const hcEditFormContainer = document.getElementById('hc-edit-form-container');
    const btnAddHc = document.getElementById('btn-add-hc');
    const hcMessages = document.getElementById('hc-messages');

    const listeAppareils = document.getElementById('liste-appareils');
    const applianceEditFormContainer = document.getElementById('appliance-edit-form-container');
    const btnAddAppliance = document.getElementById('btn-add-appliance');
    const applianceMessages = document.getElementById('appliance-messages');

    // HC and Appliance Management (placeholders, will be fully implemented later)
    // These elements are already in index.html, but their full functionality will be built out.
    const hcManagementSection = document.getElementById('hc-management-section'); // Assuming this will be added
    const hcListUl = document.getElementById('liste-hc'); // This is the existing one in index.html
    const hcEditFormContainer = document.getElementById('hc-edit-form-container'); // Existing
    const btnAddHc = document.getElementById('btn-add-hc'); // Existing
    const hcMessagesDiv = document.getElementById('hc-messages'); // Existing

    const appliancesManagementSection = document.getElementById('appliances-management-section'); // Assuming this will be added
    const appliancesListUl = document.getElementById('liste-appareils'); // This is the existing one in index.html
    const applianceEditFormContainer = document.getElementById('appliance-edit-form-container'); // Existing
    const btnAddAppliance = document.getElementById('btn-add-appliance'); // Existing
    const applianceMessagesDiv = document.getElementById('appliance-messages'); // Existing


    let currentUser = null;
    let userHeuresCreuses = [];
    let userAppliances = {}; // Will be a dictionary keyed by appliance name

    // --- Utility Functions ---
    function displayAuthMessage(message, type = 'error') {
        authMessages.textContent = message;
        authMessages.className = `messages ${type}`; // 'messages error' or 'messages success'
    }

    function displayHcMessage(message, type = 'error') {
        hcMessagesDiv.textContent = message;
        hcMessagesDiv.className = `messages ${type}`;
    }

    function displayApplianceMessage(message, type = 'error') {
        applianceMessagesDiv.textContent = message;
        applianceMessagesDiv.className = `messages ${type}`;
    }


    // --- View Management Functions ---
    function showAuthForms(formType = 'login') {
        authSection.style.display = 'block';
        userSection.style.display = 'none';
        appContent.style.display = 'none';
        
        if (formType === 'login') {
            loginFormContainer.style.display = 'block';
            registerFormContainer.style.display = 'none';
        } else if (formType === 'register') {
            loginFormContainer.style.display = 'none';
            registerFormContainer.style.display = 'block';
        }
        authMessages.textContent = '';
        loginForm.reset();
        registerForm.reset();
    }

    function showAppView() {
        authSection.style.display = 'none';
        userSection.style.display = 'block';
        appContent.style.display = 'block';
        authMessages.textContent = '';
        if (currentUser) {
            userInfo.textContent = currentUser.username;
        }
        // Initialize app data loading here
        await loadUserSpecificData(); // This will load HC and Appliances
        updateHeureActuelle(); // Set initial time
        // Initially hide edit forms for HC and Appliances
        if (hcEditFormContainer) hcEditFormContainer.style.display = 'none';
        if (applianceEditFormContainer) applianceEditFormContainer.style.display = 'none';
    }

    // --- API Call Functions ---
    async function loadUserSpecificData() {
        if (!currentUser) return;
        await loadHeuresCreuses();
        await loadAppliances();
    }

    async function checkLoginStatus() {
        try {
            const response = await fetch('/api/current_user');
            if (response.ok) {
                currentUser = await response.json();
                await showAppView(); // Changed to await if showAppView becomes async due to data loading
            } else {
                currentUser = null;
                showAuthForms('login');
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            displayAuthMessage('Erreur de connexion au serveur.');
            currentUser = null;
            showAuthForms('login');
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        const username = loginUsernameInput.value;
        const password = loginPasswordInput.value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok) {
                currentUser = data.user; // Assuming backend sends user info
                await showAppView(); // Changed to await
            } else {
                displayAuthMessage(data.message || 'Erreur de connexion.');
            }
        } catch (error) {
            console.error('Login error:', error);
            displayAuthMessage('Erreur lors de la tentative de connexion.');
        }
    }

    async function handleRegister(event) {
        event.preventDefault();
        const username = registerUsernameInput.value;
        const password = registerPasswordInput.value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok) {
                displayAuthMessage(data.message || "Inscription réussie ! Veuillez vous connecter.", 'success');
                showAuthForms('login');
            } else {
                displayAuthMessage(data.message || "Erreur d'inscription.");
            }
        } catch (error) {
            console.error('Registration error:', error);
            displayAuthMessage("Erreur lors de la tentative d'inscription.");
        }
    }

    async function handleLogout() {
        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                currentUser = null;
                userHeuresCreuses = [];
                userAppliances = {};
                showAuthForms('login');
                // Clear UI elements
                hcListUl.innerHTML = '';
                appliancesListUl.innerHTML = '';
                appareilSelect.innerHTML = '';
                displayHcMessage('', 'success'); // Clear messages
                displayApplianceMessage('', 'success');
            } else {
                displayAuthMessage(data.message || 'Erreur de déconnexion.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            displayAuthMessage('Erreur lors de la tentative de déconnexion.');
        }
    }
    
    // --- Heures Creuses Data Management ---
    function renderHeuresCreusesList() {
        const hcList = document.getElementById('hc-list');
        hcList.innerHTML = ''; // Clear existing list
        if (!userHeuresCreuses || userHeuresCreuses.length === 0) {
            hcList.innerHTML = '<li>Aucune période d\'heures creuses définie.</li>';
            return;
        }
        userHeuresCreuses.forEach(hc => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${hc.nom}: ${hc.debut} - ${hc.fin}</span>
                <div>
                    <button class="btn-edit-hc" data-id="${hc.id}">Modifier</button>
                    <button class="btn-delete-hc" data-id="${hc.id}">Supprimer</button>
                </div>
            `;
            hcList.appendChild(li);
        });

        // Add event listeners for new buttons
        document.querySelectorAll('.btn-edit-hc').forEach(button => {
            button.addEventListener('click', handleEditHcShowForm);
        });
        document.querySelectorAll('.btn-delete-hc').forEach(button => {
            button.addEventListener('click', handleDeleteHc);
        });
    }

    async function loadHeuresCreuses() {
        if (!currentUser) return;
        try {
            const response = await fetch('/api/heures_creuses');
            if (response.ok) {
                userHeuresCreuses = await response.json();
                renderHeuresCreusesList();
            } else {
                console.error('Failed to load Heures Creuses:', response.statusText);
                displayHcMessage('Erreur de chargement des Heures Creuses.', 'error');
                userHeuresCreuses = []; 
                renderHeuresCreusesList(); // Render empty list
            }
        } catch (error) {
            console.error('Error loading Heures Creuses:', error);
            displayHcMessage('Erreur réseau lors du chargement des Heures Creuses.', 'error');
            userHeuresCreuses = [];
            renderHeuresCreusesList(); // Render empty list
        }
    }
    
    // --- Appliance Data Management ---
    function renderAppliancesList() {
        const appliancesList = document.getElementById('appliances-list');
        appliancesList.innerHTML = ''; // Clear existing list
        const appliancesArray = Object.values(userAppliances); // Convert object to array for iteration
        if (!appliancesArray || appliancesArray.length === 0) {
            appliancesList.innerHTML = '<li>Aucun appareil défini.</li>';
            return;
        }
        appliancesArray.forEach(app => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${app.nom} (Durée: ${app.duree}m, Type: ${app.type}, Pas: ${app.pas}m)</span>
                <div>
                    <button class="btn-edit-appliance" data-id="${app.id}">Modifier</button>
                    <button class="btn-delete-appliance" data-id="${app.id}">Supprimer</button>
                </div>
            `;
            appliancesList.appendChild(li);
        });

        // Add event listeners for new buttons
        document.querySelectorAll('.btn-edit-appliance').forEach(button => {
            button.addEventListener('click', handleEditApplianceShowForm);
        });
        document.querySelectorAll('.btn-delete-appliance').forEach(button => {
            button.addEventListener('click', handleDeleteAppliance);
        });
    }


    async function loadAppliances() {
        if (!currentUser) return;
        try {
            const response = await fetch('/api/appliances');
            if (response.ok) {
                const appliancesList = await response.json();
                userAppliances = appliancesList.reduce((acc, app) => {
                    acc[app.nom] = app; 
                    return acc;
                }, {});
                populateApplianceDropdown(appliancesList); // Pass the original list
                renderAppliancesList(); 
            } else {
                console.error('Failed to load Appliances:', response.statusText);
                displayApplianceMessage('Erreur de chargement des appareils.', 'error');
                userAppliances = {}; 
                populateApplianceDropdown([]); // Clear dropdown
                renderAppliancesList(); // Render empty list
            }
        } catch (error) {
            console.error('Error loading Appliances:', error);
            displayApplianceMessage('Erreur réseau lors du chargement des appareils.', 'error');
            userAppliances = {};
            populateApplianceDropdown([]);
            renderAppliancesList();
        }
    }

    function populateApplianceDropdown(appliancesData) { // appliancesData is a list
        appareilSelect.innerHTML = ''; 
        if (appliancesData.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "Aucun appareil configuré";
            appareilSelect.appendChild(option);
            return;
        }
        appliancesData.forEach(app => { // app is an object from the list
            const option = document.createElement('option');
            option.value = app.nom; // Key for userAppliances dictionary
            option.textContent = `${app.nom} (${app.duree} min, type: ${app.type}, pas: ${app.pas} min)`;
            // Data attributes are still useful for quick access if needed, but primary data comes from userAppliances[app.nom]
            option.dataset.duree = app.duree;
            option.dataset.type = app.type;
            option.dataset.pas = app.pas;
            option.dataset.id = app.id; // Keep id for reference
            appareilSelect.appendChild(option);
        });
    }

    // --- Core Application Logic (Time & Calculation) ---
    // Helper to convert HH:MM to minutes from midnight
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Helper to convert minutes from midnight to HH:MM
    function minutesToTime(totalMinutes) {
        const totalMinutesNormalized = (totalMinutes % 1440 + 1440) % 1440; // Normalize to 0-1439 range
        const hours = Math.floor(totalMinutesNormalized / 60);
        const minutes = totalMinutesNormalized % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    // Original estDansHC adapted
    function estDansHC(nowMins, hcPlages) {
        for (const plage of hcPlages) {
            if (nowMins >= plage.debutAbs && nowMins < plage.finAbs) {
                return plage; // Return the current HC plage
            }
        }
        return null; // Not in any HC plage
    }
    
    // Original getPlageHC (advanced) adapted
    function getPlageHC(nowMins) {
        if (!userHeuresCreuses || userHeuresCreuses.length === 0) return [];

        const plages = userHeuresCreuses.map(hc => {
            const debutMins = timeToMinutes(hc.debut);
            let finMins = timeToMinutes(hc.fin);
            
            // Si la fin est avant le début (ex: 22h00 - 06h00), la plage s'étend sur minuit
            if (finMins < debutMins) {
                finMins += 1440; // Ajoute 24h en minutes
            }
            return { ...hc, debut: debutMins, fin: finMins };
        });

        // Filtrer et ajuster les plages pour qu'elles soient dans le futur ou en cours
        const plagesFutures = plages.map(plage => {
            let debutAbs = plage.debut;
            let finAbs = plage.fin;

            // Si la plage est déjà passée pour aujourd'hui, la projeter pour demain
            if (finAbs < nowMins) {
                debutAbs += 1440;
                finAbs += 1440;
            }
            // Si la plage commence demain mais nowMins est avant sa fin "d'hier" (cas 22h-06h, et il est 03h)
            // No, this case is handled by finAbs < nowMins.
            // Let's rethink: if plage is 22-06 (fin: 300+1440=1740), and nowMins is 120 (02:00)
            // then finAbs (300) < nowMins (120) is false.
            // if debutMins (1320) > finMins (300) means it spans midnight.
            // if (plage.debut > plage.fin) { // Spans midnight originally
            //    if (nowMins < plage.fin) { // We are in the "morning part" of a plage like 22:00-06:00
            //        debutAbs = plage.debut - 1440; // debut of this plage was "yesterday"
            //    }
            // }
            
            // Simpler approach for absolute times relative to nowMins for sorting:
            // debutAbs is the next occurrence of plage.debut at or after nowMins
            // If plage.debut is 22:00 (1320) and nowMins is 02:00 (120), then debutAbs is 1320.
            // If plage.debut is 08:00 (480) and nowMins is 10:00 (600), then debutAbs is 480 + 1440 = 1920.
            // This needs to be the start of the *interval*
            
            // The original logic was: if finAbs < nowMins, shift by 24h.
            // This means we only consider plages that end after nowMins.
            // If a plage is 22:00-06:00 (debut:1320, fin:300 originally -> fin: 300+1440=1740 for calculation)
            // and nowMins is 02:00 (120). finAbs (1740) is not < nowMins (120). So no shift. debutAbs=1320, finAbs=1740. Correct.
            // and nowMins is 07:00 (420). finAbs (300 for display, or the original fin if not wrapped) < nowMins (420)
            // Let's use the wrapped fin for this check. If plage.fin (actual end time in day) < plage.debut (actual start time in day)
            // it means it wraps.
            // if ( (plage.fin < plage.debut && finAbs < nowMins && nowMins > plage.fin ) || (finAbs < nowMins && plage.fin >= plage.debut) )
            
            // The original logic for debutAbs/finAbs for sorting was simpler:
            // debutAbs is the start of the HC window as it occurs *after or overlapping* nowMins.
            // finAbs is the end of that specific window.
            // If plage is 22:00-06:00 (debutMins=1320, finMins=300 originally)
            //   If nowMins = 02:00 (120): current window is 22:00 (yesterday) to 06:00 (today).
            //     debutAbs = 1320 - 1440 = -120. finAbs = 300. This plage is current.
            //   If nowMins = 23:00 (1380): current window is 22:00 (today) to 06:00 (tomorrow).
            //     debutAbs = 1320. finAbs = 300 + 1440 = 1740. This plage is current.
            //   If nowMins = 08:00 (480): next window is 22:00 (today) to 06:00 (tomorrow).
            //     debutAbs = 1320. finAbs = 300 + 1440 = 1740. This plage is future.
            
            // Resetting debutAbs/finAbs logic based on original's intent for sorting future plages:
            if (plage.fin < plage.debut) { // Spans midnight (e.g. 22:00 - 06:00)
                if (nowMins > plage.fin && nowMins < plage.debut) { // Currently between end and next start (e.g. 10:00)
                    debutAbs = plage.debut; // Starts today
                    finAbs = plage.fin + 1440; // Ends tomorrow
                } else if (nowMins <= plage.fin) { // Currently in the early morning part (e.g. 02:00)
                    debutAbs = plage.debut - 1440; // Started yesterday
                    finAbs = plage.fin; // Ends today
                } else { // Currently in the evening part (e.g. 23:00)
                    debutAbs = plage.debut; // Starts today
                    finAbs = plage.fin + 1440; // Ends tomorrow
                }
            } else { // Does not span midnight (e.g. 12:00 - 14:00)
                if (nowMins >= plage.fin) { // Already passed today
                    debutAbs = plage.debut + 1440; // Next one is tomorrow
                    finAbs = plage.fin + 1440;
                } else { // Still to come or current
                    debutAbs = plage.debut;
                    finAbs = plage.fin;
                }
            }
            return { ...plage, debutAbs, finAbs };
        });

        // Trier les plages par leur début absolu, puis par leur fin absolue
        return plagesFutures.sort((a, b) => {
            if (a.debutAbs !== b.debutAbs) {
                return a.debutAbs - b.debutAbs;
            }
            return a.finAbs - b.finAbs;
        });
    }

    // Original trouverMeilleureOption adapted
    function trouverMeilleureOption(nowMins, appareilConfig, hcPlage) {
        const { duree, type, pas } = appareilConfig;
        const { debutAbs: hcDebut, finAbs: hcFin } = hcPlage;
        let meilleureOption = { decalage: -1, tempsHC: 0, debut: 0, fin: 0 };

        // Important: les itérations doivent se faire par rapport à hcDebut et hcFin
        // et non pas nowMins directement si on cherche une plage future.
        // Le "décalage" sera par rapport à nowMins.

        let premierDebutPossible = Math.max(nowMins, hcDebut); 
        // Si l'appareil doit finir dans les HC (type 'fin')
        if (type === 'fin') {
            // On veut maximiser le temps dans HC, donc on essaie de finir le plus tard possible dans la plage HC
            // tout en commençant après nowMins et après hcDebut.
            // Le dernier démarrage possible est hcFin - duree.
            // On itère en reculant depuis hcFin - duree par pas.
            let debutTest = hcFin - duree;
            while (debutTest >= premierDebutPossible) {
                const finTest = debutTest + duree;
                // Vérifier si ce créneau est valide
                if (debutTest >= hcDebut && finTest <= hcFin) { // Entièrement dans la plage HC
                    const tempsDansHC = duree;
                    if (tempsDansHC > meilleureOption.tempsHC) {
                        meilleureOption = {
                            decalage: debutTest - nowMins, // Décalage par rapport à maintenant
                            tempsHC,
                            debut: debutTest,
                            fin: finTest,
                        };
                        // Puisqu'on est entièrement dans HC et qu'on recule, c'est la meilleure pour ce type
                        // Mais on veut le plus tard possible.
                        // Non, on veut le premier qui est entièrement dedans en reculant depuis la fin.
                        // Let's re-evaluate. We want the latest possible start that IS IN HC.
                        // The loop iterates from latest possible start backwards. So first one found is the one.
                         return meilleureOption; // Found the latest possible start within HC
                    }
                }
                // Si pas entièrement dans HC, on calcule la portion
                 else if (debutTest < hcFin && hcDebut < finTest) { // Chevauchement partiel
                    const tempsDansHC = Math.min(finTest, hcFin) - Math.max(debutTest, hcDebut);
                    if (tempsDansHC > meilleureOption.tempsHC) {
                         meilleureOption = {
                            decalage: debutTest - nowMins,
                            tempsHC,
                            debut: debutTest,
                            fin: finTest,
                        };
                    }
                 }
                debutTest -= pas;
            }
        }
        // Si l'appareil doit commencer dans les HC (type 'debut')
        else if (type === 'debut') {
            // On veut commencer le plus tôt possible dans la plage HC, après nowMins.
            // On itère en avançant depuis premierDebutPossible par pas.
            let debutTest = premierDebutPossible;
            while (debutTest < hcFin) { // Doit commencer avant la fin de la plage HC
                const finTest = debutTest + duree;
                 // Vérifier si ce créneau est valide
                if (debutTest >= hcDebut && finTest <= hcFin) { // Entièrement dans la plage HC
                    const tempsDansHC = duree;
                     // Pour 'debut', le premier trouvé qui est entièrement dans HC est le meilleur
                    return {
                        decalage: debutTest - nowMins,
                        tempsHC,
                        debut: debutTest,
                        fin: finTest,
                    };
                }
                // Si pas entièrement dans HC, on calcule la portion
                else if (debutTest < hcFin && hcDebut < finTest) { // Chevauchement partiel
                    const tempsDansHC = Math.min(finTest, hcFin) - Math.max(debutTest, hcDebut);
                    if (tempsDansHC > meilleureOption.tempsHC) { // On garde celui qui maximise le temps dans HC
                         meilleureOption = {
                            decalage: debutTest - nowMins,
                            tempsHC,
                            debut: debutTest,
                            fin: finTest,
                        };
                    }
                } else if (debutTest >= hcFin) { // Dépasse la plage, inutile de continuer
                    break;
                }
                debutTest += pas;
            }
        }
        // Filtrer les options où le décalage est négatif si on a avancé `premierDebutPossible`
        // (ce qui ne devrait pas arriver avec Math.max(nowMins, hcDebut))
        // et où tempsHC > 0
        if (meilleureOption.decalage >= 0 && meilleureOption.tempsHC > 0) {
            return meilleureOption;
        }
        return { decalage: -1, tempsHC: 0, debut: 0, fin: 0 }; // Aucune option trouvée
    }

    function updateHeureActuelle() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        heureActuelleInput.value = `${hours}:${minutes}`;
    }

    function calculerMeilleurHoraire() {
        if (!currentUser) {
            displayAuthMessage("Veuillez vous connecter pour utiliser cette fonctionnalité.");
            return;
        }
        
        const selectedApplianceName = appareilSelect.value;
        const selectedAppliance = userAppliances[selectedApplianceName];

        if (!selectedAppliance) {
            meilleurHoraireP.textContent = "Veuillez sélectionner un appareil valide ou configurer des appareils.";
            resultatDiv.style.display = 'block';
            return;
        }

        const duree = selectedAppliance.duree; // Directly from userAppliances
        const typeCalcul = selectedAppliance.type;
        const pas = selectedAppliance.pas;
        const heureActuelleStr = heureActuelleInput.value;
        const nowMins = timeToMinutes(heureActuelleStr);

        const appareilConfig = selectedAppliance; // Already fetched
        const { duree, nom: nomAppareil } = appareilConfig;

        let messages = [];

        const hcPlagesTriees = getPlageHC(nowMins); // Advanced version

        if (!hcPlagesTriees || hcPlagesTriees.length === 0) {
            meilleurHoraireP.textContent = "Veuillez configurer au moins une période d'heures creuses.";
            resultatDiv.style.display = 'block';
            return;
        }

        // 1. Vérifier si on est DÉJÀ en Heures Creuses
        const plageHCE actuelle = estDansHC(nowMins, hcPlagesTriees);
        let optimisationImmediatePossible = false;
        if (plageHCEactuelle) {
            messages.push(`Vous êtes actuellement en période d'Heures Creuses (${plageHCEactuelle.nom}: ${minutesToTime(plageHCEactuelle.debutAbs % 1440)}-${minutesToTime(plageHCEactuelle.finAbs % 1440)}).`);
            
            const debutOperationImmediate = nowMins;
            const finOperationImmediate = debutOperationImmediate + duree;
            
            // Calculer la portion de l'opération immédiate qui est dans la plage HC actuelle
            const tempsDansHCImmediate = Math.max(0, Math.min(finOperationImmediate, plageHCEactuelle.finAbs) - Math.max(debutOperationImmediate, plageHCEactuelle.debutAbs));
            const pourcentageHCImmediate = (tempsDansHCImmediate / duree) * 100;

            if (tempsDansHCImmediate > 0) {
                 messages.push(`<strong>Option Immédiate :</strong> Démarrer ${nomAppareil} maintenant (${minutesToTime(debutOperationImmediate)}) finirait à ${minutesToTime(finOperationImmediate)}. 
                    Cela utiliserait ${tempsDansHCImmediate} min en HC (${pourcentageHCImmediate.toFixed(0)}%).`);
                optimisationImmediatePossible = true;
            }
        } else {
            messages.push("Vous n'êtes pas actuellement en Heures Creuses.");
        }

        // 2. Trouver la meilleure option pour la prochaine plage HC
        const premierePlageHC = hcPlagesTriees.find(p => p.finAbs > nowMins); // Première plage qui n'est pas encore finie
        
        if (!premierePlageHC) {
             messages.push("Aucune future période d'Heures Creuses trouvée pour optimiser.");
        } else {
            messages.push(`Prochaine période HC pertinente: ${premierePlageHC.nom} (de ${minutesToTime(premierePlageHC.debutAbs % 1440)} à ${minutesToTime(premierePlageHC.finAbs % 1440)}).`);
            const meilleureOptionPlage1 = trouverMeilleureOption(nowMins, appareilConfig, premierePlageHC);

            if (meilleureOptionPlage1 && meilleureOptionPlage1.decalage !== -1) {
                const debutOptimise1 = meilleureOptionPlage1.debut;
                const finOptimise1 = meilleureOptionPlage1.fin;
                const pourcentageHC1 = (meilleureOptionPlage1.tempsHC / duree) * 100;
                const decalageEnHeuresMinutes = `${Math.floor(meilleureOptionPlage1.decalage / 60)}h ${meilleureOptionPlage1.decalage % 60}min`;

                messages.push(`<strong>Option Optimisée (Plage: ${premierePlageHC.nom}) :</strong> Démarrer ${nomAppareil} à ${minutesToTime(debutOptimise1)} (dans ${decalageEnHeuresMinutes}), finirait à ${minutesToTime(finOptimise1)}. 
                    Utiliserait ${meilleureOptionPlage1.tempsHC} min en HC (${pourcentageHC1.toFixed(0)}%).`);
            } else {
                messages.push(`Aucun créneau optimal trouvé pour ${nomAppareil} dans la plage "${premierePlageHC.nom}".`);
            }

            // 3. (Optionnel) Chercher une alternative dans la deuxième plage HC si elle existe
            const indexPremierePlage = hcPlagesTriees.indexOf(premierePlageHC);
            if (hcPlagesTriees.length > indexPremierePlage + 1) {
                const deuxiemePlageHC = hcPlagesTriees[indexPremierePlage + 1];
                 messages.push(`Autre période HC pertinente: ${deuxiemePlageHC.nom} (de ${minutesToTime(deuxiemePlageHC.debutAbs % 1440)} à ${minutesToTime(deuxiemePlageHC.finAbs % 1440)}).`);
                const meilleureOptionPlage2 = trouverMeilleureOption(nowMins, appareilConfig, deuxiemePlageHC);
                if (meilleureOptionPlage2 && meilleureOptionPlage2.decalage !== -1) {
                    const debutOptimise2 = meilleureOptionPlage2.debut;
                    const finOptimise2 = meilleureOptionPlage2.fin;
                    const pourcentageHC2 = (meilleureOptionPlage2.tempsHC / duree) * 100;
                    const decalageEnHeuresMinutes2 = `${Math.floor(meilleureOptionPlage2.decalage / 60)}h ${meilleureOptionPlage2.decalage % 60}min`;
                    messages.push(`<strong>Option Alternative (Plage: ${deuxiemePlageHC.nom}) :</strong> Démarrer ${nomAppareil} à ${minutesToTime(debutOptimise2)} (dans ${decalageEnHeuresMinutes2}), finirait à ${minutesToTime(finOptimise2)}. 
                        Utiliserait ${meilleureOptionPlage2.tempsHC} min en HC (${pourcentageHC2.toFixed(0)}%).`);
                }
            }
        }

        meilleurHoraireP.innerHTML = messages.join('<br><hr><br>'); // Use innerHTML for line breaks
        resultatDiv.style.display = 'block';
    }


    // --- Event Listeners (Auth, Links, Main Calculation) ---
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    btnLogout.addEventListener('click', handleLogout);

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthForms('register');
    });
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthForms('login');
    });
    
    if (btnCalculer) {
        btnCalculer.addEventListener('click', calculerMeilleurHoraire);
    }

    // --- HC CRUD Event Listeners & Handlers ---
    const addHcForm = document.getElementById('add-hc-form');
    const editHcForm = document.getElementById('edit-hc-form');
    const cancelEditHcButton = document.getElementById('cancel-edit-hc');

    if (addHcForm) {
        addHcForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nom = document.getElementById('add-hc-nom').value;
            const debut = document.getElementById('add-hc-debut').value;
            const fin = document.getElementById('add-hc-fin').value;
            try {
                const response = await fetch('/api/heures_creuses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nom, debut, fin }),
                });
                const data = await response.json();
                if (response.ok) {
                    displayHcMessage(data.message || 'Période HC ajoutée!', 'success');
                    addHcForm.reset();
                    await loadHeuresCreuses(); // Refresh list
                } else {
                    displayHcMessage(data.message || 'Erreur ajout HC.', 'error');
                }
            } catch (error) {
                displayHcMessage('Erreur réseau ajout HC.', 'error');
            }
        });
    }

    function handleEditHcShowForm(event) {
        const hcId = event.target.dataset.id;
        const hcToEdit = userHeuresCreuses.find(hc => hc.id == hcId);
        if (!hcToEdit) return;

        document.getElementById('edit-hc-id').value = hcToEdit.id;
        document.getElementById('edit-hc-nom').value = hcToEdit.nom;
        document.getElementById('edit-hc-debut').value = hcToEdit.debut;
        document.getElementById('edit-hc-fin').value = hcToEdit.fin;

        addHcForm.style.display = 'none';
        editHcForm.style.display = 'block';
        displayHcMessage(''); // Clear messages
    }

    if (editHcForm) {
        editHcForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-hc-id').value;
            const nom = document.getElementById('edit-hc-nom').value;
            const debut = document.getElementById('edit-hc-debut').value;
            const fin = document.getElementById('edit-hc-fin').value;
            try {
                const response = await fetch(`/api/heures_creuses/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nom, debut, fin }),
                });
                const data = await response.json();
                if (response.ok) {
                    displayHcMessage(data.message || 'Période HC modifiée!', 'success');
                    editHcForm.reset();
                    editHcForm.style.display = 'none';
                    addHcForm.style.display = 'block';
                    await loadHeuresCreuses(); // Refresh list
                } else {
                    displayHcMessage(data.message || 'Erreur modification HC.', 'error');
                }
            } catch (error) {
                displayHcMessage('Erreur réseau modification HC.', 'error');
            }
        });
    }
    
    if (cancelEditHcButton) {
        cancelEditHcButton.addEventListener('click', () => {
            editHcForm.style.display = 'none';
            addHcForm.style.display = 'block';
            displayHcMessage('');
        });
    }

    async function handleDeleteHc(event) {
        const hcId = event.target.dataset.id;
        if (confirm('Voulez-vous vraiment supprimer cette période HC ?')) {
            try {
                const response = await fetch(`/api/heures_creuses/${hcId}`, { method: 'DELETE' });
                const data = await response.json();
                if (response.ok) {
                    displayHcMessage(data.message || 'Période HC supprimée!', 'success');
                    await loadHeuresCreuses(); // Refresh list
                } else {
                    displayHcMessage(data.message || 'Erreur suppression HC.', 'error');
                }
            } catch (error) {
                displayHcMessage('Erreur réseau suppression HC.', 'error');
            }
        }
    }

    // --- Appliance CRUD Event Listeners & Handlers ---
    const addApplianceForm = document.getElementById('add-appliance-form');
    const editApplianceForm = document.getElementById('edit-appliance-form');
    const cancelEditApplianceButton = document.getElementById('cancel-edit-appliance');

    if (addApplianceForm) {
        addApplianceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nom = document.getElementById('add-appliance-nom').value;
            const duree = parseInt(document.getElementById('add-appliance-duree').value);
            const type = document.getElementById('add-appliance-type').value;
            const pas = parseInt(document.getElementById('add-appliance-pas').value);
            try {
                const response = await fetch('/api/appliances', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nom, duree, type, pas }),
                });
                const data = await response.json();
                if (response.ok) {
                    displayApplianceMessage(data.message || 'Appareil ajouté!', 'success');
                    addApplianceForm.reset();
                    await loadAppliances(); // Refresh list and dropdown
                } else {
                    displayApplianceMessage(data.message || 'Erreur ajout appareil.', 'error');
                }
            } catch (error) {
                displayApplianceMessage('Erreur réseau ajout appareil.', 'error');
            }
        });
    }

    function handleEditApplianceShowForm(event) {
        const applianceId = event.target.dataset.id;
        // Find appliance by ID. Since userAppliances is an object keyed by name, we need to find by ID from a list.
        const applianceToEdit = Object.values(userAppliances).find(app => app.id == applianceId);

        if (!applianceToEdit) return;

        document.getElementById('edit-appliance-id').value = applianceToEdit.id;
        document.getElementById('edit-appliance-nom').value = applianceToEdit.nom;
        document.getElementById('edit-appliance-duree').value = applianceToEdit.duree;
        document.getElementById('edit-appliance-type').value = applianceToEdit.type;
        document.getElementById('edit-appliance-pas').value = applianceToEdit.pas;
        
        addApplianceForm.style.display = 'none';
        editApplianceForm.style.display = 'block';
        displayApplianceMessage('');
    }

    if (editApplianceForm) {
        editApplianceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-appliance-id').value;
            const nom = document.getElementById('edit-appliance-nom').value;
            const duree = parseInt(document.getElementById('edit-appliance-duree').value);
            const type = document.getElementById('edit-appliance-type').value;
            const pas = parseInt(document.getElementById('edit-appliance-pas').value);
            try {
                const response = await fetch(`/api/appliances/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nom, duree, type, pas }),
                });
                const data = await response.json();
                if (response.ok) {
                    displayApplianceMessage(data.message || 'Appareil modifié!', 'success');
                    editApplianceForm.reset();
                    editApplianceForm.style.display = 'none';
                    addApplianceForm.style.display = 'block';
                    await loadAppliances(); // Refresh list and dropdown
                } else {
                    displayApplianceMessage(data.message || 'Erreur modification appareil.', 'error');
                }
            } catch (error) {
                displayApplianceMessage('Erreur réseau modification appareil.', 'error');
            }
        });
    }

    if (cancelEditApplianceButton) {
        cancelEditApplianceButton.addEventListener('click', () => {
            editApplianceForm.style.display = 'none';
            addApplianceForm.style.display = 'block';
            displayApplianceMessage('');
        });
    }

    async function handleDeleteAppliance(event) {
        const applianceId = event.target.dataset.id;
        if (confirm('Voulez-vous vraiment supprimer cet appareil ?')) {
            try {
                const response = await fetch(`/api/appliances/${applianceId}`, { method: 'DELETE' });
                const data = await response.json();
                if (response.ok) {
                    displayApplianceMessage(data.message || 'Appareil supprimé!', 'success');
                    await loadAppliances(); // Refresh list and dropdown
                } else {
                    displayApplianceMessage(data.message || 'Erreur suppression appareil.', 'error');
                }
            } catch (error) {
                displayApplianceMessage('Erreur réseau suppression appareil.', 'error');
            }
        }
    }

    // --- Initial Setup ---
    checkLoginStatus(); // Check login status on page load, this will trigger showAppView if logged in
});
