// ====================================================
// FICHIER: export-utils.js
// UTILITAIRES D'EXPORT POUR L'APPLICATION SGA PWA
// ====================================================

class ExportUtils {
    constructor(db) {
        this.db = db;
        this.planningEngine = null;
    }

    setPlanningEngine(planningEngine) {
        this.planningEngine = planningEngine;
    }

    // ========================================
    // EXPORT CSV/EXCEL
    // ========================================

    async exporterAgentsCSV() {
        try {
            const agents = await this.db.listerAgents();
            
            // En-têtes CSV
            let csvContent = "Code;Nom;Prénom;Groupe;Date Entrée;Date Sortie;Statut\n";
            
            // Données
            agents.forEach(agent => {
                csvContent += `${agent.code};${agent.nom};${agent.prenom};${agent.groupe};${agent.date_entree || ''};${agent.date_sortie || ''};${agent.statut}\n`;
            });
            
            return this.téléchargerFichier(csvContent, 'agents-sga.csv', 'text/csv');
        } catch (error) {
            throw new Error(`Erreur export agents: ${error.message}`);
        }
    }

    async exporterAgentsExcel() {
        try {
            const agents = await this.db.listerAgents();
            
            // Créer un workbook Excel
            const workbook = this.créerWorkbookExcel();
            const worksheet = XLSX.utils.json_to_sheet(agents.map(agent => ({
                'Code': agent.code,
                'Nom': agent.nom,
                'Prénom': agent.prenom,
                'Groupe': agent.groupe,
                'Date Entrée': agent.date_entree,
                'Date Sortie': agent.date_sortie,
                'Statut': agent.statut
            })));
            
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Agents');
            
            return this.exporterWorkbookExcel(workbook, 'agents-sga.xlsx');
        } catch (error) {
            throw new Error(`Erreur export Excel agents: ${error.message}`);
        }
    }

