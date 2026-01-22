// app-simple.js - Version ultra-simplifiée pour test
console.log('=== APP SIMPLE START ===');

// Attendre que tout soit chargé
window.addEventListener('load', async function() {
    console.log('Page chargée, démarrage...');
    
    try {
        // 1. Vérifier les dépendances
        console.log('Vérification des dépendances:');
        console.log('- Database:', typeof Database);
        console.log('- PlanningEngine:', typeof PlanningEngine);
        console.log('- ExportUtils:', typeof ExportUtils);
        
        if (typeof Database === 'undefined') {
            throw new Error('Database non chargée');
        }
        
        // 2. Créer la base de données
        console.log('Création de la base de données...');
        const db = new Database();
        console.log('DB créée:', db);
        
        // 3. Tenter d'initialiser
        if (db.initialize) {
            await db.initialize();
        } else if (db.initialiser) {
            await db.initialiser();
        } else if (db.init) {
            await db.init();
        } else {
            console.log('⚠️ Pas de méthode initialize trouvée');
        }
        
        // 4. Créer PlanningEngine si disponible
        let planningEngine = null;
        if (typeof PlanningEngine !== 'undefined') {
            planningEngine = new PlanningEngine(db);
            console.log('PlanningEngine créé');
        }
        
        // 5. Créer ExportUtils si disponible
        let exportUtils = null;
        if (typeof ExportUtils !== 'undefined') {
            exportUtils = new ExportUtils(db);
            if (planningEngine) {
                exportUtils.setPlanningEngine(planningEngine);
            }
            console.log('ExportUtils créé');
        }
        
        // 6. Stocker globalement pour accès
        window.sga = {
            db,
            planningEngine,
            exportUtils
        };
        
        // 7. Afficher message de succès
        document.querySelector('.main-content').innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2>✅ SGA INITIALISÉ</h2>
                <p>Version simplifiée chargée avec succès</p>
                <button onclick="sga.showMenu()" style="padding: 10px 20px; margin: 10px;">
                    Afficher le menu
                </button>
            </div>
        `;
        
        // 8. Ajouter une méthode de menu simple
        window.sga.showMenu = function() {
            document.querySelector('.main-content').innerHTML = `
                <div style="padding: 20px;">
                    <h2>Menu SGA Simplifié</h2>
                    <button onclick="sga.showAgents()">Agents</button>
                    <button onclick="sga.showPlanning()">Planning</button>
                </div>
            `;
        };
        
        console.log('=== APP SIMPLE READY ===');
        
    } catch (error) {
        console.error('ERREUR:', error);
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; color: red;">
                <h2>ERREUR</h2>
                <p>${error.message}</p>
                <pre>${error.stack}</pre>
                <button onclick="location.reload()">Recharger</button>
            </div>
        `;
    }
});
