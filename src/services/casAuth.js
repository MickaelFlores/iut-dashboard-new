// services/casAuth.js
export class CASAuthService {
    constructor() {
        this.casLoginUrl = 'https://authc.univ-toulouse.fr/login?service=https%3A%2F%2Fscodocetudiant.iut-blagnac.fr%2Fservices%2FdoAuth.php%3Fhref%3Dhttps%253A%252F%252Fscodocetudiant.iut-blagnac.fr%252F';
        this.targetDomain = 'scodocetudiant.iut-blagnac.fr';
        this.authWindow = null;
        this.pollTimer = null;
    }

    /**
     * Ouvre une popup pour l'authentification CAS
     * @returns {Promise} Résolu avec les tokens ou rejeté en cas d'erreur
     */
    async authenticateWithCAS() {
        return new Promise((resolve, reject) => {
            // Fermer toute fenêtre existante
            if (this.authWindow && !this.authWindow.closed) {
                this.authWindow.close();
            }

            // Ouvrir la popup CAS
            this.authWindow = window.open(
                this.casLoginUrl,
                'casAuth',
                'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes'
            );

            if (!this.authWindow) {
                reject(new Error('Impossible d\'ouvrir la fenêtre de connexion. Vérifiez que les popups sont autorisées.'));
                return;
            }

            // Surveiller la fenêtre popup
            this.pollTimer = setInterval(() => {
                try {
                    // Vérifier si la fenêtre est fermée
                    if (this.authWindow.closed) {
                        clearInterval(this.pollTimer);
                        reject(new Error('Connexion annulée par l\'utilisateur'));
                        return;
                    }

                    // Essayer d'accéder à l'URL de la fenêtre
                    let currentUrl;
                    try {
                        currentUrl = this.authWindow.location.href;
                    } catch (e) {
                        // Erreur CORS normale, continuer à surveiller
                        return;
                    }

                    // Vérifier si on est revenu sur le domaine cible
                    if (currentUrl.includes(this.targetDomain)) {
                        console.log('🔄 Redirection détectée vers:', currentUrl);
                        
                        // Attendre un peu que les cookies se mettent en place
                        setTimeout(async () => {
                            try {
                                const tokens = await this.extractTokensFromCookies();
                                clearInterval(this.pollTimer);
                                this.authWindow.close();
                                
                                if (tokens.PHPSESSID || tokens.success) {
                                    console.log('✅ Tokens récupérés avec succès');
                                    resolve(tokens);
                                } else {
                                    reject(new Error('Aucun token valide trouvé après connexion'));
                                }
                            } catch (error) {
                                clearInterval(this.pollTimer);
                                this.authWindow.close();
                                reject(error);
                            }
                        }, 2000);
                    }
                } catch (error) {
                    // Erreurs normales dues aux CORS, continuer
                }
            }, 1000);

            // Timeout après 5 minutes
            setTimeout(() => {
                if (this.pollTimer) {
                    clearInterval(this.pollTimer);
                    if (this.authWindow && !this.authWindow.closed) {
                        this.authWindow.close();
                    }
                    reject(new Error('Timeout de connexion (5 minutes)'));
                }
            }, 300000);
        });
    }

