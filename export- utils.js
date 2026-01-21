// Utilitaires d'exportation Excel/PDF
class ExportUtils {
    constructor(db) {
        this.db = db;
        this.planningEngine = null;
    }

    setPlanningEngine(planningEngine) {
        this.planningEngine = planningEngine;
    }

    // Exporter les agents en CSV
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
            
            return true;
        } catch (error) {
            console.error('Erreur export agents:', error);
            throw error;
        }
    }

    // Exporter planning en Excel
    async exporterPlanningExcel(mois, annee) {
        try {
            const agents = await this.db.listerAgents();
            const joursDansMois = new Date(annee, mois, 0).getDate();
            
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Code;Nom;Prénom;Groupe";
            
            for (let j = 1; j <= joursDansMois; j++) {
                csvContent += `;J${j}`;
            }
            csvContent += "\n";
            
            for (const agent of agents) {
                if (agent.statut === 'actif') {
                    const planning = await this.planningEngine.genererPlanningTheorique(agent.code, mois, annee);
                    
                    csvContent += `${agent.code};${agent.nom};${agent.prenom};${agent.groupe}`;
                    
                    planning.forEach(jour => {
                        csvContent += `;${jour.shift}`;
                    });
                    
                    csvContent += "\n";
                }
            }
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `planning-${mois}-${annee}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            console.error('Erreur export planning:', error);
            throw error;
        }
    }

    // Exporter statistiques agent PDF (simulé)
    async exporterStatsAgentPDF(code, mois, annee) {
        try {
            // Générer un PDF simple en HTML
            const agent = await this.db.obtenirAgent(code);
            const stats = await this.planningEngine.calculerStatsAgent(code, mois, annee);
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Statistiques ${code} - ${mois}/${annee}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .total { font-weight: bold; background-color: #e8f4f8; }
                    </style>
                </head>
                <body>
                    <h2>Statistiques Agent</h2>
                    <p><strong>Code:</strong> ${code}</p>
                    <p><strong>Nom:</strong> ${agent.nom} ${agent.prenom}</p>
                    <p><strong>Groupe:</strong> ${agent.groupe}</p>
                    <p><strong>Période:</strong> ${mois}/${annee}</p>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Type de shift</th>
                                <th>Nombre</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Shifts Matin (1)</td><td>${stats.stats['1']}</td></tr>
                            <tr><td>Shifts Après-midi (2)</td><td>${stats.stats['2']}</td></tr>
                            <tr><td>Shifts Nuit (3)</td><td>${stats.stats['3']}</td></tr>
                            <tr><td>Repos (R)</td><td>${stats.stats['R']}</td></tr>
                            <tr><td>Congés (C)</td><td>${stats.stats['C']}</td></tr>
                            <tr><td>Maladie (M)</td><td>${stats.stats['M']}</td></tr>
                            <tr class="total"><td>TOTAL OPÉRATIONNEL</td><td>${stats.totalOperationnels}</td></tr>
                        </tbody>
                    </table>
                    
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
                </html>
            `);
            
            return true;
        } catch (error) {
            console.error('Erreur export PDF:', error);
            throw error;
        }
    }
}

// Exporter global
window.ExportUtils = ExportUtils;