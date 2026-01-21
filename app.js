// Application SGA PWA - Version complète avec toutes les fonctionnalités
class SGA_App {
    constructor() {
        this.db = sgaDB;
        this.planningEngine = null;
        this.currentPage = 'menu';
        this.history = [];
        this.theme = localStorage.getItem('sga-theme') || 'light';
        
        // Debug
        console.log('🚀 SGA_App constructor');
        console.log('📁 DB instance:', this.db);
        console.log('🎨 Theme:', this.theme);
        
        this.initialize();
    }

    async initialize() {
        console.log('🔄 Initialisation SGA_App');
        
        try {
            // Initialiser la base de données
            console.log('📦 Initialisation base...');
            await this.db.initialize();
            console.log('✅ Base initialisée');
            
            // Initialiser le moteur de planning
            this.planningEngine = new PlanningEngine(this.db);
            
            // Appliquer le thème
            this.applyTheme();
            
            // Configurer les événements
            this.setupEventListeners();
            
            // Charger les données initiales si nécessaire
            await this.loadInitialData();
            
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

    updateBaseInfo() {
        console.log('🔄 Mise à jour info base...');
        this.db.obtenirStatsGlobales().then(stats => {
            console.log('📊 Stats reçues:', stats);
            const dbInfo = document.getElementById('dbInfo');
            if (dbInfo) {
                dbInfo.textContent = `Agents: ${stats.totalAgents} | Radios: ${stats.totalRadios}`;
            }
        }).catch(error => {
            console.error('❌ Erreur stats:', error);
            const dbInfo = document.getElementById('dbInfo');
            if (dbInfo) {
                dbInfo.textContent = 'Base: Erreur de chargement';
            }
        });
    }
}

    navigateTo(page, pushHistory = true) {
        if (page === this.currentPage) return;
        
        // Ajouter à l'historique
        if (pushHistory && this.currentPage !== 'menu') {
            this.history.push(this.currentPage);
        }
        
        // Afficher le bouton retour si nécessaire
        const backBtn = document.getElementById('backBtn');
        if (page !== 'menu' && this.history.length > 0) {
            backBtn.style.display = 'block';
        } else {
            backBtn.style.display = 'none';
        }
        
        // Mettre à jour la navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.page === page) {
                tab.classList.add('active');
            }
        });
        
        // Masquer toutes les pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        // Afficher la page demandée
        document.getElementById(`page${page.charAt(0).toUpperCase() + page.slice(1)}`).classList.add('active');
        
        // Mettre à jour le sous-titre
        this.updateSubtitle(page);
        
        // Charger le contenu de la page
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
        
        menuGrid.innerHTML = menuItems.map(item => `
            <div class="menu-card" onclick="${item.action.toString().replace(/\n/g, ' ')}">
                <h3><span>${item.icon}</span> ${item.title}</h3>
                <p>${item.description}</p>
            </div>
        `).join('');
        
        // Réattacher les événements
        menuItems.forEach((item, index) => {
            const card = menuGrid.children[index];
            card.addEventListener('click', item.action);
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
                <button class="btn btn-info" onclick="sgaApp.showImporterExcelForm()">
                    📥 Importer Excel
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
            statsDiv.innerHTML = `
                <strong>Total: ${agents.length} agents</strong> | 
                A: ${groupes['A'] || 0} | B: ${groupes['B'] || 0} | 
                C: ${groupes['C'] || 0} | D: ${groupes['D'] || 0} | 
                E: ${groupes['E'] || 0}
            `;
            
            // Remplir le tableau
            tbody.innerHTML = agents.map(agent => `
                <tr>
                    <td><strong>${agent.code}</strong></td>
                    <td>${agent.nom}</td>
                    <td>${agent.prenom}</td>
                    <td><span class="badge badge-groupe-${agent.groupe}">${agent.groupe}</span></td>
                    <td>${agent.date_entree || '-'}</td>
                    <td><span class="badge ${agent.statut === 'actif' ? 'badge-shift-R' : 'badge-shift-A'}">
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
                           value="2025-11-01">
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
                                   value="${agent.date_entree || '2025-11-01'}">
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
                    <button class="btn" onclick="sgaApp.exporterPlanningAgent('${code}', ${mois}, ${annee})">
                        📤 Exporter PDF
                    </button>
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

    async voirStatsAgent(code) {
        try {
            const agent = await this.db.obtenirAgent(code);
            const mois = new Date().getMonth() + 1;
            const annee = new Date().getFullYear();
            
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
                    <button class="btn" onclick="sgaApp.exporterStatsAgentPDF('${code}', ${mois}, ${annee})">
                        📤 Exporter PDF
                    </button>
                    <button class="btn btn-info" onclick="sgaApp.comparerMoisPrecedent('${code}', ${mois}, ${annee})">
                    🔄 Comparer
                    </button>
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
                <div class="menu-card" onclick="sgaApp.showModifierShiftForm()">
                    <h3><span>✏️</span> MODIFIER SHIFT</h3>
                    <p>Changement ponctuel de shift</p>
                </div>
                <div class="menu-card" onclick="sgaApp.showEchangerShiftsForm()">
                    <h3><span>🔄</span> ÉCHANGER SHIFTS</h3>
                    <p>Échange de shifts entre agents</p>
                </div>
                <div class="menu-card" onclick="sgaApp.showEnregistrerAbsenceForm()">
                    <h3><span>🏖️</span> ENREGISTRER ABSENCE</h3>
                    <p>Congé, maladie, autre absence</p>
                </div>
            </div>
            
            <div class="quick-actions">
                <button class="btn" onclick="sgaApp.genererPlanningMensuel()">
                    🎯 Générer Planning du Mois
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.exporterPlanningExcel()">
                    📤 Exporter Planning Excel
                </button>
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
            const agents = await this.db.listerAgents();
            const joursDansMois = new Date(annee, mois, 0).getDate();
            
            let html = `
                <div class="modal-header">
                    <h3 class="modal-title">Planning Global - ${mois}/${annee}</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                
                <div class="planning-info">
                    <p><strong>${agents.length} agents</strong> | ${joursDansMois} jours</p>
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
                                <th>Stats</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            for (const agent of agents) {
                const planning = await this.planningEngine.genererPlanningTheorique(agent.code, mois, annee);
                
                html += `
                    <tr>
                        <td><strong>${agent.code}</strong></td>
                        <td>${agent.nom} ${agent.prenom}</td>
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
                
                // Calculer les stats
                const stats = await this.planningEngine.calculerStatsAgent(agent.code, mois, annee);
                
                html += `
                        <td>
                            <button class="btn-icon" onclick="sgaApp.voirStatsAgent('${agent.code}')" 
                                    title="Voir statistiques">
                                ${stats.totalOperationnels}⚡
                            </button>
                        </td>
                    </tr>
                `;
            }
            
            html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="modal-actions">
                    <button class="btn" onclick="sgaApp.exporterPlanningGlobalExcel(${mois}, ${annee})">
                        📤 Exporter Excel
                    </button>
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
                            `<option value="${i+1}">
                                ${new Date(2000, i, 1).toLocaleDateString('fr-FR', {month: 'long'})}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Année</label>
                    <input type="number" class="form-input" id="planningGroupeAnnee" 
                           value="${new Date().getFullYear()}" min="2020" max="2030">
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
                                <th>Stats</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            for (const item of planningGroupe) {
                const agent = item.agent;
                
                html += `
                    <tr>
                        <td><strong>${agent.code}</strong></td>
                        <td>${agent.nom} ${agent.prenom}</td>
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
                
                // Calculer les stats
                const stats = await this.planningEngine.calculerStatsAgent(agent.code, mois, annee);
                
                html += `
                        <td>
                            <button class="btn-icon" onclick="sgaApp.voirStatsAgent('${agent.code}')" 
                                    title="Voir statistiques">
                                ${stats.totalOperationnels}⚡
                            </button>
                        </td>
                    </tr>
                `;
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
                    <p>Moyenne par agent: ${(statsGroupe / planningGroupe.length).toFixed(1)} jours</p>
                </div>
                
                <div class="modal-actions">
                    <button class="btn" onclick="sgaApp.exporterStatsGroupePDF('${groupe}', ${mois}, ${annee})">
                        📤 Exporter Rapport
                    </button>
                    <button class="btn btn-info" onclick="sgaApp.afficherStatsGroupePopup('${groupe}', ${mois}, ${annee})">
                        📊 Statistiques Détaillées
                    </button>
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
                                    <th>Répartition</th>
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
                        <td>${agent.shifts1}-${agent.shifts2}-${agent.shifts3}</td>
                    </tr>
                `;
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn" onclick="sgaApp.exporterStatsGroupePDF('${groupe}', ${mois}, ${annee})">
                        📤 Exporter Rapport
                    </button>
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

    async showModifierShiftForm() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">✏️ Modifier Shift</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form id="formModifierShift" onsubmit="return sgaApp.validerModifierShift(event)">
                <div class="form-group">
                    <label class="form-label">Code Agent</label>
                    <input type="text" class="form-input" name="code_agent" 
                           placeholder="Ex: CPA, CONA" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" name="date" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Nouveau Shift</label>
                    <select class="form-select" name="shift" required>
                        <option value="">Sélectionner...</option>
                        <option value="1">1 (Matin)</option>
                        <option value="2">2 (Après-midi)</option>
                        <option value="3">3 (Nuit)</option>
                        <option value="R">R (Repos)</option>
                        <option value="C">C (Congé)</option>
                        <option value="M">M (Maladie)</option>
                        <option value="A">A (Autre absence)</option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-success">Modifier</button>
                    <button type="button" class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Annuler
                    </button>
                </div>
            </form>
        `);
    }

    async validerModifierShift(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const code_agent = formData.get('code_agent').toUpperCase();
        const date = formData.get('date');
        const shift = formData.get('shift');
        
        try {
            // Vérifier si l'agent existe
            const agent = await this.db.obtenirAgent(code_agent);
            if (!agent) {
                throw new Error('Agent non trouvé');
            }
            
            // Vérifier si on peut modifier le shift
            const peutModifier = await this.planningEngine.peutModifierShift(code_agent, date);
            if (!peutModifier) {
                throw new Error('Impossible de modifier ce shift (congé/maladie/absence)');
            }
            
            // Modifier le shift
            await this.db.modifierShiftPonctuel(code_agent, date, shift);
            
            this.closeModal();
            this.showToast(`Shift modifié pour ${code_agent} le ${date}`, 'success');
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async showEchangerShiftsForm() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">🔄 Échanger Shifts</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form id="formEchangerShifts" onsubmit="return sgaApp.validerEchangerShifts(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Code Agent A</label>
                        <input type="text" class="form-input" name="code_agent_a" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Code Agent B</label>
                        <input type="text" class="form-input" name="code_agent_b" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" name="date" required>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-success">Échanger</button>
                    <button type="button" class="btn btn-secondary" onclick="sgaApp.closeModal()">
                        Annuler
                    </button>
                </div>
            </form>
        `);
    }

    async validerEchangerShifts(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const code_agent_a = formData.get('code_agent_a').toUpperCase();
        const code_agent_b = formData.get('code_agent_b').toUpperCase();
        const date = formData.get('date');
        
        try {
            // Vérifier si les agents existent
            const agentA = await this.db.obtenirAgent(code_agent_a);
            const agentB = await this.db.obtenirAgent(code_agent_b);
            
            if (!agentA || !agentB) {
                throw new Error('Un ou plusieurs agents non trouvés');
            }
            
            // Échanger les shifts
            const success = await this.db.echangerShifts(code_agent_a, code_agent_b, date);
            
            if (success) {
                this.closeModal();
                this.showToast(`Shifts échangés entre ${code_agent_a} et ${code_agent_b}`, 'success');
            } else {
                throw new Error('Échange impossible (shifts non trouvés)');
            }
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async showEnregistrerAbsenceForm() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">🏖️ Enregistrer Absence</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form id="formEnregistrerAbsence" onsubmit="return sgaApp.validerEnregistrerAbsence(event)">
                <div class="form-group">
                    <label class="form-label">Code Agent</label>
                    <input type="text" class="form-input" name="code_agent" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" name="date" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Type d'absence</label>
                    <select class="form-select" name="type" required>
                        <option value="">Sélectionner...</option>
                        <option value="C">C (Congé)</option>
                        <option value="M">M (Maladie)</option>
                        <option value="A">A (Autre absence)</option>
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

    async validerEnregistrerAbsence(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const code_agent = formData.get('code_agent').toUpperCase();
        const date = formData.get('date');
        const type = formData.get('type');
        
        try {
            // Vérifier si l'agent existe
            const agent = await this.db.obtenirAgent(code_agent);
            if (!agent) {
                throw new Error('Agent non trouvé');
            }
            
            // Enregistrer l'absence
            await this.db.enregistrerAbsence(code_agent, date, type);
            
            this.closeModal();
            this.showToast(`Absence enregistrée pour ${code_agent}`, 'success');
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async genererPlanningMensuel() {
        const mois = new Date().getMonth() + 1;
        const annee = new Date().getFullYear();
        
        try {
            const agents = await this.db.listerAgents();
            let totalGenerated = 0;
            
            for (const agent of agents) {
                if (agent.statut === 'actif') {
                    await this.planningEngine.genererPlanningTheorique(agent.code, mois, annee);
                    totalGenerated++;
                }
            }
            
            this.showToast(`Planning généré pour ${totalGenerated} agents`, 'success');
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
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
        const code = document.getElementById('statsAgentCode').value.toUpperCase();
        const mois = parseInt(document.getElementById('statsAgentMois').value);
        const annee = parseInt(document.getElementById('statsAgentAnnee').value);
        
        try {
            const agent = await this.db.obtenirAgent(code);
            if (!agent) {
                this.showToast('Agent non trouvé', 'error');
                return;
            }
            
            // Utiliser la fonction voirStatsAgent avec les paramètres
            await this.voirStatsAgent(code, mois, annee);
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async voirStatsAgent(code, mois, annee) {
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
                    <button class="btn" onclick="sgaApp.exporterStatsAgentPDF('${code}', ${mois}, ${annee})">
                        📤 Exporter PDF
                    </button>
                    <button class="btn btn-info" onclick="sgaApp.comparerMoisPrecedent('${code}', ${mois}, ${annee})">
                        🔄 Comparer
                    </button>
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

    async comparerMoisPrecedent(code, mois, annee) {
        try {
            const agent = await this.db.obtenirAgent(code);
            let moisPrecedent = mois - 1;
            let anneePrecedente = annee;
            
            if (moisPrecedent === 0) {
                moisPrecedent = 12;
                anneePrecedente = annee - 1;
            }
            
            const statsActuel = await this.planningEngine.calculerStatsAgent(code, mois, annee);
            const statsPrecedent = await this.planningEngine.calculerStatsAgent(code, moisPrecedent, anneePrecedente);
            
            let html = `
                <div class="modal-header">
                    <h3 class="modal-title">🔄 Comparaison ${agent.code}</h3>
                    <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
                </div>
                
                <div class="comparison-info">
                    <p><strong>${agent.nom} ${agent.prenom}</strong> | Groupe: ${agent.groupe}</p>
                    <p>Comparaison: ${moisPrecedent}/${anneePrecedente} ↔ ${mois}/${annee}</p>
                </div>
                
                <div class="comparison-table">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Mois ${moisPrecedent}</th>
                                <th>Mois ${mois}</th>
                                <th>Différence</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            const types = ['1', '2', '3', 'R', 'C', 'M', 'A'];
            const labels = {
                '1': 'Matin',
                '2': 'Après-midi',
                '3': 'Nuit',
                'R': 'Repos',
                'C': 'Congés',
                'M': 'Maladie',
                'A': 'Absences'
            };
            
            types.forEach(type => {
                const actuel = statsActuel.stats[type] || 0;
                const precedent = statsPrecedent.stats[type] || 0;
                const difference = actuel - precedent;
                let diffClass = '';
                if (difference > 0) diffClass = 'positive';
                if (difference < 0) diffClass = 'negative';
                
                html += `
                    <tr>
                        <td>${labels[type]}</td>
                        <td>${precedent}</td>
                        <td>${actuel}</td>
                        <td class="${diffClass}">${difference > 0 ? '+' : ''}${difference}</td>
                    </tr>
                `;
            });
            
            html += `
                            <tr class="total-row">
                                <td><strong>Total Opérationnel</strong></td>
                                <td><strong>${statsPrecedent.totalOperationnels}</strong></td>
                                <td><strong>${statsActuel.totalOperationnels}</strong></td>
                                <td class="${statsActuel.totalOperationnels - statsPrecedent.totalOperationnels > 0 ? 'positive' : 'negative'}">
                                    ${statsActuel.totalOperationnels - statsPrecedent.totalOperationnels > 0 ? '+' : ''}
                                    ${statsActuel.totalOperationnels - statsPrecedent.totalOperationnels}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="comparison-summary">
                    <p>Taux présence actuel: ${((statsActuel.totalJoursTravailles / statsActuel.totalJours) * 100).toFixed(1)}%</p>
                    <p>Taux présence précédent: ${((statsPrecedent.totalJoursTravailles / statsPrecedent.totalJours) * 100).toFixed(1)}%</p>
                </div>
            `;
            
            this.showModal(html);
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    // ========================================
    // PAGE GESTION DES RADIOS
    // ========================================
    async showRadiosPage() {
        const content = document.getElementById('radiosContent');
        
        content.innerHTML = `
            <div class="page-header">
                <h3>📻 GESTION DES RADIOS</h3>
                <p>Suivi des radios attribuées aux agents</p>
            </div>
            
            <div class="page-actions">
                <button class="btn btn-success" onclick="sgaApp.showAttribuerRadioForm()">
                    📱 Attribuer Radio
                </button>
                <button class="btn btn-info" onclick="sgaApp.showAjouterRadioForm()">
                    ➕ Ajouter Radio
                </button>
                <button class="btn btn-warning" onclick="sgaApp.showRetourRadioForm()">
                    ↩️ Retour Radio
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
                <div class="stat-card">
                    <div class="stat-value" id="radiosEnPanne">0</div>
                    <div class="stat-label">En panne</div>
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active" onclick="sgaApp.switchRadioTab('attribuees')">
                    📋 Attribuées
                </button>
                <button class="tab-btn" onclick="sgaApp.switchRadioTab('disponibles')">
                    📦 Disponibles
                </button>
                <button class="tab-btn" onclick="sgaApp.switchRadioTab('historique')">
                    📊 Historique
                </button>
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

    async loadRadiosList(tab = 'attribuees') {
        const tbody = document.getElementById('radiosTableBody');
        
        try {
            let radios = [];
            
            if (tab === 'attribuees') {
                radios = await this.db.obtenirRadiosAttribuees();
            } else if (tab === 'disponibles') {
                radios = await this.db.obtenirRadiosDisponibles();
            } else if (tab === 'historique') {
                radios = await this.db.obtenirHistoriqueRadios();
            }
            
            if (radios.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty">
                            <p>Aucune radio ${tab === 'attribuees' ? 'attribuée' : tab === 'disponibles' ? 'disponible' : 'dans l\'historique'}</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = radios.map(radio => `
                <tr>
                    <td><strong>${radio.numero}</strong></td>
                    <td>${radio.agent_nom || 'Non attribuée'}</td>
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
                            <button class="btn-icon" onclick="sgaApp.modifierStatutRadio('${radio.numero}')" 
                                    title="Modifier statut">
                                ✏️
                            </button>
                        </div>
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

    async updateRadiosStats() {
        try {
            const stats = await this.db.obtenirStatsRadios();
            
            document.getElementById('totalRadios').textContent = stats.total;
            document.getElementById('radiosAttribuees').textContent = stats.attribuees;
            document.getElementById('radiosDisponibles').textContent = stats.disponibles;
            document.getElementById('radiosEnPanne').textContent = stats.en_panne;
        } catch (error) {
            console.error('Erreur stats radios:', error);
        }
    }

    switchRadioTab(tab) {
        // Mettre à jour les boutons tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Charger la liste correspondante
        this.loadRadiosList(tab);
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
                    <label class="form-label">Code Agent</label>
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
            
            // Vérifier si la radio existe et est disponible
            const radio = await this.db.obtenirRadio(numero);
            if (!radio) {
                throw new Error('Radio non trouvée');
            }
            
            if (radio.statut !== 'disponible') {
                throw new Error('Radio non disponible');
            }
            
            // Attribuer la radio
            await this.db.attribuerRadio(numero, code_agent, date_attribution);
            
            this.closeModal();
            this.showToast(`Radio ${numero} attribuée à ${code_agent}`, 'success');
            await this.loadRadiosList('attribuees');
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
                        <option value="maintenance">Maintenance</option>
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
            const radio = await this.db.obtenirRadio(numero);
            if (!radio || radio.agent_code !== code_agent) {
                throw new Error('Cette radio n\'est pas attribuée à cet agent');
            }
            
            // Enregistrer le retour
            await this.db.retournerRadio(numero, statut, remarques);
            
            this.closeModal();
            this.showToast(`Radio ${numero} retournée`, 'success');
            await this.loadRadiosList('attribuees');
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
                <button class="btn btn-success" onclick="sgaApp.showAjouterCodePaniqueForm()">
                    ➕ Ajouter Code
                </button>
                <button class="btn btn-info" onclick="sgaApp.genererCodesPanique()">
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
                <p>• Les codes expirés sont en rouge</p>
                <p>• Les codes utilisés sont en gris</p>
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
            
            grid.innerHTML = codes.map(code => {
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
                            <span>Agent: ${code.agent_nom || 'Non attribué'}</span>
                            <span>${statusText}</span>
                        </div>
                        <div class="code-actions">
                            <button class="btn-icon" onclick="event.stopPropagation(); sgaApp.attribuerCodePanique('${code.code}')" 
                                    title="Attribuer">
                                👤
                            </button>
                            <button class="btn-icon" onclick="event.stopPropagation(); sgaApp.marquerCodeUtilise('${code.code}')" 
                                    title="Marquer utilisé">
                                ✅
                            </button>
                            <button class="btn-icon" onclick="event.stopPropagation(); sgaApp.regenererCodePanique('${code.code}')" 
                                    title="Régénérer">
                        🔄
                            </button>
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
            const confirmation = confirm('Générer une nouvelle série de codes panique ?\n\nLes codes existants seront archivés.');
            
            if (confirmation) {
                await this.db.genererCodesPanique();
                this.showToast('Nouvelle série de codes générée', 'success');
                await this.loadCodesPanique();
            }
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async attribuerCodePanique(code) {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">👤 Attribuer Code Panique</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <form id="formAttribuerCode" onsubmit="return sgaApp.validerAttributionCode(event, '${code}')">
                <div class="form-group">
                    <label class="form-label">Code Agent</label>
                    <input type="text" class="form-input" name="code_agent" 
                           placeholder="Ex: CPA, CONA" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date d'expiration</label>
                    <input type="date" class="form-input" name="date_expiration" 
                           value="${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" 
                           min="${new Date().toISOString().split('T')[0]}">
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

    async validerAttributionCode(event, code) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const code_agent = formData.get('code_agent').toUpperCase();
        const date_expiration = formData.get('date_expiration');
        
        try {
            // Vérifier si l'agent existe
            const agent = await this.db.obtenirAgent(code_agent);
            if (!agent) {
                throw new Error('Agent non trouvé');
            }
            
            // Attribuer le code
            await this.db.attribuerCodePanique(code, code_agent, date_expiration);
            
            this.closeModal();
            this.showToast(`Code attribué à ${code_agent}`, 'success');
            await this.loadCodesPanique();
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async marquerCodeUtilise(code) {
        if (confirm('Marquer ce code comme utilisé ?\n\nCette action est irréversible.')) {
            try {
                await this.db.marquerCodePaniqueUtilise(code);
                this.showToast('Code marqué comme utilisé', 'success');
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
                <button class="btn btn-info" onclick="sgaApp.showRechercheHabillementForm()">
                    🔍 Rechercher
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.exporterHabillementExcel()">
                    📤 Exporter Excel
                </button>
            </div>
            
            <div class="search-bar">
                <input type="text" id="searchHabillement" class="form-input" 
                       placeholder="Rechercher par agent, taille, type..." 
                       onkeyup="sgaApp.filterHabillement()">
            </div>
            
            <div class="table-container">
                <table class="table" id="habillementTable">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Type</th>
                            <th>Taille</th>
                            <th>Date Commande</th>
                            <th>Date Livraison</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="habillementTableBody">
                        <tr><td colspan="7" class="loading">Chargement...</td></tr>
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
                        <td colspan="7" class="empty">
                            <p>Aucune commande d'habillement</p>
                            <button class="btn" onclick="sgaApp.showAjouterHabillementForm()">
                                Ajouter une commande
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = commandes.map(commande => `
                <tr>
                    <td>
                        <strong>${commande.agent_code}</strong><br>
                        <small>${commande.agent_nom}</small>
                    </td>
                    <td>${commande.type_uniforme}</td>
                    <td>${commande.taille}</td>
                    <td>${commande.date_commande || '-'}</td>
                    <td>${commande.date_livraison || '-'}</td>
                    <td>
                        <span class="badge ${commande.statut === 'livre' ? 'badge-shift-1' : 
                                          commande.statut === 'en_cours' ? 'badge-shift-2' : 
                                          'badge-shift-A'}">
                            ${commande.statut === 'livre' ? 'Livré' : 
                              commande.statut === 'en_cours' ? 'En cours' : 'Commandé'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="sgaApp.modifierCommandeHabillement(${commande.id})" 
                                    title="Modifier">
                                ✏️
                            </button>
                            ${commande.statut !== 'livre' ? `
                                <button class="btn-icon" onclick="sgaApp.marquerCommandeLivree(${commande.id})" 
                                        title="Marquer livré">
                                    ✅
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
                        <option value="accessoires">Accessoires</option>
                    </select>
                </div>
                
                <div class="form-row">
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
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date de commande</label>
                    <input type="date" class="form-input" name="date_commande" 
                           value="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Remarques</label>
                    <textarea class="form-input" name="remarques" rows="3" 
                              placeholder="Couleur, modèle, spécificités..."></textarea>
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
            quantite: parseInt(formData.get('quantite')),
            date_commande: formData.get('date_commande'),
            remarques: formData.get('remarques')
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

    async marquerCommandeLivree(id) {
        try {
            const dateLivraison = prompt('Date de livraison (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
            
            if (dateLivraison) {
                await this.db.marquerCommandeLivree(id, dateLivraison);
                this.showToast('Commande marquée comme livrée', 'success');
                await this.loadHabillementList();
            }
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
                <button class="btn btn-info" onclick="sgaApp.showStatistiquesAvertissements()">
                    📊 Statistiques
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.exporterAvertissementsExcel()">
                    📤 Exporter Excel
                </button>
            </div>
            
            <div class="filters">
                <select class="form-select" id="filterAvertissementStatut" 
                        onchange="sgaApp.filterAvertissements()">
                    <option value="tous">Tous les statuts</option>
                    <option value="actif">Actif</option>
                    <option value="resolu">Résolu</option>
                    <option value="archive">Archivé</option>
                </select>
                
                <select class="form-select" id="filterAvertissementType" 
                        onchange="sgaApp.filterAvertissements()">
                    <option value="tous">Tous les types</option>
                    <option value="verbal">Verbal</option>
                    <option value="ecrit">Écrit</option>
                    <option value="suspension">Suspension</option>
                    <option value="licenciement">Licenciement</option>
                </select>
            </div>
            
            <div class="table-container">
                <table class="table" id="avertissementsTable">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Agent</th>
                            <th>Type</th>
                            <th>Motif</th>
                            <th>Sanction</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="avertissementsTableBody">
                        <tr><td colspan="7" class="loading">Chargement...</td></tr>
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
                        <td colspan="7" class="empty">
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
                            <small>${avert.agent_nom}</small>
                        </td>
                        <td><span class="badge ${typeClass}">${avert.type}</span></td>
                        <td>${avert.motif}</td>
                        <td>${avert.sanction || '-'}</td>
                        <td><span class="badge ${sanctionClass}">${avert.statut}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon" onclick="sgaApp.voirAvertissement(${avert.id})" 
                                        title="Voir détails">
                                    👁️
                                </button>
                                ${avert.statut === 'actif' ? `
                                    <button class="btn-icon" onclick="sgaApp.resoudreAvertissement(${avert.id})" 
                                            title="Marquer résolu">
                                        ✅
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="error">
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
                        <option value="suspension">Suspension</option>
                        <option value="licenciement">Licenciement</option>
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
                
                <div class="form-group">
                    <label class="form-label">Sanction (si applicable)</label>
                    <textarea class="form-input" name="sanction" rows="2"
                              placeholder="Détails de la sanction..."></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date de fin de sanction</label>
                    <input type="date" class="form-input" name="date_fin_sanction">
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
            motif: formData.get('motif'),
            sanction: formData.get('sanction'),
            date_fin_sanction: formData.get('date_fin_sanction') || null
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

    async resoudreAvertissement(id) {
        try {
            const motifResolution = prompt('Motif de la résolution:');
            
            if (motifResolution) {
                await this.db.resoudreAvertissement(id, motifResolution);
                this.showToast('Avertissement résolu', 'success');
                await this.loadAvertissementsList();
            }
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
                <button class="btn btn-info" onclick="sgaApp.showPlanifierCongeForm()">
                    📅 Planifier Congé
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.exporterCongesExcel()">
                    📤 Exporter Excel
                </button>
            </div>
            
            <div class="calendar-header">
                <button class="btn-icon" onclick="sgaApp.prevMonthConges()">←</button>
                <h4 id="congesMonthTitle">${new Date().toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}</h4>
                <button class="btn-icon" onclick="sgaApp.nextMonthConges()">→</button>
            </div>
            
            <div class="calendar-grid" id="congesCalendar">
                <!-- Calendrier des congés sera généré ici -->
            </div>
            
            <div class="conges-list">
                <h4>Congés du mois</h4>
                <div id="congesListContent">
                    <p class="loading">Chargement...</p>
                </div>
            </div>
        `;
        
        await this.loadCongesCalendar();
    }

    async loadCongesCalendar() {
        const calendar = document.getElementById('congesCalendar');
        const list = document.getElementById('congesListContent');
        
        try {
            const mois = new Date().getMonth() + 1;
            const annee = new Date().getFullYear();
            
            const conges = await this.db.obtenirCongesMois(mois, annee);
            const joursDansMois = new Date(annee, mois, 0).getDate();
            
            // Mettre à jour le titre
            document.getElementById('congesMonthTitle').textContent = 
                new Date(annee, mois - 1, 1).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'});
            
            // Générer le calendrier
            calendar.innerHTML = '';
            
            // Jours de la semaine
            const joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            joursSemaine.forEach(jour => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'calendar-day-header';
                dayHeader.textContent = jour;
                calendar.appendChild(dayHeader);
            });
            
            // Premier jour du mois
            const premierJour = new Date(annee, mois - 1, 1).getDay();
            const decalage = premierJour === 0 ? 6 : premierJour - 1;
            
            // Cases vides au début
            for (let i = 0; i < decalage; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day empty';
                calendar.appendChild(emptyDay);
            }
            
            // Jours du mois
            for (let jour = 1; jour <= joursDansMois; jour++) {
                const dateStr = `${annee}-${mois.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;
                const congesJour = conges.filter(c => c.date_debut <= dateStr && c.date_fin >= dateStr);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                
                if (congesJour.length > 0) {
                    dayElement.classList.add('has-conge');
                    dayElement.title = congesJour.map(c => `${c.agent_code}: ${c.type}`).join('\n');
                    
                    let congeCount = document.createElement('div');
                    congeCount.className = 'conge-count';
                    congeCount.textContent = congesJour.length;
                    dayElement.appendChild(congeCount);
                }
                
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = jour;
                dayElement.appendChild(dayNumber);
                
                // Vérifier si c'est un dimanche
                const date = new Date(annee, mois - 1, jour);
                if (date.getDay() === 0) {
                    dayElement.classList.add('dimanche');
                }
                
                calendar.appendChild(dayElement);
            }
            
            // Liste des congés
            if (conges.length === 0) {
                list.innerHTML = '<p class="empty">Aucun congé ce mois-ci</p>';
            } else {
                list.innerHTML = conges.map(conge => `
                    <div class="conge-item">
                        <div class="conge-agent">${conge.agent_code} - ${conge.agent_nom}</div>
                        <div class="conge-dates">${conge.date_debut} au ${conge.date_fin}</div>
                        <div class="conge-type">${conge.type}</div>
                        <div class="conge-statut ${conge.statut}">${conge.statut}</div>
                    </div>
                `).join('');
            }
            
        } catch (error) {
            calendar.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
            list.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
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
                        <option value="maternite">Maternité/Paternité</option>
                        <option value="formation">Formation</option>
                        <option value="autre">Autre</option>
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
            
            // Vérifier la disponibilité
            const conflits = await this.db.verifierConflitsConge(conge.code_agent, conge.date_debut, conge.date_fin);
            if (conflits.length > 0) {
                throw new Error('Conflit avec des congés existants');
            }
            
            // Demander le congé
            await this.db.demanderConge(conge);
            
            this.closeModal();
            this.showToast('Demande de congé enregistrée', 'success');
            await this.loadCongesCalendar();
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
                <div class="tool-card" onclick="sgaApp.showImporterExcelForm()">
                    <div class="tool-icon">📥</div>
                    <h4>IMPORTER EXCEL</h4>
                    <p>Importer des agents depuis Excel</p>
                </div>
                
                <div class="tool-card" onclick="sgaApp.exporterBackup()">
                    <div class="tool-icon">💾</div>
                    <h4>SAUVEGARDER</h4>
                    <p>Créer une sauvegarde complète</p>
                </div>
                
                <div class="tool-card" onclick="sgaApp.showRestaurerBackupForm()">
                    <div class="tool-icon">🔄</div>
                    <h4>RESTAURER</h4>
                    <p>Restaurer depuis sauvegarde</p>
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
                
                <div class="tool-card" onclick="sgaApp.genererRapportMensuel()">
                    <div class="tool-icon">📊</div>
                    <h4>RAPPORT MENSUEL</h4>
                    <p>Générer rapport complet</p>
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
                    <!-- Informations système seront chargées ici -->
                </div>
            </div>
        `;
        
        await this.loadSystemInfo();
    }

    async loadSystemInfo() {
        const infoGrid = document.getElementById('systemInfo');
        
        try {
            const stats = await this.db.obtenirStatsGlobales();
            const agents = await this.db.listerAgents();
            
            infoGrid.innerHTML = `
                <div class="info-item">
                    <span class="info-label">Version:</span>
                    <span class="info-value">1.0.0</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Agents:</span>
                    <span class="info-value">${stats.totalAgents}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Radios:</span>
                    <span class="info-value">${stats.totalRadios}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Congés actifs:</span>
                    <span class="info-value">${stats.totalCongesActifs}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Base de données:</span>
                    <span class="info-value">${localStorage.getItem('sga-db-version') || '1.0'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Dernière sync:</span>
                    <span class="info-value">${localStorage.getItem('sga-last-sync') || 'Jamais'}</span>
                </div>
            `;
        } catch (error) {
            infoGrid.innerHTML = `<p class="error">Erreur: ${error.message}</p>`;
        }
    }

    async showImporterExcelForm() {
        this.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">📥 Importer depuis Excel</h3>
                <button class="modal-close" onclick="sgaApp.closeModal()">×</button>
            </div>
            
            <div class="modal-body">
                <div class="instructions">
                    <p><strong>Format Excel requis:</strong></p>
                    <ul>
                        <li>Colonne A: Code (CPA, CONA, ZA...)</li>
                        <li>Colonne B: Nom</li>
                        <li>Colonne C: Prénom</li>
                        <li>Colonne D: Groupe (A, B, C, D, E)</li>
                        <li>Colonne E: Date entrée (optionnel)</li>
                    </ul>
                    <p><em>La première ligne doit contenir les en-têtes</em></p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Fichier Excel</label>
                    <input type="file" class="form-input" id="excelFile" 
                           accept=".xlsx, .xls, .csv">
                </div>
                
                <div class="form-group">
                    <label class="form-check">
                        <input type="checkbox" id="overwriteAgents">
                        <span>Remplacer les agents existants</span>
                    </label>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-success" onclick="sgaApp.importerExcel()">
                    Importer
                </button>
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Annuler
                </button>
            </div>
        `);
    }

    async importerExcel() {
        const fileInput = document.getElementById('excelFile');
        const overwrite = document.getElementById('overwriteAgents').checked;
        
        if (!fileInput.files.length) {
            this.showToast('Veuillez sélectionner un fichier', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        
        try {
            // Simuler l'importation (dans une vraie implémentation, on utiliserait une librairie comme xlsx)
            this.showToast('Importation simulée - fonctionnalité en développement', 'info');
            this.closeModal();
            
            // Dans une vraie implémentation :
            // 1. Lire le fichier Excel
            // 2. Parser les données
            // 3. Ajouter les agents à la base
            // 4. Afficher un résumé
            
        } catch (error) {
            this.showToast(`Erreur d'importation: ${error.message}`, 'error');
        }
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
                
                <div class="feries-list" id="feriesList">
                    <h4>Jours fériés enregistrés</h4>
                    <!-- Liste des jours fériés -->
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="sgaApp.closeModal()">
                    Fermer
                </button>
            </div>
        `);
        
        await this.loadJoursFeries();
    }

    async loadJoursFeries() {
        const list = document.getElementById('feriesList');
        
        try {
            const feries = await this.db.obtenirJoursFeries();
            
            if (feries.length === 0) {
                list.innerHTML += '<p>Aucun jour férié enregistré</p>';
                return;
            }
            
            const feriesHTML = feries.map(ferie => `
                <div class="ferie-item">
                    <span>${ferie.date} - ${ferie.nom}</span>
                    <button class="btn-icon" onclick="sgaApp.supprimerJourFerie('${ferie.date}')" 
                            title="Supprimer">
                        🗑️
                    </button>
                </div>
            `).join('');
            
            list.innerHTML += feriesHTML;
        } catch (error) {
            list.innerHTML += `<p class="error">Erreur: ${error.message}</p>`;
        }
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
            await this.loadJoursFeries();
            this.showToast('Jour férié ajouté', 'success');
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    async supprimerJourFerie(date) {
        if (confirm('Supprimer ce jour férié ?')) {
            try {
                await this.db.supprimerJourFerie(date);
                await this.loadJoursFeries();
                this.showToast('Jour férié supprimé', 'success');
            } catch (error) {
                this.showToast(`Erreur: ${error.message}`, 'error');
            }
        }
    }

    async genererRapportMensuel() {
        const mois = new Date().getMonth() + 1;
        const annee = new Date().getFullYear();
        
        try {
            const agents = await this.db.listerAgents();
            let rapportHTML = `
                <h2>Rapport Mensuel - ${mois}/${annee}</h2>
                <h3>Synthèse générale</h3>
                <p>Date de génération: ${new Date().toLocaleDateString('fr-FR')}</p>
                <p>Total agents: ${agents.length}</p>
                
                <h3>Détail par groupe</h3>
                <table border="1" style="width:100%; border-collapse: collapse;">
                    <tr>
                        <th>Groupe</th>
                        <th>Nombre agents</th>
                        <th>Shifts matin</th>
                        <th>Shifts après-midi</th>
                        <th>Shifts nuit</th>
                        <th>Total opérationnel</th>
                    </tr>
            `;
            
            const groupes = ['A', 'B', 'C', 'D', 'E'];
            
            for (const groupe of groupes) {
                const agentsGroupe = agents.filter(a => a.groupe === groupe);
                let totalMatin = 0;
                let totalApresMidi = 0;
                let totalNuit = 0;
                let totalOperationnel = 0;
                
                for (const agent of agentsGroupe) {
                    const stats = await this.planningEngine.calculerStatsAgent(agent.code, mois, annee);
                    totalMatin += stats.stats['1'];
                    totalApresMidi += stats.stats['2'];
                    totalNuit += stats.stats['3'];
                    totalOperationnel += stats.totalOperationnels;
                }
                
                rapportHTML += `
                    <tr>
                        <td>${groupe}</td>
                        <td>${agentsGroupe.length}</td>
                        <td>${totalMatin}</td>
                        <td>${totalApresMidi}</td>
                        <td>${totalNuit}</td>
                        <td>${totalOperationnel}</td>
                    </tr>
                `;
            }
            
            rapportHTML += `
                </table>
                
                <h3>Absences du mois</h3>
                <p>Congés: ${await this.db.compterAbsencesParType('C', mois, annee)}</p>
                <p>Maladies: ${await this.db.compterAbsencesParType('M', mois, annee)}</p>
                <p>Autres absences: ${await this.db.compterAbsencesParType('A', mois, annee)}</p>
                
                <h3>Radios</h3>
                <p>Radios attribuées: ${(await this.db.obtenirStatsRadios()).attribuees}</p>
                <p>Radios disponibles: ${(await this.db.obtenirStatsRadios()).disponibles}</p>
                
                <footer>
                    <p>Généré par SGA PWA - ${new Date().toLocaleDateString('fr-FR')}</p>
                </footer>
            `;
            
            // Ouvrir dans une nouvelle fenêtre pour impression
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Rapport Mensuel SGA - ${mois}/${annee}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        h2 { color: #333; }
                        footer { margin-top: 50px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    ${rapportHTML}
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
                </html>
            `);
            
            this.showToast('Rapport généré', 'success');
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
    }

    // ========================================
    // FONCTIONS UTILITAIRES
    // ========================================
    showModal(content) {
        const modal = document.getElementById('modalOverlay');
        const modalContent = document.getElementById('modalContent');
        
        modalContent.innerHTML = content;
        modal.classList.add('active');
        
        // Focus sur le premier champ input
        setTimeout(() => {
            const firstInput = modalContent.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    closeModal() {
        const modal = document.getElementById('modalOverlay');
        modal.classList.remove('active');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('sga-theme', this.theme);
        this.applyTheme();
    }

    async syncData() {
        try {
            this.showToast('Synchronisation en cours...', 'info');
            
            // Simuler une synchronisation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            localStorage.setItem('sga-last-sync', new Date().toLocaleString());
            this.updateBaseInfo();
            
            this.showToast('Synchronisation terminée', 'success');
        } catch (error) {
            this.showToast('Erreur de synchronisation', 'error');
        }
    }

    // ========================================
    // FONCTIONS DE FILTRAGE
    // ========================================
    filterAgents() {
        const searchTerm = document.getElementById('searchAgent').value.toLowerCase();
        const rows = document.querySelectorAll('#agentsTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    filterAvertissements() {
        const statutFilter = document.getElementById('filterAvertissementStatut').value;
        const typeFilter = document.getElementById('filterAvertissementType').value;
        const rows = document.querySelectorAll('#avertissementsTableBody tr');
        
        rows.forEach(row => {
            const statut = row.querySelector('.badge').textContent.toLowerCase();
            const type = row.querySelector('td:nth-child(3) .badge').textContent.toLowerCase();
            
            const showStatut = statutFilter === 'tous' || statut === statutFilter;
            const showType = typeFilter === 'tous' || type === typeFilter;
            
            row.style.display = (showStatut && showType) ? '' : 'none';
        });
    }

    filterHabillement() {
        const searchTerm = document.getElementById('searchHabillement').value.toLowerCase();
        const rows = document.querySelectorAll('#habillementTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }
// ========================================
// FONCTIONS D'EXPORT
// ========================================
async exporterAgentsExcel() {
    try {
        await this.exportUtils.exporterAgentsExcel();
        this.showToast('Export réussi', 'success');
    } catch (error) {
        this.showToast(`Erreur: ${error.message}`, 'error');
    }
}

async exporterPlanningExcel() {
    const mois = new Date().getMonth() + 1;
    const annee = new Date().getFullYear();
    
    try {
        await this.exportUtils.exporterPlanningExcel(mois, annee);
        this.showToast('Export réussi', 'success');
    } catch (error) {
        this.showToast(`Erreur: ${error.message}`, 'error');
    }
}

async exporterStatsAgentPDF(code, mois, annee) {
    try {
        await this.exportUtils.exporterStatsAgentPDF(code, mois, annee);
        this.showToast('PDF généré', 'success');
    } catch (error) {
        this.showToast(`Erreur: ${error.message}`, 'error');
    }
}

    // ========================================
    // FONCTIONS CALENDRIER CONGES
    // ========================================
    prevMonthConges() {
        // Navigation mois précédent
        this.showToast('Navigation en développement', 'info');
    }

    nextMonthConges() {
        // Navigation mois suivant
        this.showToast('Navigation en développement', 'info');
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
                    
                    <div class="menu-card" onclick="sgaApp.importerJoursFeries()">
                        <h3><span>📥</span> IMPORTER</h3>
                        <p>Importer depuis fichier</p>
                    </div>
                    
                    <div class="menu-card" onclick="sgaApp.exporterJoursFeries()">
                        <h3><span>📤</span> EXPORTER</h3>
                        <p>Exporter en CSV</p>
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            feries.forEach(ferie => {
                html += `
                    <tr>
                        <td>${ferie.date}</td>
                        <td>${ferie.nom}</td>
                        <td>
                            <button class="btn-icon" onclick="sgaApp.supprimerJourFerie('${ferie.date}')">
                                🗑️
                            </button>
                        </td>
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

    async importerJoursFeries() {
        this.showToast('Importation en développement', 'info');
    }

    async exporterJoursFeries() {
        this.showToast('Export en développement', 'info');
    }

    // ========================================
    // FONCTIONS SYSTEME
    // ========================================
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
                    <span>Synchronisation auto</span>
                    <label class="switch">
                        <input type="checkbox" ${localStorage.getItem('sga-auto-sync') === 'true' ? 'checked' : ''} 
                               onchange="localStorage.setItem('sga-auto-sync', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <span>Notifications</span>
                    <label class="switch">
                        <input type="checkbox" ${localStorage.getItem('sga-notifications') === 'true' ? 'checked' : ''} 
                               onchange="localStorage.setItem('sga-notifications', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <span>Version base: ${localStorage.getItem('sga-db-version') || '1.0'}</span>
                    <button class="btn-small" onclick="sgaApp.mettreAJourBase()">
                        Mettre à jour
                    </button>
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

    async mettreAJourBase() {
        try {
            await this.db.mettreAJourStructure();
            this.showToast('Base mise à jour', 'success');
        } catch (error) {
            this.showToast(`Erreur: ${error.message}`, 'error');
        }
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
}

// Initialiser l'application
let sgaApp;
document.addEventListener('DOMContentLoaded', () => {
    sgaApp = new SGA_App();
});
// Initialisation dans SGA_App
this.exportUtils = new ExportUtils(this.db);
this.exportUtils.setPlanningEngine(this.planningEngine);

// Exemple d'utilisation
async exporterAgentsExcel() {
    try {
        await this.exportUtils.exporterAgentsExcel();
        this.showToast('Export réussi', 'success');
    } catch (error) {
        this.showToast(`Erreur: ${error.message}`, 'error');
    }
}
