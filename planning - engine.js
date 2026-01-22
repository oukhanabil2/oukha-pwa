// Moteur de calcul des cycles de planning (A, B, C, D, E)
class PlanningEngine {
    constructor(db) {
        this.db = db;
        this.DATE_AFFECTATION_BASE = "2025-11-01";
        this.JOURS_FRANCAIS = {
            'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mer', 'Thu': 'Jeu',
            'Fri': 'Ven', 'Sat': 'Sam', 'Sun': 'Dim'
        };
        this.MOIS_FRANCAIS = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
    }

    // Cycle standard 8 jours (1, 1, 2, 2, 3, 3, R, R)
    _cycleStandard8Jours(jourCycle) {
        const cycle = ['1', '1', '2', '2', '3', '3', 'R', 'R'];
        return cycle[jourCycle % 8];
    }

    // Décalage par groupe
    _getDecalageStandard(groupe) {
        const decalages = {
            'A': 0,
            'B': 2,
            'C': 4,
            'D': 6
        };
        return decalages[groupe] || 0;
    }

    // Calculer le numéro de semaine ISO
    _getNumeroSemaineISO(date) {
        const dateObj = new Date(date);
        const dateDebutAnnee = new Date(dateObj.getFullYear(), 0, 1);
        const joursEcoules = Math.floor((dateObj - dateDebutAnnee) / (1000 * 60 * 60 * 24));
        return Math.ceil((joursEcoules + dateDebutAnnee.getDay() + 1) / 7);
    }

    // Cycle spécial pour groupe E (5/7 avec shifts 1 et 2 seulement)
    async _cycleGroupeE(date, codeAgent) {
        const dateObj = new Date(date);
        const jourSemaine = dateObj.getDay(); // 0=dimanche, 6=samedi
        
        // Weekend = repos
        if (jourSemaine === 0 || jourSemaine === 6) {
            return 'R';
        }
        
        // Obtenir tous les agents du groupe E
        const agentsE = await this.db.obtenirAgentsParGroupe('E');
        // Trier par code pour garantir un ordre cohérent
        const agentsCodes = agentsE
            .map(a => a.code)
            .sort((a, b) => a.localeCompare(b));
        
        const indexAgent = agentsCodes.indexOf(codeAgent);
        if (indexAgent === -1) {
            return 'R';
        }
        
        const semaine = this._getNumeroSemaineISO(date);
        const jourImpair = (dateObj.getDay() % 2 === 1); // Lundi=1 (impair), Mardi=2 (pair), etc.
        
        // Logique spécifique pour groupe E
        if (indexAgent === 0) { // Premier agent
            return (semaine % 2 === 1) ? (jourImpair ? '1' : '2') : (jourImpair ? '2' : '1');
        } else if (indexAgent === 1) { // Deuxième agent
            return (semaine % 2 === 1) ? (jourImpair ? '2' : '1') : (jourImpair ? '1' : '2');
        } else { // Autres agents
            return (indexAgent + semaine) % 2 === 0 ? '1' : '2';
        }
    }