    async exporterPlanningCSV(mois, annee) {
        try {
            const agents = await this.db.listerAgents();
            const joursDansMois = new Date(annee, mois, 0).getDate();
            
            // En-têtes avec jours
            let csvContent = "Code;Nom;Prénom;Groupe;";
            for (let jour = 1; jour <= joursDansMois; jour++) {
                csvContent += `J${jour};`;
            }
            csvContent += "Total\n";
            
            // Données par agent
            for (const agent of agents) {
                if (agent.statut !== 'actif') continue;
                
                let ligne = `${agent.code};${agent.nom};${agent.prenom};${agent.groupe};`;
                let totalShifts = 0;
                
                for (let jour = 1; jour <= joursDansMois; jour++) {
                    const dateStr = `${annee}-${mois.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;
                    const shift = await this.db.obtenirShift(agent.code, dateStr);
                    ligne += `${shift || '-'};`;
                    if (['1', '2', '3'].includes(shift)) totalShifts++;
                }
                
                ligne += `${totalShifts}\n`;
                csvContent += ligne;
            }
            
            return this.téléchargerFichier(csvContent, `planning-${mois}-${annee}.csv`, 'text/csv');
        } catch (error) {
            throw new Error(`Erreur export planning: ${error.message}`);
        }
    }

    async exporterPlanningExcel(mois, annee) {
        try {
            const agents = await this.db.listerAgents();
            const joursDansMois = new Date(annee, mois, 0).getDate();
            
            const workbook = this.créerWorkbookExcel();
            const worksheet = XLSX.utils.aoa_to_sheet([]);
            
            // En-têtes
            const headers = ['Code', 'Nom', 'Prénom', 'Groupe'];
            for (let jour = 1; jour <= joursDansMois; jour++) {
                headers.push(`J${jour}`);
            }
            headers.push('Total');
            
            XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
            
            // Données
            let rowIndex = 2;
            for (const agent of agents) {
                if (agent.statut !== 'actif') continue;
                
                const row = [
                    agent.code,
                    agent.nom,
                    agent.prenom,
                    agent.groupe
                ];
                
                let totalShifts = 0;
                
                for (let jour = 1; jour <= joursDansMois; jour++) {
                    const dateStr = `${annee}-${mois.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;
                    const shift = await this.db.obtenirShift(agent.code, dateStr);
                    row.push(shift || '-');
                    if (['1', '2', '3'].includes(shift)) totalShifts++;
                }
                
                row.push(totalShifts);
                XLSX.utils.sheet_add_aoa(worksheet, [row], { origin: `A${rowIndex}` });
                rowIndex++;
            }
            
            // Mise en forme
            this.appliquerStylePlanning(worksheet, joursDansMois);
            
            XLSX.utils.book_append_sheet(workbook, worksheet, `Planning ${mois}-${annee}`);
            
            return this.exporterWorkbookExcel(workbook, `planning-${mois}-${annee}.xlsx`);
        } catch (error) {
            throw new Error(`Erreur export Excel planning: ${error.message}`);
        }
    }

    async exporterStatsAgentExcel(code, mois, annee) {
        try {
            const agent = await this.db.obtenirAgent(code);
            if (!agent) throw new Error('Agent non trouvé');
            
            const stats = await this.planningEngine.calculerStatsAgent(code, mois, annee);
            const planning = await this.planningEngine.genererPlanningTheorique(code, mois, annee);
            
            const workbook = this.créerWorkbookExcel();
            
            // Feuille 1: Statistiques
            const statsSheet = XLSX.utils.json_to_sheet([
                { 'Catégorie': 'Agent', 'Valeur': `${agent.code} - ${agent.nom} ${agent.prenom}` },
                { 'Catégorie': 'Groupe', 'Valeur': agent.groupe },
                { 'Catégorie': 'Période', 'Valeur': `${mois}/${annee}` },
                { 'Catégorie': 'Shifts Matin (1)', 'Valeur': stats.stats['1'] || 0 },
                { 'Catégorie': 'Shifts Après-midi (2)', 'Valeur': stats.stats['2'] || 0 },
                { 'Catégorie': 'Shifts Nuit (3)', 'Valeur': stats.stats['3'] || 0 },
                { 'Catégorie': 'Repos (R)', 'Valeur': stats.stats['R'] || 0 },
                { 'Catégorie': 'Congés (C)', 'Valeur': stats.stats['C'] || 0 },
                { 'Catégorie': 'Maladie (M)', 'Valeur': stats.stats['M'] || 0 },
                { 'Catégorie': 'Autre Absence (A)', 'Valeur': stats.stats['A'] || 0 },
                { 'Catégorie': 'Fériés travaillés', 'Valeur': stats.joursFeriesTravailles || 0 },
                { 'Catégorie': 'TOTAL Jours', 'Valeur': stats.totalJours },
                { 'Catégorie': 'TOTAL Travaillés', 'Valeur': stats.totalJoursTravailles },
                { 'Catégorie': 'TOTAL Opérationnels', 'Valeur': stats.totalOperationnels },
                { 'Catégorie': 'Taux Présence', 'Valeur': `${((stats.totalJoursTravailles / stats.totalJours) * 100).toFixed(1)}%` }
            ]);
            
            XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques');
            
            // Feuille 2: Planning détaillé
            const planningData = planning.map(jour => ({
                'Date': `${jour.jour}/${mois}/${annee}`,
                'Jour': jour.jour_semaine,
                'Shift': jour.shift,
                'Type': this.getTypeShift(jour.shift),
                'Férié': jour.ferie ? 'Oui' : 'Non',
                'Dimanche': jour.est_dimanche ? 'Oui' : 'Non'
            }));
            
            const planningSheet = XLSX.utils.json_to_sheet(planningData);
            XLSX.utils.book_append_sheet(workbook, planningSheet, 'Planning Détail');
            
            // Feuille 3: Résumé par type
            const resumeData = [
                { 'Type': 'Matin (1)', 'Nombre': stats.stats['1'] || 0 },
                { 'Type': 'Après-midi (2)', 'Nombre': stats.stats['2'] || 0 },
                { 'Type': 'Nuit (3)', 'Nombre': stats.stats['3'] || 0 },
                { 'Type': 'Repos (R)', 'Nombre': stats.stats['R'] || 0 },
                { 'Type': 'Congés (C)', 'Nombre': stats.stats['C'] || 0 },
                { 'Type': 'Maladie (M)', 'Nombre': stats.stats['M'] || 0 },
                { 'Type': 'Autre Absence (A)', 'Nombre': stats.stats['A'] || 0 }
            ];
            
            const resumeSheet = XLSX.utils.json_to_sheet(resumeData);
            XLSX.utils.book_append_sheet(workbook, resumeSheet, 'Résumé');
            
            return this.exporterWorkbookExcel(workbook, `stats-${code}-${mois}-${annee}.xlsx`);
        } catch (error) {
            throw new Error(`Erreur export stats agent: ${error.message}`);
        }
    }

    async exporterStatsGroupeExcel(groupe, mois, annee) {
        try {
            const agents = await this.db.obtenirAgentsParGroupe(groupe);
            const agentsActifs = agents.filter(a => a.statut === 'actif');
            
            const workbook = this.créerWorkbookExcel();
            
            // Feuille 1: Liste des agents
            const agentsData = agentsActifs.map(agent => ({
                'Code': agent.code,
                'Nom': agent.nom,
                'Prénom': agent.prenom,
                'Date Entrée': agent.date_entree,
                'Statut': agent.statut
            }));
            
            const agentsSheet = XLSX.utils.json_to_sheet(agentsData);
            XLSX.utils.book_append_sheet(workbook, agentsSheet, 'Agents');
            
            // Feuille 2: Statistiques par agent
            const statsData = [];
            let totalShifts1 = 0;
            let totalShifts2 = 0;
            let totalShifts3 = 0;
            let totalOperationnels = 0;
            
            for (const agent of agentsActifs) {
                const stats = await this.planningEngine.calculerStatsAgent(agent.code, mois, annee);
                
                totalShifts1 += stats.stats['1'] || 0;
                totalShifts2 += stats.stats['2'] || 0;
                totalShifts3 += stats.stats['3'] || 0;
                totalOperationnels += stats.totalOperationnels;
                
                statsData.push({
                    'Code': agent.code,
                    'Nom': `${agent.nom} ${agent.prenom}`,
                    'Matin (1)': stats.stats['1'] || 0,
                    'Après-midi (2)': stats.stats['2'] || 0,
                    'Nuit (3)': stats.stats['3'] || 0,
                    'Total Opérationnel': stats.totalOperationnels,
                    'Congés (C)': stats.stats['C'] || 0,
                    'Maladie (M)': stats.stats['M'] || 0,
                    'Absences (A)': stats.stats['A'] || 0,
                    'Taux Présence': `${((stats.totalJoursTravailles / stats.totalJours) * 100).toFixed(1)}%`
                });
            }
            
            const statsSheet = XLSX.utils.json_to_sheet(statsData);
            XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques');
            
            // Feuille 3: Résumé du groupe
            const resumeData = [
                { 'Description': 'Nombre d\'agents', 'Valeur': agentsActifs.length },
                { 'Description': 'Total Shifts Matin', 'Valeur': totalShifts1 },
                { 'Description': 'Total Shifts Après-midi', 'Valeur': totalShifts2 },
                { 'Description': 'Total Shifts Nuit', 'Valeur': totalShifts3 },
                { 'Description': 'Total Shifts Opérationnels', 'Valeur': totalOperationnels },
                { 'Description': 'Moyenne par agent', 'Valeur': (totalOperationnels / agentsActifs.length).toFixed(1) },
                { 'Description': 'Période', 'Valeur': `${mois}/${annee}` }
            ];
            
            const resumeSheet = XLSX.utils.json_to_sheet(resumeData);
            XLSX.utils.book_append_sheet(workbook, resumeSheet, 'Résumé Groupe');
            
            return this.exporterWorkbookExcel(workbook, `stats-groupe-${groupe}-${mois}-${annee}.xlsx`);
        } catch (error) {
            throw new Error(`Erreur export stats groupe: ${error.message}`);
        }
    }

    async exporterRadiosCSV() {
        try {
            const radios = await this.db.obtenirRadios();
            
            let csvContent = "Numéro;Statut;Agent;Date Attribution;Date Retour;Remarques\n";
            
            radios.forEach(radio => {
                csvContent += `${radio.numero};${radio.statut};${radio.agent_nom || ''};${radio.date_attribution || ''};${radio.date_retour || ''};${radio.remarques || ''}\n`;
            });
            
            return this.téléchargerFichier(csvContent, 'radios-sga.csv', 'text/csv');
        } catch (error) {
            throw new Error(`Erreur export radios: ${error.message}`);
        }
    }

    async exporterAvertissementsCSV() {
        try {
            const avertissements = await this.db.obtenirAvertissements();
            
            let csvContent = "Date;Code Agent;Nom Agent;Type;Motif;Sanction;Statut;Date Résolution\n";
            
            avertissements.forEach(avert => {
                csvContent += `${avert.date};${avert.agent_code};${avert.agent_nom};${avert.type};${avert.motif};${avert.sanction || ''};${avert.statut};${avert.date_resolution || ''}\n`;
            });
            
            return this.téléchargerFichier(csvContent, 'avertissements-sga.csv', 'text/csv');
        } catch (error) {
            throw new Error(`Erreur export avertissements: ${error.message}`);
        }
    }

    async exporterCongesCSV(mois, annee) {
        try {
            const conges = await this.db.obtenirCongesMois(mois, annee);
            
            let csvContent = "Code Agent;Nom;Type;Date Début;Date Fin;Statut;Motif\n";
            
            conges.forEach(conge => {
                csvContent += `${conge.agent_code};${conge.agent_nom};${conge.type};${conge.date_debut};${conge.date_fin};${conge.statut};${conge.motif || ''}\n`;
            });
            
            return this.téléchargerFichier(csvContent, `conges-${mois}-${annee}.csv`, 'text/csv');
        } catch (error) {
            throw new Error(`Erreur export congés: ${error.message}`);
        }
    }

    async exporterHabillementCSV() {
        try {
            const commandes = await this.db.obtenirCommandesHabillement();
            
            let csvContent = "Code Agent;Nom;Type Uniforme;Taille;Quantité;Date Commande;Date Livraison;Statut;Remarques\n";
            
            commandes.forEach(commande => {
                csvContent += `${commande.agent_code};${commande.agent_nom};${commande.type_uniforme};${commande.taille};${commande.quantite};${commande.date_commande || ''};${commande.date_livraison || ''};${commande.statut};${commande.remarques || ''}\n`;
            });
            
            return this.téléchargerFichier(csvContent, 'habillement-sga.csv', 'text/csv');
        } catch (error) {
            throw new Error(`Erreur export habillement: ${error.message}`);
        }
    }

    // ========================================
    // EXPORT PDF
    // ========================================

    async exporterStatsAgentPDF(code, mois, annee) {
        try {
            const agent = await this.db.obtenirAgent(code);
            if (!agent) throw new Error('Agent non trouvé');
            
            const stats = await this.planningEngine.calculerStatsAgent(code, mois, annee);
            
            const html = this.générerHTMLStatsAgent(agent, stats, mois, annee);
            return this.exporterPDF(html, `stats-${code}-${mois}-${annee}.pdf`);
        } catch (error) {
            throw new Error(`Erreur export PDF stats agent: ${error.message}`);
        }
    }

    async exporterPlanningAgentPDF(code, mois, annee) {
        try {
            const agent = await this.db.obtenirAgent(code);
            if (!agent) throw new Error('Agent non trouvé');
            
            const planning = await this.planningEngine.genererPlanningTheorique(code, mois, annee);
            
            const html = this.générerHTMLPlanningAgent(agent, planning, mois, annee);
            return this.exporterPDF(html, `planning-${code}-${mois}-${annee}.pdf`);
        } catch (error) {
            throw new Error(`Erreur export PDF planning agent: ${error.message}`);
        }
    }

    async exporterStatsGroupePDF(groupe, mois, annee) {
        try {
            const agents = await this.db.obtenirAgentsParGroupe(groupe);
            const agentsActifs = agents.filter(a => a.statut === 'actif');
            
            // Calculer les stats du groupe
            const statsGroupe = {
                totalAgents: agentsActifs.length,
                totalShifts1: 0,
                totalShifts2: 0,
                totalShifts3: 0,
                totalOperationnels: 0,
                totalConges: 0,
                totalMaladie: 0,
                totalAbsences: 0
            };
            
            const agentsStats = [];
            
            for (const agent of agentsActifs) {
                const stats = await this.planningEngine.calculerStatsAgent(agent.code, mois, annee);
                
                statsGroupe.totalShifts1 += stats.stats['1'] || 0;
                statsGroupe.totalShifts2 += stats.stats['2'] || 0;
                statsGroupe.totalShifts3 += stats.stats['3'] || 0;
                statsGroupe.totalOperationnels += stats.totalOperationnels;
                statsGroupe.totalConges += stats.stats['C'] || 0;
                statsGroupe.totalMaladie += stats.stats['M'] || 0;
                statsGroupe.totalAbsences += stats.stats['A'] || 0;
                
                agentsStats.push({
                    code: agent.code,
                    nom: `${agent.nom} ${agent.prenom}`,
                    shifts1: stats.stats['1'] || 0,
                    shifts2: stats.stats['2'] || 0,
                    shifts3: stats.stats['3'] || 0,
                    total: stats.totalOperationnels,
                    taux: ((stats.totalJoursTravailles / stats.totalJours) * 100).toFixed(1)
                });
            }
            
            // Trier par total décroissant
            agentsStats.sort((a, b) => b.total - a.total);
            
            const html = this.générerHTMLStatsGroupe(groupe, statsGroupe, agentsStats, mois, annee);
            return this.exporterPDF(html, `stats-groupe-${groupe}-${mois}-${annee}.pdf`);
        } catch (error) {
            throw new Error(`Erreur export PDF stats groupe: ${error.message}`);
        }
    }

    async exporterRapportMensuelPDF(mois, annee) {
        try {
            const agents = await this.db.listerAgents();
            const agentsActifs = agents.filter(a => a.statut === 'actif');
            
            // Statistiques globales
            const statsGlobales = {
                totalAgents: agentsActifs.length,
                totalShifts: 0,
                totalConges: 0,
                totalMaladie: 0,
                totalAbsences: 0,
                radiosAttribuees: 0,
                radiosDisponibles: 0
            };
            
            // Stats par groupe
            const statsGroupes = {};
            const groupes = ['A', 'B', 'C', 'D', 'E'];
            
            groupes.forEach(groupe => {
                statsGroupes[groupe] = {
                    totalAgents: 0,
                    totalShifts: 0,
                    tauxPresence: 0
                };
            });
            
            // Calculer les stats
            for (const agent of agentsActifs) {
                const stats = await this.planningEngine.calculerStatsAgent(agent.code, mois, annee);
                
                statsGlobales.totalShifts += stats.totalOperationnels;
                statsGlobales.totalConges += stats.stats['C'] || 0;
                statsGlobales.totalMaladie += stats.stats['M'] || 0;
                statsGlobales.totalAbsences += stats.stats['A'] || 0;
                
                if (statsGroupes[agent.groupe]) {
                    statsGroupes[agent.groupe].totalAgents++;
                    statsGroupes[agent.groupe].totalShifts += stats.totalOperationnels;
                }
            }
            
            // Stats radios
            const statsRadios = await this.db.obtenirStatsRadios();
            statsGlobales.radiosAttribuees = statsRadios.attribuees || 0;
            statsGlobales.radiosDisponibles = statsRadios.disponibles || 0;
            
            // Calculer les taux de présence par groupe
            for (const groupe of groupes) {
                if (statsGroupes[groupe].totalAgents > 0) {
                    const agentsGroupe = agentsActifs.filter(a => a.groupe === groupe);
                    let totalJoursTravailles = 0;
                    let totalJours = 0;
                    
                    for (const agent of agentsGroupe) {
                        const stats = await this.planningEngine.calculerStatsAgent(agent.code, mois, annee);
                        totalJoursTravailles += stats.totalJoursTravailles;
                        totalJours += stats.totalJours;
                    }
                    
                    statsGroupes[groupe].tauxPresence = totalJours > 0 ? 
                        (totalJoursTravailles / totalJours * 100).toFixed(1) : 0;
                }
            }
            
            const html = this.générerHTMLRapportMensuel(statsGlobales, statsGroupes, mois, annee);
            return this.exporterPDF(html, `rapport-mensuel-${mois}-${annee}.pdf`);
        } catch (error) {
            throw new Error(`Erreur export PDF rapport mensuel: ${error.message}`);
        }
    }

    // ========================================
    // FONCTIONS D'ASSISTANCE
    // ========================================

    créerWorkbookExcel() {
        const workbook = XLSX.utils.book_new();
        workbook.Props = {
            Title: "SGA - Système de Gestion des Agents",
            Subject: "Export de données",
            Author: "SGA PWA",
            CreatedDate: new Date()
        };
        return workbook;
    }

    exporterWorkbookExcel(workbook, filename) {
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        return this.téléchargerFichier(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    appliquerStylePlanning(worksheet, joursDansMois) {
        // Définir les largeurs de colonnes
        const colWidths = [
            { wch: 10 }, // Code
            { wch: 15 }, // Nom
            { wch: 15 }, // Prénom
            { wch: 8 }   // Groupe
        ];
        
        for (let i = 0; i < joursDansMois; i++) {
            colWidths.push({ wch: 5 }); // Jours
        }
        
        colWidths.push({ wch: 8 }); // Total
        
        worksheet['!cols'] = colWidths;
        
        // Ajouter un style aux en-têtes
        const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[cellAddress]) continue;
            
            worksheet[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
    }

    getTypeShift(shift) {
        const types = {
            '1': 'Matin',
            '2': 'Après-midi',
            '3': 'Nuit',
            'R': 'Repos',
            'C': 'Congé',
            'M': 'Maladie',
            'A': 'Absence',
            '-': 'Non planifié'
        };
        return types[shift] || shift;
    }

    téléchargerFichier(content, filename, mimeType) {
        // Créer un blob si ce n'est pas déjà un blob
        const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
        
        // Créer un lien de téléchargement
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Libérer l'URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        return true;
    }

    exporterPDF(html, filename) {
        // Ouvrir une nouvelle fenêtre pour l'impression
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${filename.replace('.pdf', '')}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #333; margin-bottom: 5px; }
                    .header .subtitle { color: #666; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .total-row { background-color: #f9f9f9; font-weight: bold; }
                    .stat-card { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; min-width: 100px; }
                    .stat-value { font-size: 24px; font-weight: bold; }
                    .stat-label { font-size: 12px; color: #666; }
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
                    @media print {
                        .no-print { display: none; }
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                ${html}
                <div class="footer">
                    <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} par SGA PWA</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        return true;
    }

    // ========================================
    // GÉNÉRATION HTML POUR PDF
    // ========================================

    générerHTMLStatsAgent(agent, stats, mois, annee) {
        const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        return `
            <div class="header">
                <h1>STATISTIQUES AGENT</h1>
                <div class="subtitle">
                    ${agent.code} - ${agent.nom} ${agent.prenom}<br>
                    Groupe: ${agent.groupe} | Période: ${moisNoms[mois-1]} ${annee}
                </div>
            </div>
            
            <div style="text-align: center;">
                <div class="stat-card" style="background-color: #e3f2fd;">
                    <div class="stat-value">${stats.totalJoursTravailles}</div>
                    <div class="stat-label">Jours Travaillés</div>
                </div>
                <div class="stat-card" style="background-color: #f3e5f5;">
                    <div class="stat-value">${stats.totalOperationnels}</div>
                    <div class="stat-label">Shifts Opérationnels</div>
                </div>
                <div class="stat-card" style="background-color: #e8f5e8;">
                    <div class="stat-value">${((stats.totalJoursTravailles / stats.totalJours) * 100).toFixed(1)}%</div>
                    <div class="stat-label">Taux Présence</div>
                </div>
            </div>
            
            <h3>Répartition détaillée</h3>
            <table>
                <thead>
                    <tr>
                        <th>Type de Shift</th>
                        <th>Nombre</th>
                        <th>Pourcentage</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Shifts Matin (1)</td>
                        <td>${stats.stats['1'] || 0}</td>
                        <td>${((stats.stats['1'] || 0) / stats.totalJours * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Shifts Après-midi (2)</td>
                        <td>${stats.stats['2'] || 0}</td>
                        <td>${((stats.stats['2'] || 0) / stats.totalJours * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Shifts Nuit (3)</td>
                        <td>${stats.stats['3'] || 0}</td>
                        <td>${((stats.stats['3'] || 0) / stats.totalJours * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Jours Repos (R)</td>
                        <td>${stats.stats['R'] || 0}</td>
                        <td>${((stats.stats['R'] || 0) / stats.totalJours * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Congés (C)</td>
                        <td>${stats.stats['C'] || 0}</td>
                        <td>${((stats.stats['C'] || 0) / stats.totalJours * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Maladie (M)</td>
                        <td>${stats.stats['M'] || 0}</td>
                        <td>${((stats.stats['M'] || 0) / stats.totalJours * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Autre Absence (A)</td>
                        <td>${stats.stats['A'] || 0}</td>
                        <td>${((stats.stats['A'] || 0) / stats.totalJours * 100).toFixed(1)}%</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>TOTAL JOURS</strong></td>
                        <td><strong>${stats.totalJours}</strong></td>
                        <td><strong>100%</strong></td>
                    </tr>
                </tbody>
            </table>
            
            <h3>Résumé</h3>
            <p><strong>Jours fériés travaillés:</strong> ${stats.joursFeriesTravailles || 0}</p>
            <p><strong>Jours non planifiés:</strong> ${stats.stats['-'] || 0}</p>
            <p><strong>Taux d'absence:</strong> ${((stats.stats['C'] + stats.stats['M'] + stats.stats['A']) / stats.totalJours * 100).toFixed(1)}%</p>
        `;
    }

    générerHTMLPlanningAgent(agent, planning, mois, annee) {
        const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        let html = `
            <div class="header">
                <h1>PLANNING AGENT</h1>
                <div class="subtitle">
                    ${agent.code} - ${agent.nom} ${agent.prenom}<br>
                    Groupe: ${agent.groupe} | Période: ${moisNoms[mois-1]} ${annee}
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Jour</th>
                        <th>Shift</th>
                        <th>Type</th>
                        <th>Remarques</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        planning.forEach(jour => {
            const date = new Date(annee, mois - 1, jour.jour);
            const dateStr = date.toLocaleDateString('fr-FR');
            
            let remarques = '';
            if (jour.ferie) remarques += '🎯 Férié ';
            if (jour.est_dimanche) remarques += '📅 Dimanche ';
            
            html += `
                <tr>
                    <td>${dateStr}</td>
                    <td>${jour.jour_semaine}</td>
                    <td><strong>${jour.shift}</strong></td>
                    <td>${this.getTypeShift(jour.shift)}</td>
                    <td>${remarques}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            
            <h3>Récapitulatif</h3>
            <div style="display: flex; justify-content: space-around; margin: 20px 0;">
        `;
        
        const stats = {};
        planning.forEach(jour => {
            stats[jour.shift] = (stats[jour.shift] || 0) + 1;
        });
        
        const shiftTypes = ['1', '2', '3', 'R', 'C', 'M', 'A'];
        const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e8', '#fff3e0', '#fce4ec', '#f1f8e9', '#fff8e1'];
        
        shiftTypes.forEach((shift, index) => {
            if (stats[shift]) {
                html += `
                    <div class="stat-card" style="background-color: ${colors[index % colors.length]}">
                        <div class="stat-value">${stats[shift]}</div>
                        <div class="stat-label">${this.getTypeShift(shift)}</div>
                    </div>
                `;
            }
        });
        
        html += `
            </div>
        `;
        
        return html;
    }

    générerHTMLStatsGroupe(groupe, statsGroupe, agentsStats, mois, annee) {
        const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        let html = `
            <div class="header">
                <h1>STATISTIQUES GROUPE ${groupe}</h1>
                <div class="subtitle">
                    Période: ${moisNoms[mois-1]} ${annee}<br>
                    Effectif: ${statsGroupe.totalAgents} agents actifs
                </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <div class="stat-card" style="background-color: #e3f2fd;">
                    <div class="stat-value">${statsGroupe.totalShifts1}</div>
                    <div class="stat-label">Shifts Matin</div>
                </div>
                <div class="stat-card" style="background-color: #f3e5f5;">
                    <div class="stat-value">${statsGroupe.totalShifts2}</div>
                    <div class="stat-label">Shifts Après-midi</div>
                </div>
                <div class="stat-card" style="background-color: #e8f5e8;">
                    <div class="stat-value">${statsGroupe.totalShifts3}</div>
                    <div class="stat-label">Shifts Nuit</div>
                </div>
                <div class="stat-card" style="background-color: #fff3e0;">
                    <div class="stat-value">${statsGroupe.totalOperationnels}</div>
                    <div class="stat-label">Total Opérationnel</div>
                </div>
            </div>
            
            <h3>Classement des agents</h3>
            <table>
                <thead>
                    <tr>
                        <th>Rang</th>
                        <th>Code</th>
                        <th>Nom</th>
                        <th>Matin</th>
                        <th>Après-midi</th>
                        <th>Nuit</th>
                        <th>Total</th>
                        <th>Taux Présence</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        agentsStats.forEach((agent, index) => {
            let rang = index + 1;
            let rangIcon = '';
            
            if (rang === 1) rangIcon = '🥇 ';
            else if (rang === 2) rangIcon = '🥈 ';
            else if (rang === 3) rangIcon = '🥉 ';
            
            html += `
                <tr>
                    <td>${rangIcon}${rang}</td>
                    <td><strong>${agent.code}</strong></td>
                    <td>${agent.nom}</td>
                    <td>${agent.shifts1}</td>
                    <td>${agent.shifts2}</td>
                    <td>${agent.shifts3}</td>
                    <td><strong>${agent.total}</strong></td>
                    <td>${agent.taux}%</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            
            <h3>Synthèse du groupe</h3>
            <table>
                <tr>
                    <td><strong>Moyenne shifts par agent:</strong></td>
                    <td>${(statsGroupe.totalOperationnels / statsGroupe.totalAgents).toFixed(1)}</td>
                </tr>
                <tr>
                    <td><strong>Total congés:</strong></td>
                    <td>${statsGroupe.totalConges}</td>
                </tr>
                <tr>
                    <td><strong>Total maladie:</strong></td>
                    <td>${statsGroupe.totalMaladie}</td>
                </tr>
                <tr>
                    <td><strong>Total absences:</strong></td>
                    <td>${statsGroupe.totalAbsences}</td>
                </tr>
                <tr>
                    <td><strong>Taux d'absence:</strong></td>
                    <td>${((statsGroupe.totalConges + statsGroupe.totalMaladie + statsGroupe.totalAbsences) / (statsGroupe.totalAgents * 30) * 100).toFixed(1)}%</td>
                </tr>
            </table>
        `;
        
        return html;
    }

    générerHTMLRapportMensuel(statsGlobales, statsGroupes, mois, annee) {
        const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        let html = `
            <div class="header">
                <h1>RAPPORT MENSUEL SGA</h1>
                <div class="subtitle">
                    ${moisNoms[mois-1]} ${annee}<br>
                    Généré le ${new Date().toLocaleDateString('fr-FR')}
                </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <div class="stat-card" style="background-color: #e3f2fd;">
                    <div class="stat-value">${statsGlobales.totalAgents}</div>
                    <div class="stat-label">Agents Actifs</div>
                </div>
                <div class="stat-card" style="background-color: #f3e5f5;">
                    <div class="stat-value">${statsGlobales.totalShifts}</div>
                    <div class="stat-label">Shifts Totaux</div>
                </div>
                <div class="stat-card" style="background-color: #e8f5e8;">
                    <div class="stat-value">${statsGlobales.radiosAttribuees}</div>
                    <div class="stat-label">Radios Attribuées</div>
                </div>
                <div class="stat-card" style="background-color: #fff3e0;">
                    <div class="stat-value">${statsGlobales.radiosDisponibles}</div>
                    <div class="stat-label">Radios Disponibles</div>
                </div>
            </div>
            
            <h3>Performance par groupe</h3>
            <table>
                <thead>
                    <tr>
                        <th>Groupe</th>
                        <th>Agents</th>
                        <th>Shifts Totaux</th>
                        <th>Moyenne par Agent</th>
                        <th>Taux Présence</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (const [groupe, stats] of Object.entries(statsGroupes)) {
            if (stats.totalAgents > 0) {
                html += `
                    <tr>
                        <td><strong>Groupe ${groupe}</strong></td>
                        <td>${stats.totalAgents}</td>
                        <td>${stats.totalShifts}</td>
                        <td>${(stats.totalShifts / stats.totalAgents).toFixed(1)}</td>
                        <td>${stats.tauxPresence}%</td>
                    </tr>
                `;
            }
        }
        
        html += `
                </tbody>
            </table>
            
            <h3>Absences du mois</h3>
            <table>
                <tr>
                    <td><strong>Congés:</strong></td>
                    <td>${statsGlobales.totalConges} jours</td>
                </tr>
                <tr>
                    <td><strong>Maladie:</strong></td>
                    <td>${statsGlobales.totalMaladie} jours</td>
                </tr>
                <tr>
                    <td><strong>Autres absences:</strong></td>
                    <td>${statsGlobales.totalAbsences} jours</td>
                </tr>
                <tr>
                    <td><strong>TOTAL Absences:</strong></td>
                    <td>${statsGlobales.totalConges + statsGlobales.totalMaladie + statsGlobales.totalAbsences} jours</td>
                </tr>
            </table>
            
            <h3>Recommandations</h3>
            <ul>
                <li>${statsGlobales.totalConges > 50 ? '⚠️ Nombre élevé de congés ce mois-ci' : '✓ Nombre de congés dans la norme'}</li>
                <li>${statsGlobales.totalMaladie > 20 ? '⚠️ Taux de maladie anormalement élevé' : '✓ Taux de maladie normal'}</li>
                <li>${statsGlobales.radiosDisponibles < 5 ? '⚠️ Stock de radios faible' : '✓ Stock de radios suffisant'}</li>
                <li>${statsGlobales.totalAgents < 50 ? '⚠️ Effectif en dessous des prévisions' : '✓ Effectif conforme'}</li>
            </ul>
        `;
        
        return html;
    }

    // ========================================
    // EXPORT POUR IMPRESSION
    // ========================================

    async imprimerPlanningAgent(code, mois, annee) {
        try {
            const agent = await this.db.obtenirAgent(code);
            if (!agent) throw new Error('Agent non trouvé');
            
            const planning = await this.planningEngine.genererPlanningTheorique(code, mois, annee);
            
            const html = this.générerHTMLPlanningAgent(agent, planning, mois, annee);
            this.imprimerHTML(html);
            
            return true;
        } catch (error) {
            throw new Error(`Erreur impression planning: ${error.message}`);
        }
    }

    imprimerHTML(html) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Impression SGA</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    @media print {
                        @page { margin: 0.5cm; }
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                ${html}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    // ========================================
    // EXPORT JSON (SAUVEGARDE)
    // ========================================

    async exporterSauvegardeJSON() {
        try {
            const sauvegarde = {
                version: '1.0',
                date: new Date().toISOString(),
                agents: await this.db.listerAgents(),
                radios: await this.db.obtenirRadios(),
                conges: await this.db.obtenirTousConges(),
                avertissements: await this.db.obtenirAvertissements(),
                habillement: await this.db.obtenirCommandesHabillement(),
                joursFeries: await this.db.obtenirJoursFeries(),
                codesPanique: await this.db.obtenirCodesPanique(),
                planning: await this.db.obtenirTousShifts()
            };
            
            const jsonStr = JSON.stringify(sauvegarde, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            
            return this.téléchargerFichier(blob, `sauvegarde-sga-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        } catch (error) {
            throw new Error(`Erreur export sauvegarde: ${error.message}`);
        }
    }

    // ========================================
    // UTILITAIRE DE RAPPORT
    // ========================================

    async générerRapportComplet(mois, annee) {
        try {
            // Générer plusieurs rapports en une seule fois
            const rapports = {
                statistiques: await this.générerRapportStatistiques(mois, annee),
                planning: await this.générerRapportPlanning(mois, annee),
                radios: await this.générerRapportRadios(),
                conges: await this.générerRapportConges(mois, annee),
                recommandations: await this.générerRecommandations(mois, annee)
            };
            
            return rapports;
        } catch (error) {
            throw new Error(`Erreur génération rapport complet: ${error.message}`);
        }
    }

    async générerRapportStatistiques(mois, annee) {
        const agents = await this.db.listerAgents();
        const agentsActifs = agents.filter(a => a.statut === 'actif');
        
        let rapport = {
            totalAgents: agentsActifs.length,
            parGroupe: {},
            tauxPresenceMoyen: 0,
            shiftsTotaux: 0
        };
        
        const groupes = ['A', 'B', 'C', 'D', 'E'];
        
        for (const groupe of groupes) {
            const agentsGroupe = agentsActifs.filter(a => a.groupe === groupe);
            let totalShifts = 0;
            let totalJoursTravailles = 0;
            let totalJours = 0;
            
            for (const agent of agentsGroupe) {
                const stats = await this.planningEngine.calculerStatsAgent(agent.code, mois, annee);
                totalShifts += stats.totalOperationnels;
                totalJoursTravailles += stats.totalJoursTravailles;
                totalJours += stats.totalJours;
            }
            
            rapport.parGroupe[groupe] = {
                agents: agentsGroupe.length,
                shifts: totalShifts,
                moyenne: agentsGroupe.length > 0 ? (totalShifts / agentsGroupe.length).toFixed(1) : 0,
                tauxPresence: totalJours > 0 ? (totalJoursTravailles / totalJours * 100).toFixed(1) : 0
            };
            
            rapport.shiftsTotaux += totalShifts;
            rapport.tauxPresenceMoyen += parseFloat(rapport.parGroupe[groupe].tauxPresence || 0);
        }
        
        rapport.tauxPresenceMoyen = (rapport.tauxPresenceMoyen / groupes.length).toFixed(1);
        
        return rapport;
    }

    async générerRapportPlanning(mois, annee) {
        const agents = await this.db.listerAgents();
        const agentsActifs = agents.filter(a => a.statut === 'actif');
        const joursDansMois = new Date(annee, mois, 0).getDate();
        
        let rapport = {
            couvertureParJour: {},
            agentsDisponiblesMoyen: 0
        };
        
        // Calculer la couverture par jour
        let totalAgentsDisponibles = 0;
        
        for (let jour = 1; jour <= joursDansMois; jour++) {
            const dateStr = `${annee}-${mois.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;
            let agentsDisponibles = 0;
            
            for (const agent of agentsActifs) {
                const shift = await this.db.obtenirShift(agent.code, dateStr);
                if (['1', '2', '3'].includes(shift)) {
                    agentsDisponibles++;
                }
            }
            
            rapport.couvertureParJour[jour] = agentsDisponibles;
            totalAgentsDisponibles += agentsDisponibles;
        }
        
        rapport.agentsDisponiblesMoyen = (totalAgentsDisponibles / joursDansMois).toFixed(1);
        rapport.joursSousEffectif = Object.values(rapport.couvertureParJour).filter(v => v < 10).length;
        
        return rapport;
    }

    async générerRapportRadios() {
        const stats = await this.db.obtenirStatsRadios();
        const radios = await this.db.obtenirRadios();
        
        return {
            total: stats.total,
            attribuees: stats.attribuees,
            disponibles: stats.disponibles,
            enPanne: stats.en_panne,
            tauxAttribution: (stats.attribuees / stats.total * 100).toFixed(1) + '%',
            radiosSansRetour: radios.filter(r => r.statut === 'attribuee' && r.date_attribution && 
                new Date(r.date_attribution) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
        };
    }

    async générerRapportConges(mois, annee) {
        const conges = await this.db.obtenirCongesMois(mois, annee);
        
        return {
            total: conges.length,
            parType: conges.reduce((acc, conge) => {
                acc[conge.type] = (acc[conge.type] || 0) + 1;
                return acc;
            }, {}),
            agentsEnConge: [...new Set(conges.map(c => c.agent_code))].length,
            joursCongeTotaux: conges.reduce((acc, conge) => {
                const dateDebut = new Date(conge.date_debut);
                const dateFin = new Date(conge.date_fin);
                const diffTime = Math.abs(dateFin - dateDebut);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                return acc + diffDays;
            }, 0)
        };
    }

    async générerRecommandations(mois, annee) {
        const recommandations = [];
        
        // Rapport statistiques
        const stats = await this.générerRapportStatistiques(mois, annee);
        const planning = await this.générerRapportPlanning(mois, annee);
        const radios = await this.générerRapportRadios();
        const conges = await this.générerRapportConges(mois, annee);
        
        // Vérifier le taux de présence
        if (parseFloat(stats.tauxPresenceMoyen) < 85) {
            recommandations.push(`⚠️ Le taux de présence moyen (${stats.tauxPresenceMoyen}%) est en dessous de l'objectif de 85%`);
        }
        
        // Vérifier la couverture
        if (planning.joursSousEffectif > 5) {
            recommandations.push(`⚠️ ${planning.joursSousEffectif} jours avec moins de 10 agents disponibles`);
        }
        
        // Vérifier les radios
        if (radios.disponibles < 5) {
            recommandations.push(`⚠️ Stock de radios faible (${radios.disponibles} disponibles)`);
        }
        
        if (radios.radiosSansRetour > 3) {
            recommandations.push(`⚠️ ${radios.radiosSansRetour} radios attribuées depuis plus d'un mois`);
        }
        
        // Vérifier les congés
        if (conges.agentsEnConge > stats.totalAgents * 0.3) {
            recommandations.push(`⚠️ ${conges.agentsEnConge} agents en congé (plus de 30% de l'effectif)`);
        }
        
        // Recommandations positives
        if (parseFloat(stats.tauxPresenceMoyen) > 95) {
            recommandations.push(`✓ Excellent taux de présence (${stats.tauxPresenceMoyen}%)`);
        }
        
        if (planning.joursSousEffectif === 0) {
            recommandations.push('✓ Bonne couverture tous les jours du mois');
        }
        
        if (radios.disponibles > 15) {
            recommandations.push('✓ Stock de radios suffisant');
        }
        
        return recommandations;
    }
}

// Exporter la classe pour utilisation globale
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportUtils;
} else {
    window.ExportUtils = ExportUtils;
}
