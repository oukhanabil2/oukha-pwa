// Base de données IndexedDB pour SGA - Version corrigée
class SGA_Database {
    constructor() {
        this.db = null;
        this.dbName = 'SGA_DB_v4';
        this.dbVersion = 4;
        console.log(`📊 Constructeur DB: ${this.dbName} v${this.dbVersion}`);
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            console.log(`🚀 Ouverture DB: ${this.dbName} v${this.dbVersion}`);
            
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('❌ ERREUR IndexedDB:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                console.log('✅ DB ouverte avec succès');
                this.db = event.target.result;
                
                // Vérifier les stores
                console.log('📦 Stores disponibles:', Array.from(this.db.objectStoreNames));
                
                // Tester la connexion
                this.testConnection().then(() => {
                    console.log('✅ Test connexion OK');
                    localStorage.setItem('sga-db-version', this.dbVersion);
                    resolve(this.db);
                }).catch(err => {
                    console.error('❌ Test connexion échoué:', err);
                    reject(err);
                });
            };
            
            request.onupgradeneeded = (event) => {
                console.log('🔧 Mise à jour structure DB nécessaire');
                const db = event.target.result;
                this.createStores(db);
                console.log('✅ Structure mise à jour');
            };
            
            request.onblocked = (event) => {
                console.error('❌ DB bloquée par autre onglet');
                alert('Fermez les autres onglets de SGA');
            };
        });
    }

    createStores(db) {
        // Table agents
        if (!db.objectStoreNames.contains('agents')) {
            const agentsStore = db.createObjectStore('agents', { keyPath: 'code' });
            agentsStore.createIndex('groupe', 'groupe', { unique: false });
            agentsStore.createIndex('statut', 'statut', { unique: false });
            agentsStore.createIndex('nom', 'nom', { unique: false });
            agentsStore.createIndex('prenom', 'prenom', { unique: false });
        }

        // Table planning
        if (!db.objectStoreNames.contains('planning')) {
            const planningStore = db.createObjectStore('planning', { 
                keyPath: ['code_agent', 'date'] 
            });
            planningStore.createIndex('date', 'date', { unique: false });
            planningStore.createIndex('agent_date', ['code_agent', 'date'], { unique: true });
            planningStore.createIndex('shift', 'shift', { unique: false });
            planningStore.createIndex('origine', 'origine', { unique: false });
        }

        // Table jours fériés
        if (!db.objectStoreNames.contains('jours_feries')) {
            const feriesStore = db.createObjectStore('jours_feries', { keyPath: 'date' });
            feriesStore.createIndex('annee', 'annee', { unique: false });
        }

        // Table codes panique
        if (!db.objectStoreNames.contains('codes_panique')) {
            const paniqueStore = db.createObjectStore('codes_panique', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            paniqueStore.createIndex('code', 'code', { unique: true });
            paniqueStore.createIndex('code_agent', 'code_agent', { unique: false });
            paniqueStore.createIndex('statut', 'statut', { unique: false });
            paniqueStore.createIndex('date_expiration', 'date_expiration', { unique: false });
        }

        // Table radios
        if (!db.objectStoreNames.contains('radios')) {
            const radiosStore = db.createObjectStore('radios', { keyPath: 'numero' });
            radiosStore.createIndex('statut', 'statut', { unique: false });
            radiosStore.createIndex('agent_code', 'agent_code', { unique: false });
            radiosStore.createIndex('date_attribution', 'date_attribution', { unique: false });
        }

        // Table historique radio
        if (!db.objectStoreNames.contains('historique_radio')) {
            const histStore = db.createObjectStore('historique_radio', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            histStore.createIndex('numero_radio', 'numero_radio', { unique: false });
            histStore.createIndex('agent_code', 'agent_code', { unique: false });
            histStore.createIndex('date_attribution', 'date_attribution', { unique: false });
        }

        // Table habillement
        if (!db.objectStoreNames.contains('habillement')) {
            const habillementStore = db.createObjectStore('habillement', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            habillementStore.createIndex('agent_code', 'agent_code', { unique: false });
            habillementStore.createIndex('type_uniforme', 'type_uniforme', { unique: false });
            habillementStore.createIndex('taille', 'taille', { unique: false });
            habillementStore.createIndex('statut', 'statut', { unique: false });
            habillementStore.createIndex('date_commande', 'date_commande', { unique: false });
        }

        // Table avertissements
        if (!db.objectStoreNames.contains('avertissements')) {
            const avertStore = db.createObjectStore('avertissements', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            avertStore.createIndex('agent_code', 'agent_code', { unique: false });
            avertStore.createIndex('date', 'date', { unique: false });
            avertStore.createIndex('type', 'type', { unique: false });
            avertStore.createIndex('statut', 'statut', { unique: false });
        }

        // Table congés
        if (!db.objectStoreNames.contains('conges')) {
            const congesStore = db.createObjectStore('conges', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            congesStore.createIndex('agent_code', 'agent_code', { unique: false });
            congesStore.createIndex('date_debut', 'date_debut', { unique: false });
            congesStore.createIndex('date_fin', 'date_fin', { unique: false });
            congesStore.createIndex('type', 'type', { unique: false });
            congesStore.createIndex('statut', 'statut', { unique: false });
        }

        // Table configuration
        if (!db.objectStoreNames.contains('config')) {
            const configStore = db.createObjectStore('config', { keyPath: 'cle' });
        }
    }

    async testConnection() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['agents'], 'readonly');
            const store = transaction.objectStore('agents');
            const request = store.count();

            request.onsuccess = () => {
                console.log(`✅ Connexion OK - ${request.result} agents dans la base`);
                resolve();
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // ========================================
    // MÉTHODES GÉNÉRIQUES
    // ========================================

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            let store = transaction.objectStore(storeName);
            
            if (indexName) {
                store = store.index(indexName);
            }

            const request = query ? store.getAll(query) : store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async count(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            let store = transaction.objectStore(storeName);
            
            if (indexName) {
                store = store.index(indexName);
            }

            const request = query ? store.count(query) : store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async query(storeName, indexName, range) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ========================================
    // MÉTHODES AGENTS
    // ========================================

    async ajouterAgent(agent) {
        const agentData = {
            code: agent.code.toUpperCase(),
            nom: agent.nom,
            prenom: agent.prenom,
            groupe: agent.groupe.toUpperCase(),
            date_entree: agent.date_entree || new Date().toISOString().split('T')[0],
            date_sortie: null,
            statut: 'actif',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        return this.put('agents', agentData);
    }

    async listerAgents() {
        return this.getAll('agents');
    }

    async obtenirAgent(code) {
        return this.get('agents', code.toUpperCase());
    }

    async modifierAgent(code, updates) {
        const agent = await this.obtenirAgent(code);
        if (!agent) throw new Error('Agent non trouvé');
        
        const agentModifie = { 
            ...agent, 
            ...updates,
            updated_at: new Date().toISOString()
        };
        return this.put('agents', agentModifie);
    }

    async supprimerAgent(code) {
        const updates = {
            date_sortie: new Date().toISOString().split('T')[0],
            statut: 'inactif',
            updated_at: new Date().toISOString()
        };
        return this.modifierAgent(code, updates);
    }

    async obtenirAgentsParGroupe(groupe) {
        return this.query('agents', 'groupe', groupe.toUpperCase());
    }

    async obtenirAgentsActifs() {
        const agents = await this.listerAgents();
        return agents.filter(a => a.statut === 'actif');
    }

    // ========================================
    // MÉTHODES PLANNING
    // ========================================

    async enregistrerShift(code_agent, date, shift, origine = 'THEORIQUE') {
        const shiftData = {
            code_agent: code_agent.toUpperCase(),
            date: date,
            shift: shift.toUpperCase(),
            origine: origine,
            created_at: new Date().toISOString()
        };
        return this.put('planning', shiftData);
    }

    async obtenirPlanningAgent(code_agent, mois, annee) {
        const dateDebut = `${annee}-${mois.toString().padStart(2, '0')}-01`;
        const dateFin = `${annee}-${mois.toString().padStart(2, '0')}-31`;
        
        const planning = await this.query('planning', 'agent_date', 
            IDBKeyRange.bound([code_agent, dateDebut], [code_agent, dateFin])
        );
        
        return planning.sort((a, b) => a.date.localeCompare(b.date));
    }

    async obtenirPlanningGroupe(groupe, mois, annee) {
        const agents = await this.obtenirAgentsParGroupe(groupe);
        const result = [];
        
        for (const agent of agents) {
            const planning = await this.obtenirPlanningAgent(agent.code, mois, annee);
            result.push({
                agent,
                planning
            });
        }
        
        return result;
    }

    async obtenirPlanningMensuel(mois, annee) {
        const dateDebut = `${annee}-${mois.toString().padStart(2, '0')}-01`;
        const dateFin = `${annee}-${mois.toString().padStart(2, '0')}-31`;
        
        return this.query('planning', 'date', 
            IDBKeyRange.bound(dateDebut, dateFin)
        );
    }

    async modifierShiftPonctuel(code_agent, date, nouveau_shift) {
        return this.enregistrerShift(code_agent, date, nouveau_shift, 'MANUEL');
    }

    async echangerShifts(code_agent_a, code_agent_b, date) {
        const shift_a = await this.get('planning', [code_agent_a, date]);
        const shift_b = await this.get('planning', [code_agent_b, date]);
        
        if (shift_a && shift_b) {
            await this.enregistrerShift(code_agent_a, date, shift_b.shift, 'ECHANGE');
            await this.enregistrerShift(code_agent_b, date, shift_a.shift, 'ECHANGE');
            return true;
        }
        return false;
    }

    async enregistrerAbsence(code_agent, date, type) {
        return this.enregistrerShift(code_agent, date, type.toUpperCase(), 'ABSENCE');
    }

    // ========================================
    // MÉTHODES STATISTIQUES
    // ========================================

    async obtenirStatsGlobales() {
        try {
            const agents = await this.obtenirAgentsActifs();
            const radios = await this.obtenirStatsRadios();
            const conges = await this.obtenirCongesActifs();
            const avertissements = await this.obtenirAvertissementsActifs();
            
            // Compter les agents par groupe
            const agentsParGroupe = {};
            agents.forEach(agent => {
                const groupe = agent.groupe;
                agentsParGroupe[groupe] = (agentsParGroupe[groupe] || 0) + 1;
            });
            
            return {
                totalAgents: agents.length,
                agentsParGroupe,
                totalRadios: radios.total || 0,
                totalCongesActifs: conges.length,
                totalAvertissements: avertissements.length
            };
        } catch (error) {
            console.error('Erreur stats globales:', error);
            return {
                totalAgents: 0,
                agentsParGroupe: {},
                totalRadios: 0,
                totalCongesActifs: 0,
                totalAvertissements: 0
            };
        }
    }

    async obtenirStatistiquesAgent(code_agent, mois, annee) {
        const planning = await this.obtenirPlanningAgent(code_agent, mois, annee);
        
        const stats = {
            '1': 0, '2': 0, '3': 0, 'R': 0, 'C': 0, 'M': 0, 'A': 0, '-': 0
        };
        
        planning.forEach(p => {
            const shift = p.shift.toUpperCase();
            if (stats[shift] !== undefined) {
                stats[shift]++;
            }
        });
        
        const totalOperationnels = stats['1'] + stats['2'] + stats['3'];
        
        return {
            stats,
            totalOperationnels,
            totalJours: planning.length
        };
    }

    async obtenirStatistiquesGroupe(groupe, mois, annee) {
        const planningGroupe = await this.obtenirPlanningGroupe(groupe, mois, annee);
        const stats = {
            '1': 0, '2': 0, '3': 0, 'R': 0, 'C': 0, 'M': 0, 'A': 0
        };
        let totalOperationnels = 0;
        
        for (const item of planningGroupe) {
            const planning = item.planning;
            planning.forEach(p => {
                const shift = p.shift.toUpperCase();
                if (stats[shift] !== undefined) {
                    stats[shift]++;
                    if (['1', '2', '3'].includes(shift)) {
                        totalOperationnels++;
                    }
                }
            });
        }
        
        return {
            stats,
            totalOperationnels,
            totalAgents: planningGroupe.length
        };
    }

    async calculerJoursTravaillesGroupe(groupe, mois, annee) {
        const stats = await this.obtenirStatistiquesGroupe(groupe, mois, annee);
        return stats.totalOperationnels;
    }

    // ========================================
    // MÉTHODES RADIOS
    // ========================================

    async ajouterRadio(numero, modele = 'Standard', statut = 'disponible') {
        const radio = {
            numero: numero.toUpperCase(),
            modele: modele,
            statut: statut,
            agent_code: null,
            date_attribution: null,
            created_at: new Date().toISOString()
        };
        return this.put('radios', radio);
    }

    async obtenirRadio(numero) {
        return this.get('radios', numero.toUpperCase());
    }

    async attribuerRadio(numero, code_agent, date_attribution) {
        const radio = await this.obtenirRadio(numero);
        if (!radio) throw new Error('Radio non trouvée');
        
        radio.statut = 'attribuee';
        radio.agent_code = code_agent.toUpperCase();
        radio.date_attribution = date_attribution;
        radio.updated_at = new Date().toISOString();
        
        // Ajouter à l'historique
        await this.add('historique_radio', {
            numero_radio: numero.toUpperCase(),
            agent_code: code_agent.toUpperCase(),
            date_attribution: date_attribution,
            date_retour: null,
            created_at: new Date().toISOString()
        });
        
        return this.put('radios', radio);
    }

    async retournerRadio(numero, statut = 'disponible', remarques = '') {
        const radio = await this.obtenirRadio(numero);
        if (!radio) throw new Error('Radio non trouvée');
        
        // Mettre à jour le statut
        radio.statut = statut;
        radio.agent_code = null;
        radio.date_attribution = null;
        radio.updated_at = new Date().toISOString();
        
        // Mettre à jour l'historique
        const historiques = await this.query('historique_radio', 'numero_radio', numero.toUpperCase());
        const histActif = historiques.find(h => !h.date_retour);
        
        if (histActif) {
            histActif.date_retour = new Date().toISOString().split('T')[0];
            histActif.remarques = remarques;
            histActif.updated_at = new Date().toISOString();
            await this.put('historique_radio', histActif);
        }
        
        return this.put('radios', radio);
    }

    async obtenirRadiosAttribuees() {
        const radios = await this.getAll('radios');
        return radios.filter(r => r.statut === 'attribuee');
    }

    async obtenirRadiosDisponibles() {
        const radios = await this.getAll('radios');
        return radios.filter(r => r.statut === 'disponible');
    }

    async obtenirHistoriqueRadios() {
        return this.getAll('historique_radio');
    }

    async obtenirStatsRadios() {
        try {
            const radios = await this.getAll('radios');
            
            const stats = {
                total: radios.length,
                attribuees: 0,
                disponibles: 0,
                en_panne: 0
            };
            
            radios.forEach(radio => {
                if (radio.statut === 'attribuee') stats.attribuees++;
                if (radio.statut === 'disponible') stats.disponibles++;
                if (radio.statut === 'en_panne') stats.en_panne++;
            });
            
            return stats;
        } catch (error) {
            console.error('Erreur stats radios:', error);
            return {
                total: 0,
                attribuees: 0,
                disponibles: 0,
                en_panne: 0
            };
        }
    }

    // ========================================
    // MÉTHODES CODES PANIQUE
    // ========================================

    genererCodeUnique() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    calculerDateExpiration(jours) {
        const date = new Date();
        date.setDate(date.getDate() + jours);
        return date.toISOString().split('T')[0];
    }

    async genererCodesPanique() {
        try {
            // Générer 100 nouveaux codes
            const nouveauxCodes = [];
            
            for (let i = 1; i <= 100; i++) {
                const code = this.genererCodeUnique();
                const codeData = {
                    code: code,
                    numero: i,
                    agent_code: null,
                    agent_nom: null,
                    date_creation: new Date().toISOString().split('T')[0],
                    date_expiration: this.calculerDateExpiration(30),
                    statut: 'actif',
                    created_at: new Date().toISOString()
                };
                nouveauxCodes.push(codeData);
                await this.add('codes_panique', codeData);
            }
            
            return nouveauxCodes;
        } catch (error) {
            console.error('Erreur génération codes:', error);
            throw error;
        }
    }

    async obtenirCodesPanique() {
        const codes = await this.getAll('codes_panique');
        return codes.filter(c => c.statut !== 'archive').sort((a, b) => a.numero - b.numero);
    }

    async getCodePaniqueParCode(code) {
        const codes = await this.query('codes_panique', 'code', code);
        return codes[0];
    }

    async attribuerCodePanique(code, code_agent, date_expiration) {
        const codePanique = await this.getCodePaniqueParCode(code);
        if (!codePanique) throw new Error('Code panique non trouvé');
        
        const agent = await this.obtenirAgent(code_agent);
        if (!agent) throw new Error('Agent non trouvé');
        
        codePanique.agent_code = code_agent;
        codePanique.agent_nom = `${agent.nom} ${agent.prenom}`;
        codePanique.date_expiration = date_expiration;
        codePanique.statut = 'attribue';
        codePanique.updated_at = new Date().toISOString();
        
        return this.put('codes_panique', codePanique);
    }

    async marquerCodePaniqueUtilise(code) {
        const codePanique = await this.getCodePaniqueParCode(code);
        if (!codePanique) throw new Error('Code panique non trouvé');
        
        codePanique.statut = 'utilise';
        codePanique.date_utilisation = new Date().toISOString().split('T')[0];
        codePanique.updated_at = new Date().toISOString();
        
        return this.put('codes_panique', codePanique);
    }

    async reinitialiserCodesPanique() {
        try {
            const codes = await this.getAll('codes_panique');
            for (const code of codes) {
                code.statut = 'archive';
                await this.put('codes_panique', code);
            }
            return true;
        } catch (error) {
            console.error('Erreur réinitialisation codes:', error);
            throw error;
        }
    }

    // ========================================
    // MÉTHODES HABILLEMENT
    // ========================================

    async ajouterCommandeHabillement(commande) {
        const commandeData = {
            agent_code: commande.code_agent.toUpperCase(),
            type_uniforme: commande.type_uniforme,
            taille: commande.taille,
            quantite: commande.quantite || 1,
            date_commande: commande.date_commande || new Date().toISOString().split('T')[0],
            date_livraison: null,
            remarques: commande.remarques || '',
            statut: 'commande',
            created_at: new Date().toISOString()
        };
        return this.add('habillement', commandeData);
    }

    async obtenirCommandesHabillement() {
        try {
            const commandes = await this.getAll('habillement');
            const commandesAvecAgents = [];
            
            for (const commande of commandes) {
                try {
                    const agent = await this.obtenirAgent(commande.agent_code);
                    commandesAvecAgents.push({
                        ...commande,
                        agent_nom: agent ? `${agent.nom} ${agent.prenom}` : 'Agent inconnu'
                    });
                } catch (error) {
                    commandesAvecAgents.push({
                        ...commande,
                        agent_nom: 'Agent inconnu'
                    });
                }
            }
            
            return commandesAvecAgents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (error) {
            console.error('Erreur chargement habillement:', error);
            return [];
        }
    }

    async marquerCommandeLivree(id, date_livraison) {
        const commande = await this.get('habillement', id);
        if (!commande) throw new Error('Commande non trouvée');
        
        commande.statut = 'livre';
        commande.date_livraison = date_livraison;
        commande.updated_at = new Date().toISOString();
        
        return this.put('habillement', commande);
    }

    // ========================================
    // MÉTHODES AVERTISSEMENTS
    // ========================================

    async ajouterAvertissement(avertissement) {
        const avertData = {
            agent_code: avertissement.code_agent.toUpperCase(),
            type: avertissement.type,
            date: avertissement.date,
            motif: avertissement.motif,
            sanction: avertissement.sanction || '',
            date_fin_sanction: avertissement.date_fin_sanction || null,
            statut: 'actif',
            created_at: new Date().toISOString()
        };
        return this.add('avertissements', avertData);
    }

    async obtenirAvertissements() {
        try {
            const avertissements = await this.getAll('avertissements');
            const avertissementsAvecAgents = [];
            
            for (const avert of avertissements) {
                try {
                    const agent = await this.obtenirAgent(avert.agent_code);
                    avertissementsAvecAgents.push({
                        ...avert,
                        agent_nom: agent ? `${agent.nom} ${agent.prenom}` : 'Agent inconnu'
                    });
                } catch (error) {
                    avertissementsAvecAgents.push({
                        ...avert,
                        agent_nom: 'Agent inconnu'
                    });
                }
            }
            
            return avertissementsAvecAgents.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Erreur chargement avertissements:', error);
            return [];
        }
    }

    async obtenirAvertissementsActifs() {
        const avertissements = await this.obtenirAvertissements();
        return avertissements.filter(a => a.statut === 'actif');
    }

    async resoudreAvertissement(id, motifResolution) {
        const avertissement = await this.get('avertissements', id);
        if (!avertissement) throw new Error('Avertissement non trouvé');
        
        avertissement.statut = 'resolu';
        avertissement.motif_resolution = motifResolution;
        avertissement.date_resolution = new Date().toISOString().split('T')[0];
        avertissement.updated_at = new Date().toISOString();
        
        return this.put('avertissements', avertissement);
    }

    // ========================================
    // MÉTHODES CONGÉS
    // ========================================

    async demanderConge(conge) {
        const congeData = {
            agent_code: conge.code_agent.toUpperCase(),
            type: conge.type,
            date_debut: conge.date_debut,
            date_fin: conge.date_fin,
            motif: conge.motif || '',
            statut: 'en_attente',
            created_at: new Date().toISOString()
        };
        return this.add('conges', congeData);
    }

    async obtenirCongesMois(mois, annee) {
        const dateDebut = `${annee}-${mois.toString().padStart(2, '0')}-01`;
        const dateFin = `${annee}-${mois.toString().padStart(2, '0')}-31`;
        
        const conges = await this.query('conges', 'date_debut', 
            IDBKeyRange.bound(dateDebut, dateFin)
        );
        
        const congesAvecAgents = [];
        
        for (const conge of conges) {
            try {
                const agent = await this.obtenirAgent(conge.agent_code);
                congesAvecAgents.push({
                    ...conge,
                    agent_nom: agent ? `${agent.nom} ${agent.prenom}` : 'Agent inconnu'
                });
            } catch (error) {
                congesAvecAgents.push({
                    ...conge,
                    agent_nom: 'Agent inconnu'
                });
            }
        }
        
        return congesAvecAgents.sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut));
    }

    async obtenirCongesActifs() {
        try {
            const conges = await this.getAll('conges');
            return conges.filter(c => c.statut === 'approuve');
        } catch (error) {
            console.error('Erreur chargement congés:', error);
            return [];
        }
    }

    async verifierConflitsConge(code_agent, date_debut, date_fin) {
        const conges = await this.query('conges', 'agent_code', code_agent.toUpperCase());
        
        const conflits = conges.filter(conge => {
            const congeDebut = new Date(conge.date_debut);
            const congeFin = new Date(conge.date_fin);
            const demandeDebut = new Date(date_debut);
            const demandeFin = new Date(date_fin);
            
            return (demandeDebut <= congeFin && demandeFin >= congeDebut);
        });
        
        return conflits;
    }

    // ========================================
    // MÉTHODES JOURS FÉRIÉS
    // ========================================

    async ajouterJourFerie(ferie) {
        const ferieData = {
            date: ferie.date,
            nom: ferie.nom,
            annee: ferie.date.split('-')[0],
            created_at: new Date().toISOString()
        };
        return this.put('jours_feries', ferieData);
    }

    async obtenirJoursFeries() {
        return this.getAll('jours_feries');
    }

    async supprimerJourFerie(date) {
        return this.delete('jours_feries', date);
    }

    async estJourFerie(date) {
        const ferie = await this.get('jours_feries', date);
        return ferie !== undefined;
    }

    // ========================================
    // MÉTHODES OUTILS
    // ========================================

    async exporterBackup() {
        try {
            const donnees = {
                agents: await this.getAll('agents'),
                planning: await this.getAll('planning'),
                jours_feries: await this.getAll('jours_feries'),
                codes_panique: await this.getAll('codes_panique'),
                radios: await this.getAll('radios'),
                historique_radio: await this.getAll('historique_radio'),
                habillement: await this.getAll('habillement'),
                avertissements: await this.getAll('avertissements'),
                conges: await this.getAll('conges'),
                config: await this.getAll('config'),
                metadata: {
                    version: this.dbVersion,
                    date_export: new Date().toISOString(),
                    total_records: await this.count('agents') + 
                                  await this.count('planning') + 
                                  await this.count('radios') + 
                                  await this.count('conges')
                }
            };
            
            return donnees;
        } catch (error) {
            console.error('Erreur export backup:', error);
            throw error;
        }
    }

    async importerDonnees(donnees) {
        const data = JSON.parse(donnees);
        
        for (const store in data) {
            if (this.db.objectStoreNames.contains(store) && Array.isArray(data[store])) {
                // Vider le store
                const transaction = this.db.transaction([store], 'readwrite');
                const objectStore = transaction.objectStore(store);
                await objectStore.clear();
                
                // Ajouter les données
                for (const item of data[store]) {
                    await this.put(store, item);
                }
            }
        }
        
        return true;
    }

    async reparerBaseDonnees() {
        try {
            // Vérifier tous les stores
            const stores = ['agents', 'planning', 'radios', 'conges', 'avertissements'];
            let reparations = 0;
            
            for (const store of stores) {
                try {
                    const count = await this.count(store);
                    console.log(`✅ Store ${store}: ${count} enregistrements`);
                    reparations++;
                } catch (error) {
                    console.error(`❌ Store ${store}: ${error.message}`);
                }
            }
            
            return {
                success: true,
                message: `Base vérifiée - ${reparations} stores OK`,
                reparations: reparations
            };
        } catch (error) {
            console.error('Erreur réparation:', error);
            return {
                success: false,
                message: `Erreur: ${error.message}`,
                error: error
            };
        }
    }

    async reinitialiser() {
        try {
            // Vider tous les stores
            const stores = [
                'agents', 'planning', 'jours_feries', 'codes_panique',
                'radios', 'historique_radio', 'habillement', 
                'avertissements', 'conges', 'config'
            ];
            
            for (const store of stores) {
                try {
                    const transaction = this.db.transaction([store], 'readwrite');
                    const objectStore = transaction.objectStore(store);
                    await objectStore.clear();
                    console.log(`🗑️ Store ${store} vidé`);
                } catch (error) {
                    console.error(`Erreur vidage ${store}:`, error);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Erreur réinitialisation:', error);
            throw error;
        }
    }

    async mettreAJourStructure() {
        return {
            success: true,
            message: 'Structure déjà à jour',
            version: this.dbVersion
        };
    }

    async compterAbsencesParType(type, mois, annee) {
        const dateDebut = `${annee}-${mois.toString().padStart(2, '0')}-01`;
        const dateFin = `${annee}-${mois.toString().padStart(2, '0')}-31`;
        
        const planning = await this.query('planning', 'shift', type.toUpperCase());
        const absencesMois = planning.filter(p => {
            return p.date >= dateDebut && p.date <= dateFin;
        });
        
        return absencesMois.length;
    }
}

// Instance globale
const sgaDB = new SGA_Database();

// Exporter pour le navigateur
if (typeof window !== 'undefined') {
    window.sgaDB = sgaDB;
}