// Application SGA PWA - Version complète corrigée
class SGA_App {
    constructor() {
        this.db = sgaDB;
        this.planningEngine = null;
        this.currentPage = 'menu';
        this.history = [];
        this.theme = localStorage.getItem('sga-theme') || 'light';
        this.exportUtils = null;
        
        console.log('🚀 SGA_App constructor');
    }

    async initialize() {
        console.log('🔄 Initialisation SGA_App');
        
        try {
            // Initialiser la base de données
            await this.db.initialize();
            console.log('✅ Base initialisée');
            
            // Initialiser le moteur de planning
            this.planningEngine = new PlanningEngine(this.db);
            
            // Initialiser les utilitaires d'export
            this.exportUtils = new ExportUtils(this.db);
            this.exportUtils.setPlanningEngine(this.planningEngine);
            
            // Configurer les événements
            this.setupEventListeners();
            
            // Charger les agents initiaux si base vide
            await this.loadInitialData();
            
            // Appliquer le thème
            this.applyTheme();
            
            // Afficher la page d'accueil
            this.showMainMenu();
            
            // Mettre à jour les infos de base
            this.updateBaseInfo();
            
            console.log('🎉 SGA PWA initialisée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                this.navigateTo(page);
            });
        });

        // Bouton retour
        document.getElementById('backBtn')?.addEventListener('click', () => this.goBack());
        
        // Bouton thème
        document.getElementById('themeBtn')?.addEventListener('click', () => this.toggleTheme());
        
        // Bouton synchronisation
        document.getElementById('syncBtn')?.addEventListener('click', () => this.syncData());
        
        // Fermer modal avec ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
        
        // Fermer modal en cliquant sur l'overlay
        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') this.closeModal();
        });
    }

    async loadInitialData() {
        try {
            const agents = await this.db.listerAgents();
            if (agents.length === 0) {
                console.log('📥 Base vide - prête pour ajout manuel');
            }
        } catch (error) {
            console.error('❌ Erreur chargement initial:', error);
        }
    }

    updateBaseInfo() {
        this.db.obtenirStatsGlobales().then(stats => {
            const dbInfo = document.getElementById('dbInfo');
            if (dbInfo) {
                dbInfo.textContent = `Agents: ${stats.totalAgents} | Radios: ${stats.totalRadios || 0}`;
            }
        }).catch(error => {
            console.error('❌ Erreur stats:', error);
        });
    }

    // ========================================
    // FONCTIONS DE NAVIGATION
    // ========================================
    navigateTo(page, pushHistory = true) {
        if (page === this.currentPage) return;
        
        if (pushHistory && this.currentPage !== 'menu') {
            this.history.push(this.currentPage);
        }
        
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            if (page !== 'menu' && this.history.length > 0) {
                backBtn.style.display = 'block';
            } else {
                backBtn.style.display = 'none';
            }
        }
        
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.page === page) {
                tab.classList.add('active');
            }
        });
        
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        const pageElement = document.getElementById(`page${page.charAt(0).toUpperCase() + page.slice(1)}`);
        if (pageElement) {
            pageElement.classList.add('active');
        }
        
        this.updateSubtitle(page);
        this.loadPageContent(page);
        
        this.currentPage = page;
    }

    goBack() {
        if (this.history.length > 0) {
            const previousPage = this.history.pop();
            this.navigateTo(previousPage, false);
        } else {
            this.navigateTo('menu');
        }
    }

    updateSubtitle(page) {
        const subtitles = {
            'menu': 'Menu Principal',
            'agents': 'Gestion des Agents',
            'planning': 'Gestion du Planning',
            'stats': 'Statistiques',
            'radios': 'Gestion des Radios',
            'panique': 'Codes Panique',
            'habillement': 'Habillement',
            'avertissements': 'Avertissements',
            'conges': 'Gestion des Congés',
            'outils': 'Outils'
        };
        
        const subtitle = document.getElementById('pageSubtitle');
        if (subtitle) {
            subtitle.textContent = subtitles[page] || '';
        }
    }

    loadPageContent(page) {
        switch (page) {
            case 'menu':
                this.showMainMenu();
                break;
            case 'agents':
                this.showAgentsPage();
                break;
            case 'planning':
                this.showPlanningPage();
                break;
            case 'stats':
                this.showStatsPage();
                break;
            case 'radios':
                this.showRadiosPage();
                break;
            case 'panique':
                this.showPaniquePage();
                break;
            case 'habillement':
                this.showHabillementPage();
                break;
            case 'avertissements':
                this.showAvertissementsPage();
                break;
            case 'conges':
                this.showCongesPage();
                break;
            case 'outils':
                this.showOutilsPage();
                break;
        }
    }

    // ========================================
    // FONCTIONS UTILITAIRES
    // ========================================
    showModal(content) {
        const modal = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');
        
        if (!modal || !modalContainer) {
            console.error('❌ Éléments modal non trouvés');
            return;
        }
        
        modalContainer.innerHTML = content;
        modal.style.display = 'block';
        modalContainer.style.display = 'block';
        
        // Focus sur le premier champ
        setTimeout(() => {
            const firstInput = modalContainer.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    closeModal() {
        const modal = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');
        
        if (modal) modal.style.display = 'none';
        if (modalContainer) modalContainer.style.display = 'none';
    }

    showToast(message, type = 'info') {
        // Créer le conteneur s'il n'existe pas
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('sga-theme', this.theme);
        this.applyTheme();
        
        const icon = document.getElementById('themeBtn');
        if (icon) {
            icon.textContent = this.theme === 'light' ? '🌙' : '☀️';
        }
    }

    async syncData() {
        this.showToast('Synchronisation en cours...', 'info');
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            localStorage.setItem('sga-last-sync', new Date().toLocaleString());
            this.updateBaseInfo();
            
            this.showToast('Synchronisation terminée', 'success');
        } catch (error) {
            this.showToast('Erreur de synchronisation', 'error');
        }
    }

    // ========================================
    // PAGE MENU PRINCIPAL
    // ========================================
    showMainMenu() {
        const menuGrid = document.querySelector('.menu-grid');
        if (!menuGrid) return;
        
        const menuItems = [
            {
                icon: '👥',
                title: 'GESTION DES AGENTS',
                description: 'Ajouter, modifier, lister, importer agents',
                action: () => this.navigateTo('agents')
            },
            {
                icon: '📅',
                title: 'GESTION DU PLANNING',
                description: 'Planning global, par agent, par groupe',
                action: () => this.navigateTo('planning')
            },
            {
                icon: '📊',
                title: 'STATISTIQUES',
                description: 'Stats agents, groupes, export Excel/PDF',
                action: () => this.navigateTo('stats')
            },
            {
                icon: '📻',
                title: 'GESTION RADIOS',
                description: 'Attribution, retour, statut des radios',
                action: () => this.navigateTo('radios')
            },
            {
                icon: '🚨',
                title: 'CODES PANIQUE',
                description: 'Gestion des codes de sécurité',
                action: () => this.navigateTo('panique')
            },
            {
                icon: '👕',
                title: 'HABILLEMENT',
                description: 'Taille et fourniture des uniformes',
                action: () => this.navigateTo('habillement')
            },
            {
                icon: '⚠️',
                title: 'AVERTISSEMENTS',
                description: 'Suivi disciplinaire des agents',
                action: () => this.navigateTo('avertissements')
            },
            {
                icon: '🏖️',
                title: 'CONGÉS',
                description: 'Gestion des congés par période',
                action: () => this.navigateTo('conges')
            },
            {
                icon: '🎯',
                title: 'JOURS FÉRIÉS',
                description: 'Gestion des jours fériés',
                action: () => this.showFeriesMenu()
            },
            {
                icon: '🛠️',
                title: 'OUTILS',
                description: 'Import/Export, réparation base',
                action: () => this.navigateTo('outils')
            }
        ];
        
        menuGrid.innerHTML = '';
        menuItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.innerHTML = `
                <h3><span>${item.icon}</span> ${item.title}</h3>
                <p>${item.description}</p>
            `;
            card.addEventListener('click', item.action);
            menuGrid.appendChild(card);
        });
    }

    // ========================================
    // PAGE GESTION DES AGENTS
    // ========================================
    async showAgentsPage() {
        const content = document.getElementById('agentsContent');
        
        content.innerHTML = `
            <div class="page-actions">
                <button class="btn btn-success" onclick="sgaApp.showAjouterAgentForm()">
                    ➕ Ajouter Agent
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.exporterAgentsExcel()">
                    📤 Exporter Excel
                </button>
            </div>
            
            <div class="search-bar">
                <input type="text" id="searchAgent" class="form-input" 
                       placeholder="Rechercher par code, nom, groupe..." 
                       onkeyup="sgaApp.filterAgents()">
            </div>
            
            <div class="table-container">
                <table class="table" id="agentsTable">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Groupe</th>
                            <th>Date Entrée</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="agentsTableBody">
                        <tr><td colspan="7" class="loading">Chargement des agents...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <div class="page-footer">
                <div id="agentsStats"></div>
            </div>
        `;
        
        await this.loadAgentsList();
    }

    async loadAgentsList() {
        const tbody = document.getElementById('agentsTableBody');
        const statsDiv = document.getElementById('agentsStats');
        
        try {
            const agents = await this.db.listerAgents();
            
            if (agents.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="empty">
                            <p>Aucun agent trouvé</p>
                            <button class="btn" onclick="sgaApp.showAjouterAgentForm()">
                                Ajouter le premier agent
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Compter par groupe
            const groupes = {};
            agents.forEach(agent => {
                groupes[agent.groupe] = (groupes[agent.groupe] || 0) + 1;
            });
            
            // Mettre à jour les statistiques
            if (statsDiv) {
                statsDiv.innerHTML = `
                    <strong>Total: ${agents.length} agents</strong> | 
                    A: ${groupes['A'] || 0} | B: ${groupes['B'] || 0} | 
                    C: ${groupes['C'] || 0} | D: ${groupes['D'] || 0} | 
                    E: ${groupes['E'] || 0}
                `;
            }
            
            // Remplir le tableau
            tbody.innerHTML = agents.map(agent => `
                <tr>
                    <td><strong>${agent.code}</strong></td>
                    <td>${agent.nom}</td>
                    <td>${agent.prenom}</td>
                    <td><span class="badge badge-groupe-${agent.groupe}">${agent.groupe}</span></td>
                    <td>${agent.date_entree || '-'}</td>
                    <td><span class="badge ${agent.statut === 'actif' ? 'badge-shift-1' : 'badge-shift-A'}">
                        ${agent.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="sgaApp.modifierAgent('${agent.code}')" title="Modifier">
                                ✏️
                            </button>
                            <button class="btn-icon" onclick="sgaApp.voirPlanningAgent('${agent.code}')" title="Planning">
                                📅
                            </button>
                            <button class="btn-icon" onclick="sgaApp.voirStatsAgent('${agent.code}')" title="Statistiques">
                                📊
                            </button>
                            ${agent.statut === 'actif' ? `
                            <button class="btn-icon" onclick="sgaApp.supprimerAgent('${agent.code}')" title="Désactiver">
                                🗑️
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
            
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="error">
                        Erreur lors du chargement: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    showAjouterAgentForm() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">➕ Ajouter un Agent</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            <form id="formAjoutAgent" onsubmit="return sgaApp.validerAjoutAgent(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Code Agent*</label>
                        <input type="text" class="form-input" name="code" 
                               placeholder="Ex: CPA, CONA, ZA" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Groupe*</label>
                        <select class="form-select" name="groupe" required>
                            <option value="">Sélectionner...</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Nom*</label>
                        <input type="text" class="form-input" name="nom" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Prénom*</label>
                        <input type="text" class="form-input" name="prenom" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date d'entrée</label>
                    <input type="date" class="form-input" name="date_entree" 
                           value="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-success">Ajouter l'agent</button>
                    <button type="button" class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Annuler
                    </button>
                </div>
            </form>
        `);
    }

    async validerAjoutAgent(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const agent = {
            code: formData.get('code').toUpperCase(),
            nom: formData.get('nom'),
            prenom: formData.get('prenom'),
            groupe: formData.get('groupe'),
            date_entree: formData.get('date_entree')
        };
        
        try {
            await this.db.ajouterAgent(agent);
            this.closeModal();
            this.showToast(`Agent ${agent.code} ajouté avec succès`, 'success');
            await this.loadAgentsList();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async modifierAgent(code) {
        try {
            const agent = await this.db.obtenirAgent(code);
            if (!agent) {
                this.showToast('Agent non trouvé', 'error');
                return;
            }
            
            this.showModal(`
                <div class="modal-header">
                    <h3 class="modal-title">✏️ Modifier Agent ${code}</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                <form id="formModifAgent" onsubmit="return sgaApp.validerModifAgent(event, '${code}')">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Code Agent</label>
                            <input type="text" class="form-input" value="${agent.code}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Groupe*</label>
                            <select class="form-select" name="groupe" required>
                                <option value="A" ${agent.groupe === 'A' ? 'selected' : ''}>A</option>
                                <option value="B" ${agent.groupe === 'B' ? 'selected' : ''}>B</option>
                                <option value="C" ${agent.groupe === 'C' ? 'selected' : ''}>C</option>
                                <option value="D" ${agent.groupe === 'D' ? 'selected' : ''}>D</option>
                                <option value="E" ${agent.groupe === 'E' ? 'selected' : ''}>E</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Nom*</label>
                            <input type="text" class="form-input" name="nom" 
                                   value="${agent.nom}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Prénom*</label>
                            <input type="text" class="form-input" name="prenom" 
                                   value="${agent.prenom}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Date d'entrée</label>
                            <input type="date" class="form-input" name="date_entree" 
                                   value="${agent.date_entree || new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date de sortie</label>
                            <input type="date" class="form-input" name="date_sortie" 
                                   value="${agent.date_sortie || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Statut</label>
                        <select class="form-select" name="statut">
                            <option value="actif" ${agent.statut === 'actif' ? 'selected' : ''}>Actif</option>
                            <option value="inactif" ${agent.statut === 'inactif' ? 'selected' : ''}>Inactif</option>
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-success">Enregistrer</button>
                        <button type="button" class="btn btn-secondary" onclick="sgaApp.closeModal()">
                            Annuler
                        </button>
                    </div>
                </form>
            `);
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async validerModifAgent(event, code) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const updates = {
            nom: formData.get('nom'),
            prenom: formData.get('prenom'),
            groupe: formData.get('groupe'),
            date_entree: formData.get('date_entree'),
            date_sortie: formData.get('date_sortie') || null,
            statut: formData.get('statut')
        };
        
        try {
            await this.db.modifierAgent(code, updates);
            this.closeModal();
            this.showToast(`Agent ${code} modifié avec succès`, 'success');
            await this.loadAgentsList();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async supprimerAgent(code) {
        if (confirm(`Voulez-vous vraiment désactiver l'agent ${code} ?`)) {
            try {
                await this.db.supprimerAgent(code);
                this.showToast(`Agent ${code} désactivé`, 'warning');
                await this.loadAgentsList();
            } catch (error) {
                this.showToast(`Erreur: ${error.message}`, 'error');
            }
        }
    }

    async voirPlanningAgent(code) {
        try {
            const agent = await this.db.obtenirAgent(code);
            const mois = new Date().getMonth() + 1;
            const annee = new Date().getFullYear();
            
            const planning = await this.planningEngine.genererPlanningTheorique(code, mois, annee);
            
            let html = `
                <div class="modal-header">
                    <h3 class="modal-title">📅 Planning ${agent.code}</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                
                <div class="agent-info">
                    <p><strong>${agent.nom} ${agent.prenom}</strong> | Groupe: ${agent.groupe}</p>
                    <p>Période: ${mois}/${annee} (${planning.length} jours)</p>
                </div>
                
                <div class="planning-grid">
            `;
            
            planning.forEach(jour => {
                let className = '';
                if (jour.est_dimanche) className += ' dimanche';
                if (jour.ferie) className += ' ferie';
                if (jour.shift === 'R') className += ' repos';
                if (jour.shift === 'M') className += ' maladie';
                if (jour.shift === 'A') className += ' absence';
                if (jour.shift === 'C') className += ' conge';
                
                html += `
                    <div class="planning-day ${className.trim()}">
                        <div class="day-number">${jour.jour}</div>
                        <div class="day-name">${jour.jour_semaine}</div>
                        <div class="day-shift badge badge-shift-${jour.shift}">${jour.shift}</div>
                        ${jour.ferie ? '<div class="day-ferie">🎯</div>' : ''}
                    </div>
                `;
            });
            
            html += `
                </div>
                
                <div class="planning-summary">
                    <h4>Récapitulatif</h4>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${planning.filter(j => j.shift === '1').length}</div>
                            <div class="stat-label">Matin (1)</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${planning.filter(j => j.shift === '2').length}</div>
                            <div class="stat-label">Après-midi (2)</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${planning.filter(j => j.shift === '3').length}</div>
                            <div class="stat-label">Nuit (3)</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${planning.filter(j => j.shift === 'R').length}</div>
                            <div class="stat-label">Repos (R)</div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Fermer
                    </button>
                </div>
            `;
            
            this.showModal(html);
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async voirStatsAgent(code, mois = null, annee = null) {
        try {
            const agent = await this.db.obtenirAgent(code);
            if (!mois) mois = new Date().getMonth() + 1;
            if (!annee) annee = new Date().getFullYear();
            
            const stats = await this.planningEngine.calculerStatsAgent(code, mois, annee);
            
            let html = `
                <div class="modal-header">
                    <h3 class="modal-title">📊 Statistiques ${agent.code}</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                
                <div class="agent-info">
                    <p><strong>${agent.nom} ${agent.prenom}</strong> | Groupe: ${agent.groupe}</p>
                    <p>Période: ${mois}/${annee}</p>
                </div>
                
                <div class="stats-details">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Valeur</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Shifts Matin (1)</td>
                                <td><span class="badge badge-shift-1">${stats.stats['1']}</span></td>
                            </tr>
                            <tr>
                                <td>Shifts Après-midi (2)</td>
                                <td><span class="badge badge-shift-2">${stats.stats['2']}</span></td>
                            </tr>
                            <tr>
                                <td>Shifts Nuit (3)</td>
                                <td><span class="badge badge-shift-3">${stats.stats['3']}</span></td>
                            </tr>
                            <tr>
                                <td>Jours Repos (R)</td>
                                <td><span class="badge badge-shift-R">${stats.stats['R']}</span></td>
                            </tr>
                            <tr>
                                <td>Congés (C)</td>
                                <td><span class="badge badge-shift-C">${stats.stats['C']}</span></td>
                            </tr>
                            <tr>
                                <td>Maladie (M)</td>
                                <td><span class="badge badge-shift-M">${stats.stats['M']}</span></td>
                            </tr>
                            <tr>
                                <td>Autre Absence (A)</td>
                                <td><span class="badge badge-shift-A">${stats.stats['A']}</span></td>
                            </tr>
                            <tr>
                                <td>Fériés travaillés</td>
                                <td>${stats.joursFeriesTravailles}</td>
                            </tr>
                            <tr>
                                <td>Non-planifié (-)</td>
                                <td>${stats.stats['-']}</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>TOTAL SHIFTS OPÉRATIONNELS</strong></td>
                                <td><strong class="total-value">${stats.totalOperationnels}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="stats-summary">
                    <p><strong>Total jours: ${stats.totalJours}</strong></p>
                    <p>Jours travaillés: ${stats.totalJoursTravailles}</p>
                    <p>Taux de présence: ${((stats.totalJoursTravailles / stats.totalJours) * 100).toFixed(1)}%</p>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Fermer
                    </button>
                </div>
            `;
            
            this.showModal(html);
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    filterAgents() {
        const searchTerm = document.getElementById('searchAgent')?.value.toLowerCase() || '';
        const rows = document.querySelectorAll('#agentsTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    async exporterAgentsExcel() {
        try {
            const agents = await this.db.listerAgents();
            
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Code;Nom;Prénom;Groupe;Date Entrée;Statut\n";
            
            agents.forEach(agent => {
                csvContent += `${agent.code};${agent.nom};${agent.prenom};${agent.groupe};${agent.date_entree || ''};${agent.statut}\n`;
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `agents-sga-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('Export CSV réussi', 'success');
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    // ========================================
    // PAGE PLANNING
    // ========================================
    async showPlanningPage() {
        const content = document.getElementById('planningContent');
        
        content.innerHTML = `
            <div class="page-header">
                <h3>📅 GESTION DU PLANNING</h3>
                <p>Sélectionnez une option ci-dessous</p>
            </div>
            
            <div class="menu-grid">
                <div class="menu-card" onclick="sgaApp.showPlanningGlobal()">
                    <h3><span>🌍</span> PLANNING MENSUEL GLOBAL</h3>
                    <p>Vue complète de tous les agents</p>
                </div>
                <div class="menu-card" onclick="sgaApp.showPlanningParAgent()">
                    <h3><span>👤</span> PLANNING MENSUEL AGENT</h3>
                    <p>Planning individuel par agent</p>
                </div>
                <div class="menu-card" onclick="sgaApp.showPlanningParGroupe()">
                    <h3><span>👥</span> PLANNING PAR GROUPE</h3>
                    <p>Planning par équipe A, B, C, D, E</p>
                </div>
                <div class="menu-card" onclick="sgaApp.genererPlanningMensuel()">
                    <h3><span>🎯</span> GÉNÉRER PLANNING</h3>
                    <p>Générer planning théorique du mois</p>
                </div>
            </div>
        `;
    }

    async showPlanningGlobal() {
        const mois = new Date().getMonth() + 1;
        const annee = new Date().getFullYear();
        
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">🌍 Planning Mensuel Global</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Mois</label>
                <select class="form-select" id="planningMois">
                    ${Array.from({length: 12}, (_, i) => 
                        `<option value="${i+1}" ${i+1 === mois ? 'selected' : ''}>
                            ${new Date(2000, i, 1).toLocaleDateString('fr-FR', {month: 'long'})}
                        </option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Année</label>
                <input type="number" class="form-input" id="planningAnnee" 
                       value="${annee}" min="2020" max="2030">
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-success" onclick="sgaApp.afficherPlanningGlobal()">
                    Afficher Planning
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Annuler
                </button>
            </div>
        `);
    }

    async afficherPlanningGlobal() {
        const mois = parseInt(document.getElementById('planningMois').value);
        const annee = parseInt(document.getElementById('planningAnnee').value);
        
        try {
            const agents = await this.db.obtenirAgentsActifs();
            const joursDansMois = new Date(annee, mois, 0).getDate();
            
            let html = `
                <div class="modal-header">
                    <h3 class="modal-title">Planning Global - ${mois}/${annee}</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                
                <div class="planning-info">
                    <p><strong>${agents.length} agents actifs</strong> | ${joursDansMois} jours</p>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Nom</th>
                                <th>Groupe</th>
                                ${Array.from({length: joursDansMois}, (_, i) => 
                                    `<th title="${i+1}/${mois}">J${i+1}</th>`
                                ).join('')}
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            for (const agent of agents) {
                const planning = await this.planningEngine.genererPlanningTheorique(agent.code, mois, annee);
                
                html += `
                    <tr>
                        <td><strong>${agent.code}</strong></td>
                        <td>${agent.nom}</td>
                        <td><span class="badge badge-groupe-${agent.groupe}">${agent.groupe}</span></td>
                `;
                
                planning.forEach(jour => {
                    let className = '';
                    if (jour.est_dimanche) className = 'dimanche';
                    if (jour.ferie) className = 'ferie';
                    
                    html += `
                        <td class="${className}">
                            <span class="badge badge-shift-${jour.shift}">${jour.shift}</span>
                        </td>
                    `;
                });
                
                html += `</tr>`;
            }
            
            html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Fermer
                    </button>
                </div>
            `;
            
            this.showModal(html);
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async showPlanningParGroupe() {
        const mois = new Date().getMonth() + 1;
        const annee = new Date().getFullYear();
        
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">👥 Planning par Groupe</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Groupe</label>
                <select class="form-select" id="planningGroupe">
                    <option value="A">Groupe A</option>
                    <option value="B">Groupe B</option>
                    <option value="C">Groupe C</option>
                    <option value="D">Groupe D</option>
                    <option value="E">Groupe E</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Mois</label>
                    <select class="form-select" id="planningGroupeMois">
                        ${Array.from({length: 12}, (_, i) => 
                            `<option value="${i+1}" ${i+1 === mois ? 'selected' : ''}>
                                ${new Date(2000, i, 1).toLocaleDateString('fr-FR', {month: 'long'})}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Année</label>
                    <input type="number" class="form-input" id="planningGroupeAnnee" 
                           value="${annee}" min="2020" max="2030">
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-success" onclick="sgaApp.afficherPlanningGroupe()">
                    Afficher Planning
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Annuler
                </button>
            </div>
        `);
    }

    async afficherPlanningGroupe() {
        const groupe = document.getElementById('planningGroupe').value;
        const mois = parseInt(document.getElementById('planningGroupeMois').value);
        const annee = parseInt(document.getElementById('planningGroupeAnnee').value);
        
        try {
            const planningGroupe = await this.planningEngine.genererPlanningGroupe(groupe, mois, annee);
            const joursDansMois = new Date(annee, mois, 0).getDate();
            
            let html = `
                <div class="modal-header">
                    <h3 class="modal-title">Planning Groupe ${groupe} - ${mois}/${annee}</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                
                <div class="planning-info">
                    <p><strong>${planningGroupe.length} agents</strong> | ${joursDansMois} jours</p>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Nom</th>
                                ${Array.from({length: joursDansMois}, (_, i) => 
                                    `<th title="${i+1}/${mois}">J${i+1}</th>`
                                ).join('')}
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            for (const item of planningGroupe) {
                const agent = item.agent;
                
                html += `
                    <tr>
                        <td><strong>${agent.code}</strong></td>
                        <td>${agent.nom}</td>
                `;
                
                item.planning.forEach(jour => {
                    let className = '';
                    if (jour.est_dimanche) className = 'dimanche';
                    if (jour.ferie) className = 'ferie';
                    
                    html += `
                        <td class="${className}">
                            <span class="badge badge-shift-${jour.shift}">${jour.shift}</span>
                        </td>
                    `;
                });
                
                html += `</tr>`;
            }
            
            // Calculer les stats du groupe
            const statsGroupe = await this.planningEngine.calculerJoursTravaillesGroupe(groupe, mois, annee);
            
            html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="groupe-stats">
                    <h4>Statistiques du Groupe ${groupe}</h4>
                    <p><strong>Total jours opérationnels: ${statsGroupe}</strong></p>
                    <p>Moyenne par agent: ${planningGroupe.length > 0 ? (statsGroupe / planningGroupe.length).toFixed(1) : 0} jours</p>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Fermer
                    </button>
                </div>
            `;
            
            this.showModal(html);
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async genererPlanningMensuel() {
        const mois = new Date().getMonth() + 1;
        const annee = new Date().getFullYear();
        
        try {
            const agents = await this.db.obtenirAgentsActifs();
            let totalGenerated = 0;
            
            for (const agent of agents) {
                await this.planningEngine.genererPlanningTheorique(agent.code, mois, annee);
                totalGenerated++;
            }
            
            this.showToast(`Planning généré pour ${totalGenerated} agents`, 'success');
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async showPlanningParAgent() {
        const mois = new Date().getMonth() + 1;
        const annee = new Date().getFullYear();
        
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">👤 Planning par Agent</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Code Agent</label>
                <input type="text" class="form-input" id="planningAgentCode" 
                       placeholder="Ex: CPA, CONA" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Mois</label>
                    <select class="form-select" id="planningAgentMois">
                        ${Array.from({length: 12}, (_, i) => 
                            `<option value="${i+1}" ${i+1 === mois ? 'selected' : ''}>
                                ${new Date(2000, i, 1).toLocaleDateString('fr-FR', {month: 'long'})}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Année</label>
                    <input type="number" class="form-input" id="planningAgentAnnee" 
                           value="${annee}" min="2020" max="2030">
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-success" onclick="sgaApp.afficherPlanningAgent()">
                    Afficher Planning
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Annuler
                </button>
            </div>
        `);
    }

    async afficherPlanningAgent() {
        const code = document.getElementById('planningAgentCode')?.value?.toUpperCase();
        const mois = parseInt(document.getElementById('planningAgentMois')?.value);
        const annee = parseInt(document.getElementById('planningAgentAnnee')?.value);
        
        if (!code) {
            this.showToast('Veuillez entrer un code agent', 'error');
            return;
        }
        
        await this.voirPlanningAgent(code, mois, annee);
    }

    // ========================================
    // PAGE STATISTIQUES
    // ========================================
    async showStatsPage() {
        const content = document.getElementById('statsContent');
        
        content.innerHTML = `
            <div class="page-header">
                <h3>📊 STATISTIQUES</h3>
                <p>Sélectionnez une option ci-dessous</p>
            </div>
            
            <div class="menu-grid">
                <div class="menu-card" onclick="sgaApp.showStatsParAgent()">
                    <h3><span>👤</span> STATS PAR AGENT</h3>
                    <p>Statistiques individuelles détaillées</p>
                </div>
                <div class="menu-card" onclick="sgaApp.showStatsParGroupe()">
                    <h3><span>👥</span> STATS PAR GROUPE</h3>
                    <p>Statistiques par équipe A, B, C, D, E</p>
                </div>
                <div class="menu-card" onclick="sgaApp.showStatsGlobales()">
                    <h3><span>🌍</span> STATS GLOBALES</h3>
                    <p>Vue d'ensemble de tous les agents</p>
                </div>
            </div>
        `;
    }

    async showStatsParAgent() {
        const mois = new Date().getMonth() + 1;
        const annee = new Date().getFullYear();
        
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">📊 Statistiques par Agent</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Code Agent</label>
                <input type="text" class="form-input" id="statsAgentCode" 
                       placeholder="Ex: CPA, CONA" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Mois</label>
                    <select class="form-select" id="statsAgentMois">
                        ${Array.from({length: 12}, (_, i) => 
                            `<option value="${i+1}" ${i+1 === mois ? 'selected' : ''}>
                                ${new Date(2000, i, 1).toLocaleDateString('fr-FR', {month: 'long'})}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Année</label>
                    <input type="number" class="form-input" id="statsAgentAnnee" 
                           value="${annee}" min="2020" max="2030">
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-success" onclick="sgaApp.afficherStatsAgent()">
                    Afficher Statistiques
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Annuler
                </button>
            </div>
        `);
    }

    async afficherStatsAgent() {
        const code = document.getElementById('statsAgentCode')?.value?.toUpperCase();
        const mois = parseInt(document.getElementById('statsAgentMois')?.value);
        const annee = parseInt(document.getElementById('statsAgentAnnee')?.value);
        
        if (!code) {
            this.showToast('Veuillez entrer un code agent', 'error');
            return;
        }
        
        await this.voirStatsAgent(code, mois, annee);
    }

    async showStatsParGroupe() {
        const mois = new Date().getMonth() + 1;
        const annee = new Date().getFullYear();
        
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">📊 Statistiques par Groupe</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Groupe</label>
                <select class="form-select" id="statsGroupe">
                    <option value="A">Groupe A</option>
                    <option value="B">Groupe B</option>
                    <option value="C">Groupe C</option>
                    <option value="D">Groupe D</option>
                    <option value="E">Groupe E</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Mois</label>
                    <select class="form-select" id="statsGroupeMois">
                        ${Array.from({length: 12}, (_, i) => 
                            `<option value="${i+1}" ${i+1 === mois ? 'selected' : ''}>
                                ${new Date(2000, i, 1).toLocaleDateString('fr-FR', {month: 'long'})}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Année</label>
                    <input type="number" class="form-input" id="statsGroupeAnnee" 
                           value="${annee}" min="2020" max="2030">
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-success" onclick="sgaApp.afficherStatsGroupe()">
                    Afficher Statistiques
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Annuler
                </button>
            </div>
        `);
    }

    async afficherStatsGroupe() {
        const groupe = document.getElementById('statsGroupe')?.value;
        const mois = parseInt(document.getElementById('statsGroupeMois')?.value);
        const annee = parseInt(document.getElementById('statsGroupeAnnee')?.value);
        
        if (!groupe) {
            this.showToast('Veuillez sélectionner un groupe', 'error');
            return;
        }
        
        await this.afficherStatsGroupePopup(groupe, mois, annee);
    }

    async afficherStatsGroupePopup(groupe, mois, annee) {
        try {
            const agents = await this.db.obtenirAgentsParGroupe(groupe);
            const agentsActifs = agents.filter(a => a.statut === 'actif');
            
            let totalShifts1 = 0;
            let totalShifts2 = 0;
            let totalShifts3 = 0;
            let totalOperationnels = 0;
            
            const agentsStats = [];
            
            for (const agent of agentsActifs) {
                const stats = await this.planningEngine.calculerStatsAgent(agent.code, mois, annee);
                
                totalShifts1 += stats.stats['1'];
                totalShifts2 += stats.stats['2'];
                totalShifts3 += stats.stats['3'];
                totalOperationnels += stats.totalOperationnels;
                
                agentsStats.push({
                    code: agent.code,
                    nom: `${agent.nom} ${agent.prenom}`,
                    shifts1: stats.stats['1'],
                    shifts2: stats.stats['2'],
                    shifts3: stats.stats['3'],
                    total: stats.totalOperationnels
                });
            }
            
            // Trier par total décroissant
            agentsStats.sort((a, b) => b.total - a.total);
            
            let html = `
                <div class="modal-header">
                    <h3 class="modal-title">📊 Statistiques Groupe ${groupe}</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                
                <div class="groupe-info">
                    <p>Période: ${mois}/${annee} | Effectif: ${agentsActifs.length} agents</p>
                </div>
                
                <div class="stats-resume">
                    <h4>Résumé du Groupe</h4>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${totalShifts1}</div>
                            <div class="stat-label">Shifts Matin</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${totalShifts2}</div>
                            <div class="stat-label">Shifts Après-midi</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${totalShifts3}</div>
                            <div class="stat-label">Shifts Nuit</div>
                        </div>
                        <div class="stat-card total">
                            <div class="stat-value">${totalOperationnels}</div>
                            <div class="stat-label">TOTAL</div>
                        </div>
                    </div>
                </div>
                
                <div class="classement-groupe">
                    <h4>Classement par Total</h4>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Code</th>
                                    <th>Nom</th>
                                    <th>TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            agentsStats.forEach((agent, index) => {
                let rangText = `${index + 1}.`;
                let rangClass = '';
                
                if (index === 0) {
                    rangText = '🥇 1.';
                    rangClass = 'gold';
                } else if (index === 1) {
                    rangText = '🥈 2.';
                    rangClass = 'silver';
                } else if (index === 2) {
                    rangText = '🥉 3.';
                    rangClass = 'bronze';
                }
                
                html += `
                    <tr>
                        <td class="${rangClass}"><strong>${rangText}</strong></td>
                        <td><strong>${agent.code}</strong></td>
                        <td>${agent.nom}</td>
                        <td><strong class="total-value">${agent.total}</strong></td>
                    </tr>
                `;
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Fermer
                    </button>
                </div>
            `;
            
            this.showModal(html);
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async showStatsGlobales() {
        try {
            const stats = await this.db.obtenirStatsGlobales();
            const agents = await this.db.listerAgents();
            
            let html = `
                <div class="modal-header">
                    <h3 class="modal-title">🌍 Statistiques Globales</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalAgents}</div>
                        <div class="stat-label">Total Agents</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalRadios || 0}</div>
                        <div class="stat-label">Radios</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalCongesActifs || 0}</div>
                        <div class="stat-label">Congés actifs</div>
                    </div>
                </div>
                
                <h4>Répartition par groupe</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Groupe</th>
                            <th>Nombre d'agents</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            const groupes = ['A', 'B', 'C', 'D', 'E'];
            groupes.forEach(groupe => {
                const count = agents.filter(a => a.groupe === groupe).length;
                html += `
                    <tr>
                        <td><span class="badge badge-groupe-${groupe}">${groupe}</span></td>
                        <td>${count}</td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Fermer
                    </button>
                </div>
            `;
            
            this.showModal(html);
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    // ========================================
    // PAGE RADIOS
    // ========================================
    async showRadiosPage() {
        const content = document.getElementById('radiosContent');
        
        content.innerHTML = `
            <div class="page-header">
                <h3>📻 GESTION DES RADIOS</h3>
                <p>Suivi des radios attribuées aux agents</p>
            </div>
            
            <div class="page-actions">
                <button class="btn btn-success" onclick="sgaApp.showAjouterRadioForm()">
                    ➕ Ajouter Radio
                </button>
                <button class="btn btn-info" onclick="sgaApp.showAttribuerRadioForm()">
                    📱 Attribuer Radio
                </button>
            </div>
            
            <div class="stats-cards">
                <div class="stat-card">
                    <div class="stat-value" id="totalRadios">0</div>
                    <div class="stat-label">Total Radios</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="radiosAttribuees">0</div>
                    <div class="stat-label">Attribuées</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="radiosDisponibles">0</div>
                    <div class="stat-label">Disponibles</div>
                </div>
            </div>
            
            <div class="table-container">
                <table class="table" id="radiosTable">
                    <thead>
                        <tr>
                            <th>Numéro</th>
                            <th>Agent</th>
                            <th>Date Attribution</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="radiosTableBody">
                        <tr><td colspan="5" class="loading">Chargement...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        
        await this.loadRadiosList();
        await this.updateRadiosStats();
    }

    async loadRadiosList() {
        const tbody = document.getElementById('radiosTableBody');
        
        try {
            const radios = await this.db.obtenirRadiosAttribuees();
            
            if (radios.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty">
                            <p>Aucune radio attribuée</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = await Promise.all(radios.map(async (radio) => {
                let agentInfo = 'Non attribuée';
                if (radio.agent_code) {
                    const agent = await this.db.obtenirAgent(radio.agent_code);
                    if (agent) {
                        agentInfo = `${agent.nom} ${agent.prenom}`;
                    }
                }
                
                return `
                    <tr>
                        <td><strong>${radio.numero}</strong></td>
                        <td>${agentInfo}</td>
                        <td>${radio.date_attribution || '-'}</td>
                        <td>
                            <span class="badge ${radio.statut === 'attribuee' ? 'badge-shift-1' : 
                                              radio.statut === 'disponible' ? 'badge-shift-2' :
                                              'badge-shift-A'}">
                                ${radio.statut === 'attribuee' ? 'Attribuée' : 
                                  radio.statut === 'disponible' ? 'Disponible' : 'En panne'}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                ${radio.statut === 'attribuee' ? `
                                    <button class="btn-icon" onclick="sgaApp.showRetourRadioForm('${radio.numero}', '${radio.agent_code}')" 
                                            title="Retour radio">
                                        ↩️
                                    </button>
                                ` : radio.statut === 'disponible' ? `
                                    <button class="btn-icon" onclick="sgaApp.showAttribuerRadioForm('${radio.numero}')" 
                                            title="Attribuer">
                                        📱
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }));
            
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="error">
                        Erreur: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    async updateRadiosStats() {
        try {
            const stats = await this.db.obtenirStatsRadios();
            
            const totalRadios = document.getElementById('totalRadios');
            const radiosAttribuees = document.getElementById('radiosAttribuees');
            const radiosDisponibles = document.getElementById('radiosDisponibles');
            
            if (totalRadios) totalRadios.textContent = stats.total || 0;
            if (radiosAttribuees) radiosAttribuees.textContent = stats.attribuees || 0;
            if (radiosDisponibles) radiosDisponibles.textContent = stats.disponibles || 0;
        } catch (error) {
            console.error('Erreur stats radios:', error);
        }
    }

    showAjouterRadioForm() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">➕ Ajouter Radio</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form id="formAjouterRadio" onsubmit="return sgaApp.validerAjoutRadio(event)">
                <div class="form-group">
                    <label class="form-label">Numéro Radio*</label>
                    <input type="text" class="form-input" name="numero" 
                           placeholder="Ex: RADIO-001" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Modèle</label>
                    <input type="text" class="form-input" name="modele" 
                           placeholder="Ex: Standard" value="Standard">
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-success">Ajouter</button>
                    <button type="button" class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Annuler
                    </button>
                </div>
            </form>
        `);
    }

    async validerAjoutRadio(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const numero = formData.get('numero').toUpperCase();
        const modele = formData.get('modele') || 'Standard';
        
        try {
            await this.db.ajouterRadio(numero, modele);
            this.closeModal();
            this.showToast(`Radio ${numero} ajoutée`, 'success');
            await this.loadRadiosList();
            await this.updateRadiosStats();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    showAttribuerRadioForm(numeroRadio = '') {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">📱 Attribuer Radio</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form id="formAttribuerRadio" onsubmit="return sgaApp.validerAttributionRadio(event)">
                <div class="form-group">
                    <label class="form-label">Numéro Radio</label>
                    <input type="text" class="form-input" name="numero" 
                           value="${numeroRadio}" placeholder="Ex: RADIO-001" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Code Agent*</label>
                    <input type="text" class="form-input" name="code_agent" 
                           placeholder="Ex: CPA, CONA" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date d'attribution</label>
                    <input type="date" class="form-input" name="date_attribution" 
                           value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-success">Attribuer</button>
                    <button type="button" class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Annuler
                    </button>
                </div>
            </form>
        `);
    }

    async validerAttributionRadio(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const numero = formData.get('numero');
        const code_agent = formData.get('code_agent').toUpperCase();
        const date_attribution = formData.get('date_attribution');
        
        try {
            // Vérifier si l'agent existe
            const agent = await this.db.obtenirAgent(code_agent);
            if (!agent) {
                throw new Error('Agent non trouvé');
            }
            
            // Attribuer la radio
            await this.db.attribuerRadio(numero, code_agent, date_attribution);
            
            this.closeModal();
            this.showToast(`Radio ${numero} attribuée à ${code_agent}`, 'success');
            await this.loadRadiosList();
            await this.updateRadiosStats();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    showRetourRadioForm(numeroRadio = '', codeAgent = '') {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">↩️ Retour Radio</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form id="formRetourRadio" onsubmit="return sgaApp.validerRetourRadio(event)">
                <div class="form-group">
                    <label class="form-label">Numéro Radio</label>
                    <input type="text" class="form-input" name="numero" 
                           value="${numeroRadio}" placeholder="Ex: RADIO-001" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Code Agent</label>
                    <input type="text" class="form-input" name="code_agent" 
                           value="${codeAgent}" placeholder="Ex: CPA, CONA" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Statut au retour</label>
                    <select class="form-select" name="statut" required>
                        <option value="disponible">Disponible</option>
                        <option value="en_panne">En panne</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Remarques</label>
                    <textarea class="form-input" name="remarques" rows="3" 
                              placeholder="État de la radio, problèmes..."></textarea>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-success">Enregistrer retour</button>
                    <button type="button" class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Annuler
                    </button>
                </div>
            </form>
        `);
    }

    async validerRetourRadio(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const numero = formData.get('numero');
        const code_agent = formData.get('code_agent').toUpperCase();
        const statut = formData.get('statut');
        const remarques = formData.get('remarques');
        
        try {
            // Enregistrer le retour
            await this.db.retournerRadio(numero, statut, remarques);
            
            this.closeModal();
            this.showToast(`Radio ${numero} retournée`, 'success');
            await this.loadRadiosList();
            await this.updateRadiosStats();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    // ========================================
    // PAGE CODES PANIQUE
    // ========================================
    async showPaniquePage() {
        const content = document.getElementById('paniqueContent');
        
        content.innerHTML = `
            <div class="page-header">
                <h3>🚨 CODES PANIQUE</h3>
                <p>Gestion des codes de sécurité</p>
            </div>
            
            <div class="page-actions">
                <button class="btn btn-success" onclick="sgaApp.genererCodesPanique()">
                    🎯 Générer Codes
                </button>
                <button class="btn btn-warning" onclick="sgaApp.reinitialiserCodesPanique()">
                    🔄 Réinitialiser
                </button>
            </div>
            
            <div class="codes-grid" id="codesPaniqueGrid">
                <!-- Les codes seront chargés ici -->
            </div>
            
            <div class="instructions">
                <h4>Instructions:</h4>
                <p>• Cliquez sur un code pour le copier</p>
                <p>• Nouvelle série générée automatiquement chaque mois</p>
            </div>
        `;
        
        await this.loadCodesPanique();
    }

    async loadCodesPanique() {
        const grid = document.getElementById('codesPaniqueGrid');
        
        try {
            const codes = await this.db.obtenirCodesPanique();
            
            if (codes.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <p>Aucun code panique configuré</p>
                        <button class="btn" onclick="sgaApp.genererCodesPanique()">
                            Générer des codes
                        </button>
                    </div>
                `;
                return;
            }
            
            grid.innerHTML = codes.slice(0, 20).map(code => {
                let className = 'code-panique';
                let statusText = '';
                
                if (code.statut === 'utilise') {
                    className += ' utilise';
                    statusText = 'Utilisé';
                } else if (code.date_expiration && new Date(code.date_expiration) < new Date()) {
                    className += ' expire';
                    statusText = 'Expiré';
                } else if (code.statut === 'actif') {
                    className += ' actif';
                    statusText = 'Actif';
                }
                
                return `
                    <div class="${className}" onclick="sgaApp.copierCodePanique('${code.code}')">
                        <div class="code-number">${code.numero}</div>
                        <div class="code-value">${code.code}</div>
                        <div class="code-info">
                            <span>${statusText}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            grid.innerHTML = `
                <div class="error-state">
                    <p>Erreur: ${error.message}</p>
                </div>
            `;
        }
    }

    async genererCodesPanique() {
        try {
            if (confirm('Générer une nouvelle série de codes panique ?')) {
                await this.db.genererCodesPanique();
                this.showToast('Codes panique générés', 'success');
                await this.loadCodesPanique();
            }
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async reinitialiserCodesPanique() {
        if (confirm('Réinitialiser tous les codes panique ?')) {
            try {
                await this.db.reinitialiserCodesPanique();
                this.showToast('Codes panique réinitialisés', 'success');
                await this.loadCodesPanique();
            } catch (error) {
                this.showToast(`Erreur: ${error.message}`, 'error');
            }
        }
    }

    async copierCodePanique(code) {
        try {
            await navigator.clipboard.writeText(code);
            this.showToast('Code copié dans le presse-papier', 'info');
        } catch (error) {
            this.showToast('Impossible de copier le code', 'error');
        }
    }

    // ========================================
    // PAGE HABILLEMENT
    // ========================================
    async showHabillementPage() {
        const content = document.getElementById('habillementContent');
        
        content.innerHTML = `
            <div class="page-header">
                <h3>👕 HABILLEMENT</h3>
                <p>Gestion des uniformes et tailles</p>
            </div>
            
            <div class="page-actions">
                <button class="btn btn-success" onclick="sgaApp.showAjouterHabillementForm()">
                    ➕ Nouvelle Commande
                </button>
            </div>
            
            <div class="table-container">
                <table class="table" id="habillementTable">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Type</th>
                            <th>Taille</th>
                            <th>Date Commande</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody id="habillementTableBody">
                        <tr><td colspan="5" class="loading">Chargement...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        
        await this.loadHabillementList();
    }

    async loadHabillementList() {
        const tbody = document.getElementById('habillementTableBody');
        
        try {
            const commandes = await this.db.obtenirCommandesHabillement();
            
            if (commandes.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty">
                            <p>Aucune commande d'habillement</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = commandes.map(commande => `
                <tr>
                    <td>
                        <strong>${commande.agent_code}</strong><br>
                        <small>${commande.agent_nom || ''}</small>
                    </td>
                    <td>${commande.type_uniforme}</td>
                    <td>${commande.taille}</td>
                    <td>${commande.date_commande || '-'}</td>
                    <td>
                        <span class="badge ${commande.statut === 'livre' ? 'badge-shift-1' : 
                                          commande.statut === 'en_cours' ? 'badge-shift-2' : 
                                          'badge-shift-A'}">
                            ${commande.statut === 'livre' ? 'Livré' : 
                              commande.statut === 'en_cours' ? 'En cours' : 'Commandé'}
                        </span>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="error">
                        Erreur: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    showAjouterHabillementForm() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">👕 Nouvelle Commande Habillement</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form id="formAjoutHabillement" onsubmit="return sgaApp.validerAjoutHabillement(event)">
                <div class="form-group">
                    <label class="form-label">Code Agent</label>
                    <input type="text" class="form-input" name="code_agent" 
                           placeholder="Ex: CPA, CONA" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Type d'uniforme</label>
                    <select class="form-select" name="type_uniforme" required>
                        <option value="">Sélectionner...</option>
                        <option value="tenue_complete">Tenue complète</option>
                        <option value="chemise">Chemise</option>
                        <option value="pantalon">Pantalon</option>
                        <option value="veste">Veste</option>
                        <option value="chaussures">Chaussures</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Taille</label>
                    <input type="text" class="form-input" name="taille" 
                           placeholder="Ex: M, 42, XL" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Quantité</label>
                    <input type="number" class="form-input" name="quantite" 
                           value="1" min="1" max="10">
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-success">Enregistrer</button>
                    <button type="button" class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Annuler
                    </button>
                </div>
            </form>
        `);
    }

    async validerAjoutHabillement(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const commande = {
            code_agent: formData.get('code_agent').toUpperCase(),
            type_uniforme: formData.get('type_uniforme'),
            taille: formData.get('taille'),
            quantite: parseInt(formData.get('quantite'))
        };
        
        try {
            // Vérifier si l'agent existe
            const agent = await this.db.obtenirAgent(commande.code_agent);
            if (!agent) {
                throw new Error('Agent non trouvé');
            }
            
            // Ajouter la commande
            await this.db.ajouterCommandeHabillement(commande);
            
            this.closeModal();
            this.showToast('Commande enregistrée', 'success');
            await this.loadHabillementList();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    // ========================================
    // PAGE AVERTISSEMENTS
    // ========================================
    async showAvertissementsPage() {
        const content = document.getElementById('avertissementsContent');
        
        content.innerHTML = `
            <div class="page-header">
                <h3>⚠️ AVERTISSEMENTS</h3>
                <p>Suivi disciplinaire des agents</p>
            </div>
            
            <div class="page-actions">
                <button class="btn btn-warning" onclick="sgaApp.showAjouterAvertissementForm()">
                    ⚠️ Nouvel Avertissement
                </button>
            </div>
            
            <div class="table-container">
                <table class="table" id="avertissementsTable">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Agent</th>
                            <th>Type</th>
                            <th>Motif</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody id="avertissementsTableBody">
                        <tr><td colspan="5" class="loading">Chargement...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        
        await this.loadAvertissementsList();
    }

    async loadAvertissementsList() {
        const tbody = document.getElementById('avertissementsTableBody');
        
        try {
            const avertissements = await this.db.obtenirAvertissements();
            
            if (avertissements.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty">
                            <p>Aucun avertissement enregistré</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = avertissements.map(avert => {
                let typeClass = '';
                let sanctionClass = '';
                
                switch (avert.type) {
                    case 'verbal': typeClass = 'type-verbal'; break;
                    case 'ecrit': typeClass = 'type-ecrit'; break;
                    case 'suspension': typeClass = 'type-suspension'; break;
                    case 'licenciement': typeClass = 'type-licenciement'; break;
                }
                
                switch (avert.statut) {
                    case 'actif': sanctionClass = 'statut-actif'; break;
                    case 'resolu': sanctionClass = 'statut-resolu'; break;
                    case 'archive': sanctionClass = 'statut-archive'; break;
                }
                
                return `
                    <tr>
                        <td>${avert.date}</td>
                        <td>
                            <strong>${avert.agent_code}</strong><br>
                            <small>${avert.agent_nom || ''}</small>
                        </td>
                        <td><span class="badge ${typeClass}">${avert.type}</span></td>
                        <td>${avert.motif}</td>
                        <td><span class="badge ${sanctionClass}">${avert.statut}</span></td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="error">
                        Erreur: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    showAjouterAvertissementForm() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">⚠️ Nouvel Avertissement</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form id="formAjoutAvertissement" onsubmit="return sgaApp.validerAjoutAvertissement(event)">
                <div class="form-group">
                    <label class="form-label">Code Agent</label>
                    <input type="text" class="form-input" name="code_agent" 
                           placeholder="Ex: CPA, CONA" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select class="form-select" name="type" required>
                        <option value="">Sélectionner...</option>
                        <option value="verbal">Avertissement verbal</option>
                        <option value="ecrit">Avertissement écrit</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" name="date" 
                           value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Motif*</label>
                    <textarea class="form-input" name="motif" rows="3" required
                              placeholder="Décrivez le motif de l'avertissement..."></textarea>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-warning">Enregistrer</button>
                    <button type="button" class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Annuler
                    </button>
                </div>
            </form>
        `);
    }

    async validerAjoutAvertissement(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const avertissement = {
            code_agent: formData.get('code_agent').toUpperCase(),
            type: formData.get('type'),
            date: formData.get('date'),
            motif: formData.get('motif')
        };
        
        try {
            // Vérifier si l'agent existe
            const agent = await this.db.obtenirAgent(avertissement.code_agent);
            if (!agent) {
                throw new Error('Agent non trouvé');
            }
            
            // Ajouter l'avertissement
            await this.db.ajouterAvertissement(avertissement);
            
            this.closeModal();
            this.showToast('Avertissement enregistré', 'warning');
            await this.loadAvertissementsList();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    // ========================================
    // PAGE CONGES
    // ========================================
    async showCongesPage() {
        const content = document.getElementById('congesContent');
        
        content.innerHTML = `
            <div class="page-header">
                <h3>🏖️ GESTION DES CONGÉS</h3>
                <p>Planning des congés et absences</p>
            </div>
            
            <div class="page-actions">
                <button class="btn btn-success" onclick="sgaApp.showDemanderCongeForm()">
                    🏖️ Demander Congé
                </button>
            </div>
            
            <div class="table-container">
                <table class="table" id="congesTable">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Type</th>
                            <th>Date début</th>
                            <th>Date fin</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody id="congesTableBody">
                        <tr><td colspan="5" class="loading">Chargement...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        
        await this.loadCongesList();
    }

    async loadCongesList() {
        const tbody = document.getElementById('congesTableBody');
        
        try {
            const conges = await this.db.obtenirCongesActifs();
            
            if (conges.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty">
                            <p>Aucun congé actif</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = await Promise.all(conges.map(async (conge) => {
                const agent = await this.db.obtenirAgent(conge.agent_code);
                const agentNom = agent ? `${agent.nom} ${agent.prenom}` : conge.agent_code;
                
                return `
                    <tr>
                        <td>
                            <strong>${conge.agent_code}</strong><br>
                            <small>${agentNom}</small>
                        </td>
                        <td>${conge.type}</td>
                        <td>${conge.date_debut}</td>
                        <td>${conge.date_fin}</td>
                        <td>
                            <span class="badge ${conge.statut === 'approuve' ? 'badge-shift-1' : 
                                              conge.statut === 'en_attente' ? 'badge-shift-2' : 
                                              'badge-shift-A'}">
                                ${conge.statut === 'approuve' ? 'Approuvé' : 
                                  conge.statut === 'en_attente' ? 'En attente' : 'Refusé'}
                            </span>
                        </td>
                    </tr>
                `;
            }));
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="error">
                        Erreur: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    showDemanderCongeForm() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">🏖️ Demander un Congé</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form id="formDemanderConge" onsubmit="return sgaApp.validerDemandeConge(event)">
                <div class="form-group">
                    <label class="form-label">Code Agent</label>
                    <input type="text" class="form-input" name="code_agent" 
                           placeholder="Ex: CPA, CONA" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Type de congé</label>
                    <select class="form-select" name="type" required>
                        <option value="">Sélectionner...</option>
                        <option value="annuel">Congé annuel</option>
                        <option value="exceptionnel">Congé exceptionnel</option>
                        <option value="maladie">Maladie</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Date début*</label>
                        <input type="date" class="form-input" name="date_debut" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date fin*</label>
                        <input type="date" class="form-input" name="date_fin" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Motif</label>
                    <textarea class="form-input" name="motif" rows="3" 
                              placeholder="Raison de la demande..."></textarea>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-success">Demander</button>
                    <button type="button" class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Annuler
                    </button>
                </div>
            </form>
        `);
    }

    async validerDemandeConge(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const conge = {
            code_agent: formData.get('code_agent').toUpperCase(),
            type: formData.get('type'),
            date_debut: formData.get('date_debut'),
            date_fin: formData.get('date_fin'),
            motif: formData.get('motif')
        };
        
        try {
            // Vérifier si l'agent existe
            const agent = await this.db.obtenirAgent(conge.code_agent);
            if (!agent) {
                throw new Error('Agent non trouvé');
            }
            
            // Vérifier les dates
            if (new Date(conge.date_debut) > new Date(conge.date_fin)) {
                throw new Error('La date de début doit être antérieure à la date de fin');
            }
            
            // Demander le congé
            await this.db.demanderConge(conge);
            
            this.closeModal();
            this.showToast('Demande de congé enregistrée', 'success');
            await this.loadCongesList();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    // ========================================
    // PAGE OUTILS
    // ========================================
    async showOutilsPage() {
        const content = document.getElementById('outilsContent');
        
        content.innerHTML = `
            <div class="page-header">
                <h3>🛠️ OUTILS</h3>
                <p>Fonctions avancées de gestion</p>
            </div>
            
            <div class="tools-grid">
                <div class="tool-card" onclick="sgaApp.exporterBackup()">
                    <div class="tool-icon">💾</div>
                    <h4>SAUVEGARDER</h4>
                    <p>Créer une sauvegarde complète</p>
                </div>
                
                <div class="tool-card" onclick="sgaApp.reparerBaseDonnees()">
                    <div class="tool-icon">🔧</div>
                    <h4>RÉPARER BASE</h4>
                    <p>Vérifier et réparer la base</p>
                </div>
                
                <div class="tool-card" onclick="sgaApp.viderCache()">
                    <div class="tool-icon">🧹</div>
                    <h4>VIDER CACHE</h4>
                    <p>Nettoyer le cache local</p>
                </div>
                
                <div class="tool-card" onclick="sgaApp.showJourFerieForm()">
                    <div class="tool-icon">🎯</div>
                    <h4>JOURS FÉRIÉS</h4>
                    <p>Gérer les jours fériés</p>
                </div>
                
                <div class="tool-card" onclick="sgaApp.showParametres()">
                    <div class="tool-icon">⚙️</div>
                    <h4>PARAMÈTRES</h4>
                    <p>Configurer l'application</p>
                </div>
            </div>
            
            <div class="info-card">
                <h4>Informations système</h4>
                <div class="info-grid" id="systemInfo">
                    <div class="info-item">
                        <span class="info-label">Version:</span>
                        <span class="info-value">1.0.0</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Dernière sync:</span>
                        <span class="info-value">${localStorage.getItem('sga-last-sync') || 'Jamais'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async exporterBackup() {
        try {
            const data = await this.db.exporterBackup();
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `sga-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            this.showToast('Sauvegarde exportée', 'success');
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async reparerBaseDonnees() {
        try {
            const result = await this.db.reparerBaseDonnees();
            this.showToast(`Base réparée: ${result.message}`, 'success');
            await this.updateBaseInfo();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async showJourFerieForm() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">🎯 Gérer les Jours Fériés</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <div class="modal-body">
                <form id="formJourFerie" onsubmit="return sgaApp.ajouterJourFerie(event)">
                    <div class="form-group">
                        <label class="form-label">Date</label>
                        <input type="date" class="form-input" name="date" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Nom</label>
                        <input type="text" class="form-input" name="nom" 
                               placeholder="Ex: Jour de l'an, Pâques..." required>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-success">Ajouter</button>
                    </div>
                </form>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Fermer
                </button>
            </div>
        `);
    }

    async ajouterJourFerie(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const ferie = {
            date: formData.get('date'),
            nom: formData.get('nom')
        };
        
        try {
            await this.db.ajouterJourFerie(ferie);
            event.target.reset();
            this.showToast('Jour férié ajouté', 'success');
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async viderCache() {
        if (confirm('Vider le cache local ?\n\nCette action supprimera toutes les données non synchronisées.')) {
            try {
                localStorage.clear();
                await this.db.reinitialiser();
                this.showToast('Cache vidé', 'success');
                setTimeout(() => location.reload(), 1000);
            } catch (error) {
                this.showToast(`Erreur: ${error.message}`, 'error');
            }
        }
    }

    showParametres() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">⚙️ Paramètres</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <div class="settings-list">
                <div class="setting-item">
                    <span>Mode sombre</span>
                    <label class="switch">
                        <input type="checkbox" ${this.theme === 'dark' ? 'checked' : ''} 
                               onchange="sgaApp.toggleTheme()">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <span>Version: 1.0.0</span>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-warning" onclick="sgaApp.reinitialiserApplication()">
                    🔄 Réinitialiser
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Fermer
                </button>
            </div>
        `);
    }

    async reinitialiserApplication() {
        if (confirm('⚠️ RÉINITIALISER L\'APPLICATION ?\n\nToutes les données locales seront effacées.\nCette action est irréversible.')) {
            try {
                await this.db.reinitialiser();
                localStorage.clear();
                this.showToast('Application réinitialisée', 'warning');
                setTimeout(() => location.reload(), 2000);
            } catch (error) {
                this.showToast(`Erreur: ${error.message}`, 'error');
            }
        }
    }

    // ========================================
    // MENU JOURS FERIES
    // ========================================
    showFeriesMenu() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">🎯 Jours Fériés</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <div class="modal-body">
                <div class="menu-grid">
                    <div class="menu-card" onclick="sgaApp.showJourFerieForm()">
                        <h3><span>➕</span> AJOUTER</h3>
                        <p>Ajouter un jour férié</p>
                    </div>
                    
                    <div class="menu-card" onclick="sgaApp.listerJoursFeries()">
                        <h3><span>📋</span> LISTER</h3>
                        <p>Voir tous les jours fériés</p>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Fermer
                </button>
            </div>
        `);
    }

    async listerJoursFeries() {
        try {
            const feries = await this.db.obtenirJoursFeries();
            
            let html = `
                <div class="modal-header">
                    <h3 class="modal-title">📋 Jours Fériés</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Nom</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            feries.forEach(ferie => {
                html += `
                    <tr>
                        <td>${ferie.date}</td>
                        <td>${ferie.nom}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Fermer
                    </button>
                </div>
            `;
            
            this.showModal(html);
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }
}

// Initialiser l'application
let sgaApp;
document.addEventListener('DOMContentLoaded', () => {
    sgaApp = new SGA_App();
    window.sgaApp = sgaApp;
    sgaApp.initialize();
});