// Application SGA PWA - Version complète corrigée
class SGA_App {
    constructor() {
        this.db = new DatabaseManager();
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
        const icon = document.getElementById('themeBtn');
        if (icon) {
            icon.textContent = this.theme === 'light' ? '🌙' : '☀️';
        }
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
        
        // Initialiser le bouton thème
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) {
            themeBtn.textContent = this.theme === 'light' ? '🌙' : '☀️';
        }
    }

    async loadInitialData() {
        try {
            const agents = await this.db.listerAgents();
            if (agents.length === 0) {
                console.log('📥 Base vide - prête pour ajout manuel');
                // Ajouter quelques agents par défaut pour démo
                const defaultAgents = [
                    { code: 'CPA', nom: 'Agent', prenom: 'Principal', groupe: 'A', date_entree: '2024-01-01' },
                    { code: 'CONA', nom: 'Contrôle', prenom: 'Agent', groupe: 'B', date_entree: '2024-01-01' },
                    { code: 'ZA', nom: 'Zone', prenom: 'Agent', groupe: 'C', date_entree: '2024-01-01' }
                ];
                
                for (const agent of defaultAgents) {
                    try {
                        await this.db.ajouterAgent(agent);
                    } catch (e) {
                        // Ignorer les erreurs si les agents existent déjà
                    }
                }
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
        
        // Sauvegarder la page actuelle
        localStorage.setItem('sga-current-page', page);
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
        document.body.style.overflow = 'hidden';
        
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
        document.body.style.overflow = 'auto';
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
        
        this.showToast(`Mode ${this.theme === 'light' ? 'clair' : 'sombre'} activé`, 'info');
    }

    async syncData() {
        this.showToast('Synchronisation en cours...', 'info');
        
        try {
            // Simuler une synchronisation
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
        if (!content) return;
        
        content.innerHTML = `
            <div class="page-actions">
                <button class="btn btn-success" onclick="sgaApp.showAjouterAgentForm()">
                    ➕ Ajouter Agent
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.exporterAgentsExcel()">
                    📤 Exporter Excel
                </button>
                <button class="btn btn-info" onclick="sgaApp.importerAgentsExcel()">
                    📥 Importer Excel
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
        
        if (!tbody) return;
        
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
                    <td><span class="badge ${agent.statut === 'actif' ? 'badge-success' : 'badge-secondary'}">
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
            date_entree: formData.get('date_entree'),
            statut: 'actif'
        };
        
        try {
            // Vérifier si l'agent existe déjà
            const existing = await this.db.obtenirAgent(agent.code);
            if (existing) {
                throw new Error(`L'agent ${agent.code} existe déjà`);
            }
            
            await this.db.ajouterAgent(agent);
            this.closeModal();
            this.showToast(`Agent ${agent.code} ajouté avec succès`, 'success');
            await this.loadAgentsList();
            this.updateBaseInfo();
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

    async voirPlanningAgent(code, mois = null, annee = null) {
        try {
            const agent = await this.db.obtenirAgent(code);
            if (!mois) mois = new Date().getMonth() + 1;
            if (!annee) annee = new Date().getFullYear();
            
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
                                <td><span class="badge badge-shift-1">${stats.shift1 || 0}</span></td>
                            </tr>
                            <tr>
                                <td>Shifts Après-midi (2)</td>
                                <td><span class="badge badge-shift-2">${stats.shift2 || 0}</span></td>
                            </tr>
                            <tr>
                                <td>Shifts Nuit (3)</td>
                                <td><span class="badge badge-shift-3">${stats.shift3 || 0}</span></td>
                            </tr>
                            <tr>
                                <td>Jours Repos (R)</td>
                                <td><span class="badge badge-shift-R">${stats.repos || 0}</span></td>
                            </tr>
                            <tr>
                                <td>Congés (C)</td>
                                <td><span class="badge badge-shift-C">${stats.conges || 0}</span></td>
                            </tr>
                            <tr>
                                <td>Maladie (M)</td>
                                <td><span class="badge badge-shift-M">${stats.maladie || 0}</span></td>
                            </tr>
                            <tr>
                                <td>Autre Absence (A)</td>
                                <td><span class="badge badge-shift-A">${stats.absence || 0}</span></td>
                            </tr>
                            <tr>
                                <td>Fériés travaillés</td>
                                <td>${stats.feriesTravailles || 0}</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>TOTAL SHIFTS OPÉRATIONNELS</strong></td>
                                <td><strong class="total-value">${stats.totalOperationnels || 0}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="stats-summary">
                    <p><strong>Total jours: ${stats.totalJours || 0}</strong></p>
                    <p>Jours travaillés: ${stats.joursTravailles || 0}</p>
                    <p>Taux de présence: ${stats.tauxPresence ? stats.tauxPresence.toFixed(1) : 0}%</p>
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

    async importerAgentsExcel() {
        // Fonction simplifiée pour l'import
        this.showToast('Fonction d\'import à implémenter', 'info');
    }

    // ========================================
    // PAGE PLANNING
    // ========================================
    async showPlanningPage() {
        const content = document.getElementById('planningContent');
        if (!content) return;
        
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
                
                <div class="table-container planning-table-container">
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
                
                <div class="table-container planning-table-container">
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
        
        if (confirm(`Générer le planning théorique pour ${mois}/${annee} ?`)) {
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
        if (!content) return;
        
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
                
                totalShifts1 += stats.shift1 || 0;
                totalShifts2 += stats.shift2 || 0;
                totalShifts3 += stats.shift3 || 0;
                totalOperationnels += stats.totalOperationnels || 0;
                
                agentsStats.push({
                    code: agent.code,
                    nom: `${agent.nom} ${agent.prenom}`,
                    shifts1: stats.shift1 || 0,
                    shifts2: stats.shift2 || 0,
                    shifts3: stats.shift3 || 0,
                    total: stats.totalOperationnels || 0
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
            
            // Calculer la répartition par groupe
            const groupes = ['A', 'B', 'C', 'D', 'E'];
            const repartition = {};
            groupes.forEach(g => {
                repartition[g] = agents.filter(a => a.groupe === g).length;
            });
            
            let html = `
                <div class="modal-header">
                    <h3 class="modal-title">🌍 Statistiques Globales</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalAgents || 0}</div>
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
                    <div class="stat-card">
                        <div class="stat-value">${stats.agentsActifs || 0}</div>
                        <div class="stat-label">Agents actifs</div>
                    </div>
                </div>
                
                <h4>Répartition par groupe</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Groupe</th>
                            <th>Nombre d'agents</th>
                            <th>Pourcentage</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            const totalAgents = agents.length;
            groupes.forEach(groupe => {
                const count = repartition[groupe];
                const pourcentage = totalAgents > 0 ? ((count / totalAgents) * 100).toFixed(1) : 0;
                
                html += `
                    <tr>
                        <td><span class="badge badge-groupe-${groupe}">${groupe}</span></td>
                        <td>${count}</td>
                        <td>${pourcentage}%</td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
                
                <div class="stats-summary">
                    <p><strong>Dernière mise à jour:</strong> ${new Date().toLocaleString()}</p>
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

    // ========================================
    // PAGE RADIOS
    // ========================================
    async showRadiosPage() {
        const content = document.getElementById('radiosContent');
        if (!content) return;
        
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
        if (!tbody) return;
        
        try {
            const radios = await this.db.obtenirRadios();
            
            if (radios.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty">
                            <p>Aucune radio enregistrée</p>
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
                
                const statutBadge = radio.statut === 'attribuee' ? 'badge-success' :
                                  radio.statut === 'disponible' ? 'badge-info' :
                                  'badge-warning';
                
                const statutText = radio.statut === 'attribuee' ? 'Attribuée' :
                                 radio.statut === 'disponible' ? 'Disponible' :
                                 'En panne';
                
                return `
                    <tr>
                        <td><strong>${radio.numero}</strong></td>
                        <td>${agentInfo}</td>
                        <td>${radio.date_attribution || '-'}</td>
                        <td>
                            <span class="badge ${statutBadge}">
                                ${statutText}
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
                                <button class="btn-icon" onclick="sgaApp.supprimerRadio('${radio.numero}')" 
                                        title="Supprimer">
                                    🗑️
                                </button>
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
            const radios = await this.db.obtenirRadios();
            
            const total = radios.length;
            const attribuees = radios.filter(r => r.statut === 'attribuee').length;
            const disponibles = radios.filter(r => r.statut === 'disponible').length;
            
            const totalRadios = document.getElementById('totalRadios');
            const radiosAttribuees = document.getElementById('radiosAttribuees');
            const radiosDisponibles = document.getElementById('radiosDisponibles');
            
            if (totalRadios) totalRadios.textContent = total;
            if (radiosAttribuees) radiosAttribuees.textContent = attribuees;
            if (radiosDisponibles) radiosDisponibles.textContent = disponibles;
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
            // Vérifier si la radio existe déjà
            const existingRadios = await this.db.obtenirRadios();
            if (existingRadios.some(r => r.numero === numero)) {
                throw new Error(`La radio ${numero} existe déjà`);
            }
            
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
            // Vérifier si la radio est bien attribuée à cet agent
            const radios = await this.db.obtenirRadios();
            const radio = radios.find(r => r.numero === numero && r.agent_code === code_agent);
            
            if (!radio) {
                throw new Error('Cette radio n\'est pas attribuée à cet agent');
            }
            
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

    async supprimerRadio(numero) {
        if (confirm(`Supprimer la radio ${numero} ?`)) {
            try {
                await this.db.supprimerRadio(numero);
                this.showToast(`Radio ${numero} supprimée`, 'warning');
                await this.loadRadiosList();
                await this.updateRadiosStats();
            } catch (error) {
                this.showToast(`Erreur: ${error.message}`, 'error');
            }
        }
    }

    // ========================================
    // PAGE CODES PANIQUE
    // ========================================
    async showPaniquePage() {
        const content = document.getElementById('paniqueContent');
        if (!content) return;
        
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
                <p>• Codes valides 30 jours</p>
            </div>
        `;
        
        await this.loadCodesPanique();
    }

    async loadCodesPanique() {
        const grid = document.getElementById('codesPaniqueGrid');
        if (!grid) return;
        
        try {
            // Générer des codes de démonstration si aucun n'existe
            let codes = [];
            
            try {
                codes = await this.db.obtenirCodesPanique();
            } catch (e) {
                // Si la table n'existe pas, on génère des codes de démo
                codes = this.genererCodesPaniqueDemo();
            }
            
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
            
            grid.innerHTML = codes.slice(0, 20).map((code, index) => {
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
                        <div class="code-number">${index + 1}</div>
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

    genererCodesPaniqueDemo() {
        // Générer 20 codes de démonstration
        const codes = [];
        for (let i = 1; i <= 20; i++) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const statut = Math.random() > 0.7 ? 'utilise' : 'actif';
            const dateExpiration = new Date();
            dateExpiration.setDate(dateExpiration.getDate() + 30);
            
            codes.push({
                id: i,
                code: code,
                numero: i,
                statut: statut,
                date_creation: new Date().toISOString().split('T')[0],
                date_expiration: dateExpiration.toISOString().split('T')[0],
                date_utilisation: statut === 'utilise' ? new Date().toISOString().split('T')[0] : null
            });
        }
        return codes;
    }

    async genererCodesPanique() {
        try {
            if (confirm('Générer une nouvelle série de codes panique ?\n\nLes codes existants seront archivés.')) {
                // Générer 20 nouveaux codes
                const nouveauxCodes = [];
                for (let i = 1; i <= 20; i++) {
                    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const dateExpiration = new Date();
                    dateExpiration.setDate(dateExpiration.getDate() + 30);
                    
                    nouveauxCodes.push({
                        code: code,
                        numero: i,
                        statut: 'actif',
                        date_creation: new Date().toISOString().split('T')[0],
                        date_expiration: dateExpiration.toISOString().split('T')[0]
                    });
                }
                
                // Sauvegarder dans localStorage pour la démo
                localStorage.setItem('sga-codes-panique', JSON.stringify(nouveauxCodes));
                
                this.showToast('Codes panique générés', 'success');
                await this.loadCodesPanique();
            }
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async reinitialiserCodesPanique() {
        if (confirm('Réinitialiser tous les codes panique ?\n\nCette action supprimera tous les codes existants.')) {
            try {
                localStorage.removeItem('sga-codes-panique');
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
            // Fallback pour les navigateurs qui ne supportent pas clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Code copié dans le presse-papier', 'info');
        }
    }

    // ========================================
    // PAGE HABILLEMENT
    // ========================================
    async showHabillementPage() {
        const content = document.getElementById('habillementContent');
        if (!content) return;
        
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="habillementTableBody">
                        <tr><td colspan="6" class="loading">Chargement...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        
        await this.loadHabillementList();
    }

    async loadHabillementList() {
        const tbody = document.getElementById('habillementTableBody');
        if (!tbody) return;
        
        try {
            // Pour la démo, créer quelques commandes
            let commandes = [];
            
            try {
                commandes = await this.db.obtenirCommandesHabillement();
            } catch (e) {
                // Créer des données de démo
                const agents = await this.db.listerAgents();
                commandes = agents.slice(0, 3).map((agent, index) => ({
                    id: index + 1,
                    agent_code: agent.code,
                    agent_nom: `${agent.nom} ${agent.prenom}`,
                    type_uniforme: ['tenue_complete', 'chemise', 'pantalon'][index],
                    taille: ['M', 'L', 'XL'][index],
                    quantite: 1,
                    date_commande: new Date().toISOString().split('T')[0],
                    statut: ['livre', 'en_cours', 'commande'][index]
                }));
            }
            
            if (commandes.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty">
                            <p>Aucune commande d'habillement</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = commandes.map(commande => {
                const statutBadge = commande.statut === 'livre' ? 'badge-success' :
                                  commande.statut === 'en_cours' ? 'badge-info' :
                                  'badge-warning';
                
                const statutText = commande.statut === 'livre' ? 'Livré' :
                                 commande.statut === 'en_cours' ? 'En cours' :
                                 'Commandé';
                
                return `
                    <tr>
                        <td>
                            <strong>${commande.agent_code}</strong><br>
                            <small>${commande.agent_nom || ''}</small>
                        </td>
                        <td>${commande.type_uniforme}</td>
                        <td>${commande.taille}</td>
                        <td>${commande.date_commande || '-'}</td>
                        <td>
                            <span class="badge ${statutBadge}">${statutText}</span>
                        </td>
                        <td>
                            <button class="btn-icon" onclick="sgaApp.modifierStatutHabillement(${commande.id})" 
                                    title="Modifier statut">
                                ✏️
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="error">
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
            
            // Pour la démo, sauvegarder dans localStorage
            const commandesExistantes = JSON.parse(localStorage.getItem('sga-habillement') || '[]');
            commandesExistantes.push({
                ...commande,
                id: commandesExistantes.length + 1,
                agent_nom: `${agent.nom} ${agent.prenom}`,
                date_commande: new Date().toISOString().split('T')[0],
                statut: 'commande'
            });
            
            localStorage.setItem('sga-habillement', JSON.stringify(commandesExistantes));
            
            this.closeModal();
            this.showToast('Commande enregistrée', 'success');
            await this.loadHabillementList();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async modifierStatutHabillement(id) {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">✏️ Modifier Statut Commande</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form onsubmit="event.preventDefault(); sgaApp.validerModifStatutHabillement(${id})">
                <div class="form-group">
                    <label class="form-label">Nouveau statut</label>
                    <select class="form-select" id="nouveauStatutHabillement">
                        <option value="commande">Commandé</option>
                        <option value="en_cours">En cours</option>
                        <option value="livre">Livré</option>
                    </select>
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

    async validerModifStatutHabillement(id) {
        const nouveauStatut = document.getElementById('nouveauStatutHabillement').value;
        
        try {
            // Pour la démo, mettre à jour dans localStorage
            const commandes = JSON.parse(localStorage.getItem('sga-habillement') || '[]');
            const commandeIndex = commandes.findIndex(c => c.id === id);
            
            if (commandeIndex !== -1) {
                commandes[commandeIndex].statut = nouveauStatut;
                localStorage.setItem('sga-habillement', JSON.stringify(commandes));
            }
            
            this.closeModal();
            this.showToast('Statut mis à jour', 'success');
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
        if (!content) return;
        
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="avertissementsTableBody">
                        <tr><td colspan="6" class="loading">Chargement...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        
        await this.loadAvertissementsList();
    }

    async loadAvertissementsList() {
        const tbody = document.getElementById('avertissementsTableBody');
        if (!tbody) return;
        
        try {
            // Pour la démo, créer quelques avertissements
            let avertissements = [];
            
            try {
                avertissements = await this.db.obtenirAvertissements();
            } catch (e) {
                // Créer des données de démo
                const agents = await this.db.listerAgents();
                avertissements = agents.slice(0, 2).map((agent, index) => ({
                    id: index + 1,
                    agent_code: agent.code,
                    agent_nom: `${agent.nom} ${agent.prenom}`,
                    type: ['verbal', 'ecrit'][index],
                    date: new Date().toISOString().split('T')[0],
                    motif: ['Retard répété', 'Non-respect des consignes'][index],
                    statut: ['actif', 'resolu'][index]
                }));
            }
            
            if (avertissements.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty">
                            <p>Aucun avertissement enregistré</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = avertissements.map(avert => {
                let typeClass = '';
                let typeText = '';
                
                switch (avert.type) {
                    case 'verbal':
                        typeClass = 'badge-warning';
                        typeText = 'Verbal';
                        break;
                    case 'ecrit':
                        typeClass = 'badge-danger';
                        typeText = 'Écrit';
                        break;
                    case 'suspension':
                        typeClass = 'badge-danger';
                        typeText = 'Suspension';
                        break;
                    default:
                        typeClass = 'badge-secondary';
                        typeText = avert.type;
                }
                
                let statutClass = '';
                let statutText = '';
                
                switch (avert.statut) {
                    case 'actif':
                        statutClass = 'badge-warning';
                        statutText = 'Actif';
                        break;
                    case 'resolu':
                        statutClass = 'badge-success';
                        statutText = 'Résolu';
                        break;
                    case 'archive':
                        statutClass = 'badge-secondary';
                        statutText = 'Archivé';
                        break;
                    default:
                        statutClass = 'badge-secondary';
                        statutText = avert.statut;
                }
                
                return `
                    <tr>
                        <td>${avert.date}</td>
                        <td>
                            <strong>${avert.agent_code}</strong><br>
                            <small>${avert.agent_nom || ''}</small>
                        </td>
                        <td><span class="badge ${typeClass}">${typeText}</span></td>
                        <td>${avert.motif}</td>
                        <td><span class="badge ${statutClass}">${statutText}</span></td>
                        <td>
                            <button class="btn-icon" onclick="sgaApp.modifierStatutAvertissement(${avert.id})" 
                                    title="Modifier statut">
                                ✏️
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="error">
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
            
            // Pour la démo, sauvegarder dans localStorage
            const avertissementsExistants = JSON.parse(localStorage.getItem('sga-avertissements') || '[]');
            avertissementsExistants.push({
                ...avertissement,
                id: avertissementsExistants.length + 1,
                agent_nom: `${agent.nom} ${agent.prenom}`,
                statut: 'actif'
            });
            
            localStorage.setItem('sga-avertissements', JSON.stringify(avertissementsExistants));
            
            this.closeModal();
            this.showToast('Avertissement enregistré', 'warning');
            await this.loadAvertissementsList();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async modifierStatutAvertissement(id) {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">✏️ Modifier Statut Avertissement</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form onsubmit="event.preventDefault(); sgaApp.validerModifStatutAvertissement(${id})">
                <div class="form-group">
                    <label class="form-label">Nouveau statut</label>
                    <select class="form-select" id="nouveauStatutAvertissement">
                        <option value="actif">Actif</option>
                        <option value="resolu">Résolu</option>
                        <option value="archive">Archivé</option>
                    </select>
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

    async validerModifStatutAvertissement(id) {
        const nouveauStatut = document.getElementById('nouveauStatutAvertissement').value;
        
        try {
            // Pour la démo, mettre à jour dans localStorage
            const avertissements = JSON.parse(localStorage.getItem('sga-avertissements') || '[]');
            const avertissementIndex = avertissements.findIndex(a => a.id === id);
            
            if (avertissementIndex !== -1) {
                avertissements[avertissementIndex].statut = nouveauStatut;
                localStorage.setItem('sga-avertissements', JSON.stringify(avertissements));
            }
            
            this.closeModal();
            this.showToast('Statut mis à jour', 'success');
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
        if (!content) return;
        
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="congesTableBody">
                        <tr><td colspan="6" class="loading">Chargement...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        
        await this.loadCongesList();
    }

    async loadCongesList() {
        const tbody = document.getElementById('congesTableBody');
        if (!tbody) return;
        
        try {
            // Pour la démo, créer quelques congés
            let conges = [];
            
            try {
                conges = await this.db.obtenirCongesActifs();
            } catch (e) {
                // Créer des données de démo
                const agents = await this.db.listerAgents();
                const aujourdhui = new Date();
                const dans15Jours = new Date();
                dans15Jours.setDate(aujourdhui.getDate() + 15);
                
                conges = agents.slice(0, 2).map((agent, index) => ({
                    id: index + 1,
                    agent_code: agent.code,
                    type: ['annuel', 'exceptionnel'][index],
                    date_debut: aujourdhui.toISOString().split('T')[0],
                    date_fin: dans15Jours.toISOString().split('T')[0],
                    motif: ['Congé annuel', 'Congé familial'][index],
                    statut: ['approuve', 'en_attente'][index]
                }));
            }
            
            if (conges.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty">
                            <p>Aucun congé actif</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = await Promise.all(conges.map(async (conge) => {
                const agent = await this.db.obtenirAgent(conge.agent_code);
                const agentNom = agent ? `${agent.nom} ${agent.prenom}` : conge.agent_code;
                
                const statutBadge = conge.statut === 'approuve' ? 'badge-success' :
                                  conge.statut === 'en_attente' ? 'badge-warning' :
                                  'badge-danger';
                
                const statutText = conge.statut === 'approuve' ? 'Approuvé' :
                                 conge.statut === 'en_attente' ? 'En attente' :
                                 'Refusé';
                
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
                            <span class="badge ${statutBadge}">${statutText}</span>
                        </td>
                        <td>
                            ${conge.statut === 'en_attente' ? `
                                <button class="btn-icon" onclick="sgaApp.approuverConge(${conge.id})" 
                                        title="Approuver">
                                    ✓
                                </button>
                                <button class="btn-icon" onclick="sgaApp.refuserConge(${conge.id})" 
                                        title="Refuser">
                                    ✗
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }));
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="error">
                        Erreur: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    showDemanderCongeForm() {
        const aujourdhui = new Date().toISOString().split('T')[0];
        const dans30Jours = new Date();
        dans30Jours.setDate(dans30Jours.getDate() + 30);
        const dateFin = dans30Jours.toISOString().split('T')[0];
        
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
                        <input type="date" class="form-input" name="date_debut" 
                               value="${aujourdhui}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date fin*</label>
                        <input type="date" class="form-input" name="date_fin" 
                               value="${dateFin}" required>
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
            
            // Pour la démo, sauvegarder dans localStorage
            const congesExistants = JSON.parse(localStorage.getItem('sga-conges') || '[]');
            congesExistants.push({
                ...conge,
                id: congesExistants.length + 1,
                statut: 'en_attente'
            });
            
            localStorage.setItem('sga-conges', JSON.stringify(congesExistants));
            
            this.closeModal();
            this.showToast('Demande de congé enregistrée', 'success');
            await this.loadCongesList();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async approuverConge(id) {
        try {
            // Pour la démo, mettre à jour dans localStorage
            const conges = JSON.parse(localStorage.getItem('sga-conges') || '[]');
            const congeIndex = conges.findIndex(c => c.id === id);
            
            if (congeIndex !== -1) {
                conges[congeIndex].statut = 'approuve';
                localStorage.setItem('sga-conges', JSON.stringify(conges));
            }
            
            this.showToast('Congé approuvé', 'success');
            await this.loadCongesList();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async refuserConge(id) {
        try {
            // Pour la démo, mettre à jour dans localStorage
            const conges = JSON.parse(localStorage.getItem('sga-conges') || '[]');
            const congeIndex = conges.findIndex(c => c.id === id);
            
            if (congeIndex !== -1) {
                conges[congeIndex].statut = 'refuse';
                localStorage.setItem('sga-conges', JSON.stringify(conges));
            }
            
            this.showToast('Congé refusé', 'warning');
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
        if (!content) return;
        
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
                    <div class="info-item">
                        <span class="info-label">Navigateur:</span>
                        <span class="info-value">${navigator.userAgent.split(' ')[0]}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async exporterBackup() {
        try {
            // Collecter toutes les données
            const backup = {
                version: '1.0.0',
                date: new Date().toISOString(),
                agents: await this.db.listerAgents(),
                radios: await this.db.obtenirRadios(),
                conges: JSON.parse(localStorage.getItem('sga-conges') || '[]'),
                avertissements: JSON.parse(localStorage.getItem('sga-avertissements') || '[]'),
                habillement: JSON.parse(localStorage.getItem('sga-habillement') || '[]'),
                codesPanique: JSON.parse(localStorage.getItem('sga-codes-panique') || '[]'),
                settings: {
                    theme: this.theme,
                    lastSync: localStorage.getItem('sga-last-sync')
                }
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
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
            // Réparer la base de données
            await this.db.reparerBaseDonnees();
            
            // Vérifier les données corrompues
            const agents = await this.db.listerAgents();
            const radios = await this.db.obtenirRadios();
            
            let corrections = 0;
            
            // Corriger les agents sans groupe
            for (const agent of agents) {
                if (!agent.groupe || !['A', 'B', 'C', 'D', 'E'].includes(agent.groupe)) {
                    await this.db.modifierAgent(agent.code, { groupe: 'A' });
                    corrections++;
                }
            }
            
            this.showToast(`Base réparée: ${corrections} corrections appliquées`, 'success');
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
                
                <div class="feries-list" id="feriesList">
                    <h4>Jours fériés existants</h4>
                    <div class="loading">Chargement...</div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Fermer
                </button>
            </div>
        `);
        
        // Charger la liste des jours fériés
        await this.listerJoursFeriesDansModal();
    }

    async ajouterJourFerie(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const ferie = {
            date: formData.get('date'),
            nom: formData.get('nom')
        };
        
        try {
            // Pour la démo, sauvegarder dans localStorage
            const feries = JSON.parse(localStorage.getItem('sga-jours-feries') || '[]');
            feries.push(ferie);
            localStorage.setItem('sga-jours-feries', JSON.stringify(feries));
            
            event.target.reset();
            this.showToast('Jour férié ajouté', 'success');
            await this.listerJoursFeriesDansModal();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async listerJoursFeriesDansModal() {
        const feriesList = document.getElementById('feriesList');
        if (!feriesList) return;
        
        try {
            const feries = JSON.parse(localStorage.getItem('sga-jours-feries') || '[]');
            
            if (feries.length === 0) {
                feriesList.innerHTML = `
                    <h4>Jours fériés existants</h4>
                    <p class="empty">Aucun jour férié enregistré</p>
                `;
                return;
            }
            
            let html = '<h4>Jours fériés existants</h4><table class="table"><thead><tr><th>Date</th><th>Nom</th><th>Action</th></tr></thead><tbody>';
            
            feries.forEach((ferie, index) => {
                html += `
                    <tr>
                        <td>${ferie.date}</td>
                        <td>${ferie.nom}</td>
                        <td>
                            <button class="btn-icon" onclick="sgaApp.supprimerJourFerie(${index})" title="Supprimer">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            feriesList.innerHTML = html;
        } catch (error) {
            feriesList.innerHTML = `<p class="error">Erreur: ${error.message}</p>`;
        }
    }

    async supprimerJourFerie(index) {
        if (confirm('Supprimer ce jour férié ?')) {
            try {
                const feries = JSON.parse(localStorage.getItem('sga-jours-feries') || '[]');
                feries.splice(index, 1);
                localStorage.setItem('sga-jours-feries', JSON.stringify(feries));
                
                this.showToast('Jour férié supprimé', 'warning');
                await this.listerJoursFeriesDansModal();
            } catch (error) {
                this.showToast(`Erreur: ${error.message}`, 'error');
            }
        }
    }

    async viderCache() {
        if (confirm('Vider le cache local ?\n\nCette action supprimera toutes les données non synchronisées.')) {
            try {
                // Garder seulement les agents et radios
                const agents = await this.db.listerAgents();
                const radios = await this.db.obtenirRadios();
                
                // Réinitialiser la base
                await this.db.reinitialiser();
                
                // Restaurer les agents et radios
                for (const agent of agents) {
                    await this.db.ajouterAgent(agent);
                }
                
                for (const radio of radios) {
                    await this.db.ajouterRadio(radio.numero, radio.modele);
                    if (radio.agent_code) {
                        await this.db.attribuerRadio(radio.numero, radio.agent_code, radio.date_attribution);
                    }
                }
                
                this.showToast('Cache vidé - Données principales conservées', 'success');
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
                    <span>Notifications</span>
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <span>Version: 1.0.0</span>
                </div>
                
                <div class="setting-item">
                    <span>Développeur: SGA Team</span>
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
            const feries = JSON.parse(localStorage.getItem('sga-jours-feries') || '[]');
            
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
            
            if (feries.length === 0) {
                html += `
                    <tr>
                        <td colspan="2" class="empty">
                            <p>Aucun jour férié enregistré</p>
                        </td>
                    </tr>
                `;
            } else {
                feries.forEach(ferie => {
                    html += `
                        <tr>
                            <td>${ferie.date}</td>
                            <td>${ferie.nom}</td>
                        </tr>
                    `;
                });
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
}

// ========================================
// CLASSES UTILITAIRES POUR LA DÉMO
// ========================================

// Classe PlanningEngine pour la démo
class PlanningEngine {
    constructor(db) {
        this.db = db;
    }

    async genererPlanningTheorique(codeAgent, mois, annee) {
        const agent = await this.db.obtenirAgent(codeAgent);
        if (!agent) throw new Error('Agent non trouvé');
        
        const joursDansMois = new Date(annee, mois, 0).getDate();
        const planning = [];
        
        // Récupérer les jours fériés
        const feries = JSON.parse(localStorage.getItem('sga-jours-feries') || '[]');
        
        for (let jour = 1; jour <= joursDansMois; jour++) {
            const date = new Date(annee, mois - 1, jour);
            const jourSemaine = date.getDay(); // 0 = dimanche, 1 = lundi, etc.
            const estDimanche = jourSemaine === 0;
            
            // Vérifier si c'est un jour férié
            const dateStr = date.toISOString().split('T')[0];
            const ferie = feries.find(f => f.date === dateStr);
            
            // Générer un shift théorique basé sur le groupe
            let shift = this.genererShiftTheorique(agent.groupe, jour, mois, annee);
            
            // Si c'est dimanche ou férié, normalement repos
            if (estDimanche || ferie) {
                shift = ferie ? 'F' : 'R';
            }
            
            planning.push({
                jour: jour,
                jour_semaine: this.getJourSemaine(jourSemaine),
                shift: shift,
                est_dimanche: estDimanche,
                ferie: !!ferie,
                nom_ferie: ferie ? ferie.nom : null
            });
        }
        
        return planning;
    }

    genererShiftTheorique(groupe, jour, mois, annee) {
        // Logique simple de génération de planning
        const shifts = ['1', '2', '3', 'R']; // Matin, Après-midi, Nuit, Repos
        
        // Utiliser une formule déterministe pour avoir le même planning chaque mois
        const seed = groupe.charCodeAt(0) + jour + mois * 100 + annee;
        const index = (seed * 9301 + 49297) % 233280 / 233280;
        
        // Répartition: 30% matin, 30% après-midi, 20% nuit, 20% repos
        if (index < 0.3) return '1';
        if (index < 0.6) return '2';
        if (index < 0.8) return '3';
        return 'R';
    }

    getJourSemaine(numero) {
        const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return jours[numero];
    }

    async calculerStatsAgent(codeAgent, mois, annee) {
        const planning = await this.genererPlanningTheorique(codeAgent, mois, annee);
        
        const stats = {
            shift1: planning.filter(j => j.shift === '1').length,
            shift2: planning.filter(j => j.shift === '2').length,
            shift3: planning.filter(j => j.shift === '3').length,
            repos: planning.filter(j => j.shift === 'R').length,
            conges: planning.filter(j => j.shift === 'C').length,
            maladie: planning.filter(j => j.shift === 'M').length,
            absence: planning.filter(j => j.shift === 'A').length,
            feries: planning.filter(j => j.ferie).length,
            feriesTravailles: planning.filter(j => j.ferie && ['1', '2', '3'].includes(j.shift)).length
        };
        
        stats.totalJours = planning.length;
        stats.joursTravailles = stats.shift1 + stats.shift2 + stats.shift3;
        stats.totalOperationnels = stats.joursTravailles;
        stats.tauxPresence = (stats.joursTravailles / stats.totalJours) * 100;
        
        return stats;
    }

    async genererPlanningGroupe(groupe, mois, annee) {
        const agents = await this.db.obtenirAgentsParGroupe(groupe);
        const resultats = [];
        
        for (const agent of agents) {
            if (agent.statut === 'actif') {
                const planning = await this.genererPlanningTheorique(agent.code, mois, annee);
                resultats.push({
                    agent: agent,
                    planning: planning
                });
            }
        }
        
        return resultats;
    }

    async calculerJoursTravaillesGroupe(groupe, mois, annee) {
        const planningGroupe = await this.genererPlanningGroupe(groupe, mois, annee);
        let total = 0;
        
        for (const item of planningGroupe) {
            total += item.planning.filter(j => ['1', '2', '3'].includes(j.shift)).length;
        }
        
        return total;
    }
}

// Classe ExportUtils pour la démo
class ExportUtils {
    constructor(db) {
        this.db = db;
        this.planningEngine = null;
    }

    setPlanningEngine(planningEngine) {
        this.planningEngine = planningEngine;
    }
}

// Initialiser l'application
let sgaApp;
document.addEventListener('DOMContentLoaded', () => {
    sgaApp = new SGA_App();
    window.sgaApp = sgaApp;
    sgaApp.initialize();
});

// Rendre disponible globalement pour les callbacks HTML
window.SGA_App = SGA_App;