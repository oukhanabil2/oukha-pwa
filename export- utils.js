// Utilitaires d'exportation Excel/PDF
class ExportUtils {
    constructor(db) {
        this.db = db;
        this.planningEngine = null;
        this.MOIS_NOMS = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
    }

    setPlanningEngine(planningEngine) {
        if (!planningEngine || typeof planningEngine.calculerStatsAgent !== 'function') {
            throw new Error('PlanningEngine invalide ou méthode manquante');
        }
        this.planningEngine = planningEngine;
    }

    // Formatter une date pour les noms de fichier
    _getFormattedDate() {
        const now = new Date();
        return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
    }

    // Exporter les agents en CSV
    async exporterAgentsExcel() {
        try {
            if (!this.db || typeof this.db.listerAgents !== 'function') {
                throw new Error('Base de données non disponible');
            }

            const agents = await this.db.listerAgents();
            
            // Trier les agents par groupe puis par nom
            agents.sort((a, b) => {
                if (a.groupe !== b.groupe) {
                    return a.groupe.localeCompare(b.groupe);
                }
                if (a.nom !== b.nom) {
                    return a.nom.localeCompare(b.nom);
                }
                return a.prenom.localeCompare(b.prenom);
            });
            
            // En-tête CSV
            const headers = ['Code', 'Nom', 'Prénom', 'Groupe', 'Date Entrée', 'Date Sortie', 'Statut'];
            let csvContent = "\uFEFF"; // BOM pour UTF-8
            csvContent += headers.join(';') + '\n';
            
            // Lignes de données
            agents.forEach(agent => {
                const row = [
                    agent.code || '',
                    agent.nom || '',
                    agent.prenom || '',
                    agent.groupe || '',
                    agent.date_entree || '',
                    agent.date_sortie || '',
                    agent.statut || 'inactif'
                ].map(field => {
                    // Échapper les caractères spéciaux
                    const str = String(field);
                    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                }).join(';');
                
                csvContent += row + '\n';
            });
            
            // Créer le fichier
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `agents_sga_${this._getFormattedDate()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            
            // Nettoyer
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            return { success: true, count: agents.length };
        } catch (error) {
            console.error('Erreur export agents:', error);
            throw new Error(`Échec de l'export des agents: ${error.message}`);
        }
    }

    // Exporter planning en Excel
    async exporterPlanningExcel(mois, annee) {
        try {
            if (!this.planningEngine) {
                throw new Error('PlanningEngine non configuré');
            }

            const moisNom = this.MOIS_NOMS[mois - 1] || `Mois ${mois}`;
            const agents = await this.db.listerAgents();
            const joursDansMois = new Date(annee, mois, 0).getDate();
            
            // Filtrer et trier les agents actifs
            const agentsActifs = agents
                .filter(agent => agent.statut === 'actif')
                .sort((a, b) => {
                    if (a.groupe !== b.groupe) {
                        return a.groupe.localeCompare(b.groupe);
                    }
                    return a.nom.localeCompare(b.nom);
                });
            
            // En-tête CSV
            let csvContent = "\uFEFF"; // BOM pour UTF-8
            const headers = ['Code', 'Nom', 'Prénom', 'Groupe'];
            
            // Ajouter les en-têtes de jours
            for (let j = 1; j <= joursDansMois; j++) {
                headers.push(`J${j}`);
            }
            csvContent += headers.join(';') + '\n';
            
            // Récupérer tous les plannings en parallèle
            const planningPromises = agentsActifs.map(agent => 
                this.planningEngine.genererPlanningTheorique(agent.code, mois, annee)
            );
            const plannings = await Promise.all(planningPromises);
            
            // Générer les lignes
            for (let i = 0; i < agentsActifs.length; i++) {
                const agent = agentsActifs[i];
                const planning = plannings[i];
                
                const rowData = [
                    agent.code,
                    agent.nom,
                    agent.prenom,
                    agent.groupe
                ];
                
                // Ajouter les shifts
                planning.forEach(jour => {
                    rowData.push(jour.shift);
                });
                
                const row = rowData.map(field => String(field)).join(';');
                csvContent += row + '\n';
            }
            
            // Créer et télécharger le fichier
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `planning_${moisNom}_${annee}_${this._getFormattedDate()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            
            // Nettoyer
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            return { 
                success: true, 
                count: agentsActifs.length,
                mois: moisNom,
                annee: annee 
            };
        } catch (error) {
            console.error('Erreur export planning:', error);
            throw new Error(`Échec de l'export du planning: ${error.message}`);
        }
    }

