// services/sessionManager.js
class SessionManager {
    constructor() {
        this.sessionData = null;
        this.lastValidation = null;
        this.validationInterval = 5 * 60 * 1000; // 5 minutes
    }

    // Sauvegarder la session après connexion réussie
    saveSession(tokens, studentData) {
        this.sessionData = {
            tokens,
            studentData,
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24h par défaut
        };
        
        // Sauvegarder en mémoire (pas localStorage pour Claude.ai)
        console.log('✅ Session sauvegardée:', this.sessionData);
    }

    // Vérifier si la session est encore valide
    isSessionValid() {
        if (!this.sessionData) return false;
        
        const now = Date.now();
        const isExpired = now > this.sessionData.expiresAt;
        
        if (isExpired) {
            console.log('❌ Session expirée');
            this.clearSession();
            return false;
        }

        console.log('✅ Session valide');
        return true;
    }

    // Valider la session côté serveur
    async validateSessionWithServer() {
        if (!this.sessionData?.tokens) return false;

        const now = Date.now();
        
        // Éviter de valider trop souvent
        if (this.lastValidation && (now - this.lastValidation) < this.validationInterval) {
            return this.isSessionValid();
        }

        try {
            console.log('🔄 Validation de session côté serveur...');
            
            const response = await fetch(
                'https://scodocetudiant.iut-blagnac.fr/services/data.php?q=dataPremièreConnexion',
                {
                    method: 'GET',
                    headers: {
                        'Cookie': `PHPSESSID=${this.sessionData.tokens.phpsessid}; csrftoken=${this.sessionData.tokens.csrftoken}`,
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                }
            );

            if (response.ok) {
                this.lastValidation = now;
                console.log('✅ Session validée côté serveur');
                return true;
            } else if (response.status === 401 || response.status === 403) {
                console.log('❌ Session invalide côté serveur');
                this.clearSession();
                return false;
            }
            
            return this.isSessionValid(); // Fallback sur validation locale
            
        } catch (error) {
            console.warn('⚠️ Erreur validation serveur, fallback local:', error);
            return this.isSessionValid();
        }
    }

    // Récupérer la session actuelle
    getSession() {
        if (this.isSessionValid()) {
            return this.sessionData;
        }
        return null;
    }

    // Rafraîchir les données étudiant
    async refreshStudentData() {
        if (!this.sessionData?.tokens) {
            throw new Error('Aucune session active');
        }

        try {
            console.log('🔄 Actualisation des données étudiant...');
            
            const response = await fetch(
                'https://scodocetudiant.iut-blagnac.fr/services/data.php?q=dataPremièreConnexion',
                {
                    method: 'GET',
                    headers: {
                        'Cookie': `PHPSESSID=${this.sessionData.tokens.phpsessid}; csrftoken=${this.sessionData.tokens.csrftoken}`,
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const rawData = await response.json();
            const studentData = this.parseStudentData(rawData);
            
            // Mettre à jour les données dans la session
            this.sessionData.studentData = studentData;
            this.sessionData.timestamp = Date.now();
            
            console.log('✅ Données étudiant actualisées');
            return studentData;
            
        } catch (error) {
            console.error('❌ Erreur actualisation:', error);
            throw error;
        }
    }

    // Parser les données étudiant (même logique que dans Login)
    parseStudentData(data) {
        const etudiant = data?.relevé?.etudiant || {};
        const nom = etudiant.nom || 'Non trouvé';
        const prenom = etudiant.prenom || 'Non trouvé';

        const semestre = data?.relevé?.semestre || {};
        const groupes = semestre.groupes || [];

        let groupe_td = "Non trouvé";
        let groupe_tp = "Non trouvé";

        for (const groupe of groupes) {
            const group_name = groupe.group_name || '';
            const partition_name = groupe.partition?.partition_name || '';

            if (group_name.length === 2 && /^\d/.test(group_name)) {
                groupe_td = group_name[0];
                groupe_tp = group_name[1];
                break;
            } else if (partition_name === "TD") {
                groupe_td = group_name;
            } else if (partition_name === "TP") {
                groupe_tp = group_name;
            }
        }

        const notes = semestre.notes || {};
        const moyenne_generale = notes.value || 'Non trouvé';

        const rang_info = semestre.rang || {};
        const classement = rang_info.value || 'Non trouvé';
        const total_etudiants = rang_info.total || 'Non trouvé';

        const annee_scolaire = semestre.annee_universitaire || 'Non trouvé';
        const semestre_num = semestre.numero || 'Non trouvé';

        return {
            nom,
            prenom,
            groupe_td,
            groupe_tp,
            moyenne_generale,
            classement,
            total_etudiants,
            semestre: semestre_num,
            annee: annee_scolaire,
            rawData: data
        };
    }

    // Nettoyer la session
    clearSession() {
        this.sessionData = null;
        this.lastValidation = null;
        console.log('🗑️ Session supprimée');
    }

    // Prolonger la session
    extendSession(hours = 24) {
        if (this.sessionData) {
            this.sessionData.expiresAt = Date.now() + (hours * 60 * 60 * 1000);
            console.log(`⏱️ Session prolongée de ${hours}h`);
        }
    }
}

// Singleton pour usage global
export const sessionManager = new SessionManager();