    // Calculer le nombre de jours entre deux dates
    _calculerJoursDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    }

    // Calcul du shift théorique
    async calculerShiftTheorique(codeAgent, date) {
        try {
            const agent = await this.db.obtenirAgent(codeAgent);
            if (!agent || agent.statut !== 'actif') {
                return '-';
            }
            
            // Vérifier si l'agent est sorti
            if (agent.date_sortie) {
                const dateSortie = new Date(agent.date_sortie);
                const dateCourante = new Date(date);
                if (dateCourante >= dateSortie) {
                    return '-';
                }
            }
            
            // Vérifier si la date est avant l'entrée
            const dateEntree = agent.date_entree || this.DATE_AFFECTATION_BASE;
            if (new Date(date) < new Date(dateEntree)) {
                return '-';
            }
            
            // Calculer le nombre de jours depuis l'entrée
            const joursEcoules = this._calculerJoursDifference(dateEntree, date);
            
            // Appliquer le cycle selon le groupe
            if (agent.groupe === 'E') {
                return await this._cycleGroupeE(date, codeAgent);
            } else if (['A', 'B', 'C', 'D'].includes(agent.groupe)) {
                const decalage = this._getDecalageStandard(agent.groupe);
                const jourCycle = joursEcoules + decalage;
                return this._cycleStandard8Jours(jourCycle);
            }
            
            return 'R';
        } catch (error) {
            console.error(`Erreur dans calculerShiftTheorique pour ${codeAgent} le ${date}:`, error);
            return '-';
        }
    }

    // Générer le planning théorique pour un mois
    async genererPlanningTheorique(codeAgent, mois, annee) {
        try {
            // Validation des paramètres
            if (mois < 1 || mois > 12) {
                throw new Error('Mois invalide. Doit être entre 1 et 12.');
            }
            
            const joursDansMois = new Date(annee, mois, 0).getDate();
            const planning = [];
            
            // Récupérer tous les jours fériés du mois en une seule requête
            const joursFeriesPromises = [];
            for (let jour = 1; jour <= joursDansMois; jour++) {
                const date = `${annee}-${mois.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;
                joursFeriesPromises.push(this.db.estJourFerie(date));
            }
            const joursFeriesResults = await Promise.all(joursFeriesPromises);
            
            // Générer le planning
            for (let jour = 1; jour <= joursDansMois; jour++) {
                const date = `${annee}-${mois.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;
                const shift = await this.calculerShiftTheorique(codeAgent, date);
                
                const dateObj = new Date(date);
                const jourSemaine = dateObj.getDay();
                const nomJour = this.JOURS_FRANCAIS[dateObj.toLocaleDateString('en-US', { weekday: 'short' })];
                
                planning.push({
                    jour: jour,
                    date: date,
                    jour_semaine: nomJour,
                    shift: shift,
                    ferie: joursFeriesResults[jour - 1],
                    est_dimanche: jourSemaine === 0,
                    est_samedi: jourSemaine === 6
                });
            }
            
            return planning;
        } catch (error) {
            console.error(`Erreur dans genererPlanningTheorique pour ${codeAgent} (${mois}/${annee}):`, error);
            return [];
        }
    }

    // Générer planning pour un groupe
    async genererPlanningGroupe(groupe, mois, annee) {
        try {
            const agents = await this.db.obtenirAgentsParGroupe(groupe);
            const planningAgents = [];
            
            // Traiter les agents en parallèle pour améliorer les performances
            const promises = agents
                .filter(agent => agent.statut === 'actif')
                .map(async (agent) => {
                    const planning = await this.genererPlanningTheorique(agent.code, mois, annee);
                    
                    // Enregistrer les shifts théoriques
                    const enregistrementPromises = planning.map(jour => 
                        this.db.enregistrerShift(agent.code, jour.date, jour.shift, 'THEORIQUE')
                    );
                    await Promise.all(enregistrementPromises);
                    
                    return {
                        agent,
                        planning
                    };
                });
            
            const results = await Promise.all(promises);
            return results.filter(result => result !== null);
        } catch (error) {
            console.error(`Erreur dans genererPlanningGroupe pour le groupe ${groupe}:`, error);
            return [];
        }
    }

    // Calculer les statistiques d'un agent
    async calculerStatsAgent(codeAgent, mois, annee) {
        try {
            const planning = await this.genererPlanningTheorique(codeAgent, mois, annee);
            
            const stats = {
                '1': 0, '2': 0, '3': 0, 'R': 0, 'C': 0, 'M': 0, 'A': 0, '-': 0
            };
            
            let joursFeriesTravailles = 0;
            let totalJoursTravailles = 0;
            
            for (const jour of planning) {
                const shift = jour.shift;
                if (stats.hasOwnProperty(shift)) {
                    stats[shift]++;
                    
                    if (['1', '2', '3'].includes(shift)) {
                        totalJoursTravailles++;
                        if (jour.ferie) {
                            joursFeriesTravailles++;
                        }
                    }
                }
            }
            
            const agent = await this.db.obtenirAgent(codeAgent);
            let totalOperationnels = totalJoursTravailles;
            
            // Pour les groupes A-D, ajouter les jours fériés travaillés au total opérationnel
            if (agent && ['A', 'B', 'C', 'D'].includes(agent.groupe)) {
                totalOperationnels += joursFeriesTravailles;
            }
            
            return {
                stats,
                joursFeriesTravailles,
                totalJoursTravailles,
                totalOperationnels,
                totalJours: planning.length,
                joursRepos: stats['R'],
                joursConges: stats['C'],
                joursMaladie: stats['M'],
                joursAbsence: stats['A']
            };
        } catch (error) {
            console.error(`Erreur dans calculerStatsAgent pour ${codeAgent}:`, error);
            return {
                stats: {},
                joursFeriesTravailles: 0,
                totalJoursTravailles: 0,
                totalOperationnels: 0,
                totalJours: 0,
                joursRepos: 0,
                joursConges: 0,
                joursMaladie: 0,
                joursAbsence: 0
            };
        }
    }

    // Calculer les jours travaillés par groupe
    async calculerJoursTravaillesGroupe(groupe, mois, annee) {
        try {
            const planningGroupe = await this.genererPlanningGroupe(groupe, mois, annee);
            let totalGroupe = 0;
            
            for (const item of planningGroupe) {
                const stats = await this.calculerStatsAgent(item.agent.code, mois, annee);
                totalGroupe += stats.totalOperationnels;
            }
            
            return totalGroupe;
        } catch (error) {
            console.error(`Erreur dans calculerJoursTravaillesGroupe pour ${groupe}:`, error);
            return 0;
        }
    }

    // Vérifier si un shift peut être modifié
    async peutModifierShift(codeAgent, date) {
        try {
            const planning = await this.db.get('planning', [codeAgent, date]);
            if (!planning) {
                return true;
            }
            
            const shift = planning.shift?.toUpperCase();
            // Ne peut pas modifier les congés, maladies, absences enregistrés
            return !['C', 'M', 'A'].includes(shift);
        } catch (error) {
            console.error(`Erreur dans peutModifierShift pour ${codeAgent} le ${date}:`, error);
            return false;
        }
    }

    // Obtenir le nombre de jours entre deux dates (inclus)
    getJoursEntreDates(dateDebut, dateFin) {
        try {
            const debut = new Date(dateDebut);
            const fin = new Date(dateFin);
            debut.setHours(0, 0, 0, 0);
            fin.setHours(0, 0, 0, 0);
            
            const difference = fin.getTime() - debut.getTime();
            return Math.floor(difference / (1000 * 3600 * 24)) + 1;
        } catch (error) {
            console.error('Erreur dans getJoursEntreDates:', error);
            return 0;
        }
    }

    // Calculer la période de congé avec gestion des dimanches
    async calculerCongesAvecDimanches(codeAgent, dateDebut, dateFin) {
        try {
            const joursConges = [];
            const dateDebutObj = new Date(dateDebut);
            const dateFinObj = new Date(dateFin);
            let currentDate = new Date(dateDebutObj);
            
            while (currentDate <= dateFinObj) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const jourSemaine = currentDate.getDay();
                
                // Vérifier si c'est un jour férié
                const estFerie = await this.db.estJourFerie(dateStr);
                
                if (jourSemaine === 0) { // Dimanche
                    joursConges.push({
                        date: dateStr,
                        shift: 'R',
                        type: 'CONGE_DIMANCHE',
                        ferie: estFerie
                    });
                } else {
                    joursConges.push({
                        date: dateStr,
                        shift: 'C',
                        type: 'CONGE_PERIODE',
                        ferie: estFerie
                    });
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            return joursConges;
        } catch (error) {
            console.error(`Erreur dans calculerCongesAvecDimanches pour ${codeAgent}:`, error);
            return [];
        }
    }

    // Méthode utilitaire pour formater une date
    formaterDate(dateStr) {
        const date = new Date(dateStr);
        const jour = date.getDate().toString().padStart(2, '0');
        const mois = (date.getMonth() + 1).toString().padStart(2, '0');
        const annee = date.getFullYear();
        return `${jour}/${mois}/${annee}`;
    }

    // Obtenir le nom du mois en français
    getNomMois(mois) {
        return this.MOIS_FRANCAIS[mois - 1] || '';
    }

    // Vérifier la validité d'une date
    estDateValide(dateStr) {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    }
}

// Export global
if (typeof window !== 'undefined') {
    window.PlanningEngine = PlanningEngine;
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlanningEngine;
}