    // Exporter statistiques détaillées en CSV
    async exporterStatsDetailleesExcel(mois, annee) {
        try {
            if (!this.planningEngine) {
                throw new Error('PlanningEngine non configuré');
            }

            const agents = await this.db.listerAgents();
            const agentsActifs = agents.filter(agent => agent.statut === 'actif');
            
            let csvContent = "\uFEFF"; // BOM pour UTF-8
            const headers = [
                'Code', 'Nom', 'Prénom', 'Groupe', 
                'Shifts 1', 'Shifts 2', 'Shifts 3', 'Repos',
                'Congés', 'Maladie', 'Absence', 'Jours Fériés Travaillés',
                'Total Jours Travaillés', 'Total Opérationnel', 'Total Jours Mois'
            ];
            csvContent += headers.join(';') + '\n';
            
            // Récupérer toutes les stats en parallèle
            const statsPromises = agentsActifs.map(agent => 
                this.planningEngine.calculerStatsAgent(agent.code, mois, annee)
            );
            const statsArray = await Promise.all(statsPromises);
            
            for (let i = 0; i < agentsActifs.length; i++) {
                const agent = agentsActifs[i];
                const stats = statsArray[i];
                
                const row = [
                    agent.code,
                    agent.nom,
                    agent.prenom,
                    agent.groupe,
                    stats.stats['1'] || 0,
                    stats.stats['2'] || 0,
                    stats.stats['3'] || 0,
                    stats.stats['R'] || 0,
                    stats.stats['C'] || 0,
                    stats.stats['M'] || 0,
                    stats.stats['A'] || 0,
                    stats.joursFeriesTravailles || 0,
                    stats.totalJoursTravailles || 0,
                    stats.totalOperationnels || 0,
                    stats.totalJours || 0
                ].join(';');
                
                csvContent += row + '\n';
            }
            
            // Télécharger
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `statistiques_${mois}_${annee}_${this._getFormattedDate()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            return { success: true, count: agentsActifs.length };
        } catch (error) {
            console.error('Erreur export stats détaillées:', error);
            throw error;
        }
    }

    // Exporter statistiques agent PDF amélioré
    async exporterStatsAgentPDF(code, mois, annee) {
        try {
            const moisNom = this.MOIS_NOMS[mois - 1] || `Mois ${mois}`;
            const agent = await this.db.obtenirAgent(code);
            if (!agent) {
                throw new Error(`Agent ${code} non trouvé`);
            }

            const stats = await this.planningEngine.calculerStatsAgent(code, mois, annee);
            const planning = await this.planningEngine.genererPlanningTheorique(code, mois, annee);
            
            // Compter les week-ends travaillés
            const weekEndsTravailles = planning.filter(j => 
                (j.est_samedi || j.est_dimanche) && ['1', '2', '3'].includes(j.shift)
            ).length;
            
            // Compter les jours fériés non travaillés
            const joursFeriesNonTravailles = planning.filter(j => 
                j.ferie && !['1', '2', '3'].includes(j.shift)
            ).length;

            const htmlContent = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>Statistiques ${agent.code} - ${moisNom} ${annee}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 2cm;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 20px;
                        color: #333;
                        line-height: 1.6;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #4a6fa5;
                        padding-bottom: 20px;
                    }
                    .header h1 {
                        color: #2c3e50;
                        margin: 0 0 10px 0;
                        font-size: 24px;
                    }
                    .header .subtitle {
                        color: #7f8c8d;
                        font-size: 14px;
                    }
                    .agent-info {
                        background-color: #f8f9fa;
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 25px;
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 10px;
                    }
                    .info-item {
                        margin: 5px 0;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .stat-card {
                        background-color: #fff;
                        border: 1px solid #e0e0e0;
                        border-radius: 5px;
                        padding: 15px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .stat-card h3 {
                        color: #4a6fa5;
                        margin-top: 0;
                        font-size: 16px;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 8px;
                    }
                    .stat-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #2c3e50;
                        margin: 10px 0;
                    }
                    .stat-detail {
                        font-size: 12px;
                        color: #7f8c8d;
                        margin: 5px 0;
                    }
                    .shift-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    .shift-table th {
                        background-color: #4a6fa5;
                        color: white;
                        padding: 10px;
                        text-align: left;
                        font-weight: normal;
                    }
                    .shift-table td {
                        padding: 8px 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .shift-table tr:hover {
                        background-color: #f5f5f5;
                    }
                    .shift-1 { color: #27ae60; }
                    .shift-2 { color: #e67e22; }
                    .shift-3 { color: #e74c3c; }
                    .shift-R { color: #7f8c8d; }
                    .shift-C { color: #3498db; }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 12px;
                        color: #7f8c8d;
                        border-top: 1px solid #eee;
                        padding-top: 20px;
                    }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                        .stat-card { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>STATISTIQUES DE PLANNING</h1>
                    <div class="subtitle">${moisNom} ${annee} - SGA Management</div>
                </div>
                
                <div class="agent-info">
                    <div class="info-item"><span class="info-label">Code:</span> ${agent.code}</div>
                    <div class="info-item"><span class="info-label">Nom:</span> ${agent.nom} ${agent.prenom}</div>
                    <div class="info-item"><span class="info-label">Groupe:</span> ${agent.groupe}</div>
                    <div class="info-item"><span class="info-label">Période:</span> ${moisNom} ${annee}</div>
                    <div class="info-item"><span class="info-label">Statut:</span> ${agent.statut}</div>
                    <div class="info-item"><span class="info-label">Date de génération:</span> ${new Date().toLocaleDateString('fr-FR')}</div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>JOURS TRAVAILLÉS</h3>
                        <div class="stat-value">${stats.totalJoursTravailles}</div>
                        <div class="stat-detail">Total opérationnel: ${stats.totalOperationnels}</div>
                        <div class="stat-detail">Jours fériés travaillés: ${stats.joursFeriesTravailles}</div>
                        <div class="stat-detail">Week-ends travaillés: ${weekEndsTravailles}</div>
                    </div>
                    
                    <div class="stat-card">
                        <h3>RÉPARTITION DES SHIFTS</h3>
                        <div class="stat-detail">Matin (1): ${stats.stats['1'] || 0}</div>
                        <div class="stat-detail">Après-midi (2): ${stats.stats['2'] || 0}</div>
                        <div class="stat-detail">Nuit (3): ${stats.stats['3'] || 0}</div>
                        <div class="stat-detail">Repos (R): ${stats.stats['R'] || 0}</div>
                    </div>
                    
                    <div class="stat-card">
                        <h3>ABSENCES</h3>
                        <div class="stat-detail">Congés (C): ${stats.stats['C'] || 0}</div>
                        <div class="stat-detail">Maladie (M): ${stats.stats['M'] || 0}</div>
                        <div class="stat-detail">Absence (A): ${stats.stats['A'] || 0}</div>
                        <div class="stat-detail">Jours fériés non travaillés: ${joursFeriesNonTravailles}</div>
                    </div>
                </div>
                
                <table class="shift-table">
                    <thead>
                        <tr>
                            <th>Jour</th>
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Type Jour</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${planning.map(jour => `
                            <tr>
                                <td>${jour.jour_semaine} ${jour.jour}</td>
                                <td>${new Date(jour.date).toLocaleDateString('fr-FR')}</td>
                                <td class="shift-${jour.shift}">${jour.shift}</td>
                                <td>
                                    ${jour.est_dimanche ? 'Dimanche' : ''}
                                    ${jour.est_samedi ? 'Samedi' : ''}
                                    ${jour.ferie ? 'Férié' : ''}
                                    ${!jour.est_dimanche && !jour.est_samedi && !jour.ferie ? 'Ouvré' : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Document généré automatiquement par SGA Planning System</p>
                    <p>© ${new Date().getFullYear()} - Version 1.0</p>
                    <button class="no-print" onclick="window.print()">Imprimer ce document</button>
                </div>
                
                <script>
                    window.onload = function() {
                        // Auto-impression si demandé
                        const urlParams = new URLSearchParams(window.location.search);
                        if (urlParams.get('print') === 'true') {
                            window.print();
                        }
                    }
                </script>
            </body>
            </html>
            `;

            // Ouvrir dans une nouvelle fenêtre pour impression
            const printWindow = window.open('', '_blank');
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            return { success: true, agent: agent.code, mois: moisNom, annee };
        } catch (error) {
            console.error('Erreur export PDF:', error);
            throw new Error(`Échec de l'export PDF: ${error.message}`);
        }
    }

    // Exporter un planning individuel en CSV
    async exporterPlanningAgentExcel(code, mois, annee) {
        try {
            if (!this.planningEngine) {
                throw new Error('PlanningEngine non configuré');
            }

            const agent = await this.db.obtenirAgent(code);
            if (!agent) {
                throw new Error(`Agent ${code} non trouvé`);
            }

            const planning = await this.planningEngine.genererPlanningTheorique(code, mois, annee);
            
            let csvContent = "\uFEFF"; // BOM pour UTF-8
            csvContent += "Statistiques de planning individuel\n";
            csvContent += `Agent: ${agent.nom} ${agent.prenom} (${agent.code})\n`;
            csvContent += `Groupe: ${agent.groupe}\n`;
            csvContent += `Période: ${mois}/${annee}\n\n`;
            
            csvContent += "Jour;Date;Jour de semaine;Shift;Férié;Weekend\n";
            
            planning.forEach(jour => {
                csvContent += `${jour.jour};${jour.date};${jour.jour_semaine};${jour.shift};${jour.ferie ? 'Oui' : 'Non'};${(jour.est_samedi || jour.est_dimanche) ? 'Oui' : 'Non'}\n`;
            });
            
            // Ajouter les statistiques
            const stats = await this.planningEngine.calculerStatsAgent(code, mois, annee);
            csvContent += `\nRÉSUMÉ STATISTIQUES\n`;
            csvContent += `Shifts Matin (1): ${stats.stats['1']}\n`;
            csvContent += `Shifts Après-midi (2): ${stats.stats['2']}\n`;
            csvContent += `Shifts Nuit (3): ${stats.stats['3']}\n`;
            csvContent += `Repos (R): ${stats.stats['R']}\n`;
            csvContent += `Congés (C): ${stats.stats['C']}\n`;
            csvContent += `Maladie (M): ${stats.stats['M']}\n`;
            csvContent += `Absences (A): ${stats.stats['A']}\n`;
            csvContent += `Jours fériés travaillés: ${stats.joursFeriesTravailles}\n`;
            csvContent += `Total jours travaillés: ${stats.totalJoursTravailles}\n`;
            csvContent += `Total opérationnel: ${stats.totalOperationnels}\n`;
            
            // Télécharger
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `planning_${agent.code}_${mois}_${annee}_${this._getFormattedDate()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            return { success: true, agent: agent.code };
        } catch (error) {
            console.error('Erreur export planning agent:', error);
            throw error;
        }
    }
}

// Export global
if (typeof window !== 'undefined') {
    window.ExportUtils = ExportUtils;
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportUtils;
}