    /**
     * Extrait les tokens depuis les cookies du navigateur
     * @returns {Object} Tokens extraits
     */
    async extractTokensFromCookies() {
        // Méthode 1: Essayer de récupérer via une requête test
        try {
            const response = await fetch('https://scodocetudiant.iut-blagnac.fr/services/data.php?q=dataPremièreConnexion', {
                method: 'GET',
                credentials: 'include', // Important pour inclure les cookies
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Si la requête réussit, les cookies sont présents
                // On peut les extraire des headers ou utiliser document.cookie
                const cookies = this.parseCookies();
                return {
                    PHPSESSID: cookies.PHPSESSID || null,
                    csrftoken: cookies.csrftoken || null,
                    success: true
                };
            }
        } catch (error) {
            console.log('Méthode 1 échouée, essai méthode 2');
        }

        // Méthode 2: Parser document.cookie directement
        const cookies = this.parseCookies();
        return {
            PHPSESSID: cookies.PHPSESSID || null,
            csrftoken: cookies.csrftoken || null,
            success: !!cookies.PHPSESSID
        };
    }

    /**
     * Parse les cookies du navigateur
     * @returns {Object} Cookies parsés
     */
    parseCookies() {
        const cookies = {};
        document.cookie.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = value;
            }
        });
        return cookies;
    }

    /**
     * Teste si les tokens sont valides en faisant une requête test
     * @param {Object} tokens - Les tokens à tester
     * @returns {Promise<boolean>} True si valides
     */
    async validateTokens(tokens) {
        try {
            const response = await fetch('https://scodocetudiant.iut-blagnac.fr/services/data.php?q=dataPremièreConnexion', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Cookie': `PHPSESSID=${tokens.PHPSESSID}${tokens.csrftoken ? `; csrftoken=${tokens.csrftoken}` : ''}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Erreur validation tokens:', error);
            return false;
        }
    }

    /**
     * Récupère les données étudiant avec les tokens
     * @returns {Promise<Object>} Données étudiant
     */
    async getStudentData() {
        console.log('📚 [DEBUG] === RÉCUPÉRATION DONNÉES ÉTUDIANT ===');
        
        try {
            const url = 'https://scodocetudiant.iut-blagnac.fr/services/data.php?q=dataPremièreConnexion';
            console.log('📚 [DEBUG] URL API:', url);
            console.log('📚 [DEBUG] Cookies avant requête:', document.cookie);
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': navigator.userAgent
                }
            });

            console.log('📚 [DEBUG] Status:', response.status);
            console.log('📚 [DEBUG] Status Text:', response.statusText);
            console.log('📚 [DEBUG] Headers:', [...response.headers.entries()]);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('📚 [DEBUG] Erreur response:', errorText);
                throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📚 [DEBUG] Données brutes reçues:', data);
            
            const parsedData = this.parseStudentData(data);
            console.log('📚 [DEBUG] Données parsées:', parsedData);
            
            return parsedData;
        } catch (error) {
            console.error('📚 [DEBUG] Erreur récupération données:', error);
            console.error('📚 [DEBUG] Stack trace:', error.stack);
            throw error;
        }
    }

    /**
     * Parse les données étudiant depuis la réponse API
     * @param {Object} data - Réponse API brute
     * @returns {Object} Données parsées
     */
    parseStudentData(data) {
        const etudiant = data?.relevé?.etudiant || {};
        const semestre = data?.relevé?.semestre || {};
        const notes = semestre.notes || {};
        const rang_info = semestre.rang || {};

        // Extraction des groupes
        const groupes = semestre.groupes || [];
        let groupe_td = "Non trouvé";
        let groupe_tp = "Non trouvé";

        for (const groupe of groupes) {
            const group_name = groupe?.group_name || '';
            const partition_name = groupe?.partition?.partition_name || '';

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

        return {
            nom: etudiant.nom || 'Non trouvé',
            prenom: etudiant.prenom || 'Non trouvé',
            groupe_td,
            groupe_tp,
            moyenne_generale: notes.value || 'Non trouvé',
            classement: rang_info.value || 'Non trouvé',
            total_etudiants: rang_info.total || 'Non trouvé',
            semestre: semestre.numero || 'Non trouvé',
            annee: semestre.annee_universitaire || 'Non trouvé',
            ues: data?.relevé?.ues || {},
            rawData: data // Données complètes pour debug
        };
    }

    /**
     * Nettoie les ressources
     */
    cleanup() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }
        if (this.authWindow && !this.authWindow.closed) {
            this.authWindow.close();
        }
    }
}

// Export d'une instance singleton
export const casAuthService = new CASAuthService();