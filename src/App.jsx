import React, { useState, useEffect } from 'react';
import Login from './components/Login'; // Utilise le nouveau composant
import Dashboard from './components/Dashboard';
import { authAPI } from './services/api';
import { cookieUtils } from './utils/cookies';
import { Loader, AlertTriangle } from 'lucide-react';

// Styles CSS personnalisés pour améliorer l'apparence
import './App.css';

function App() {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Vérifier si l'utilisateur est déjà connecté au démarrage
        checkAuthStatus();
    }, []);

    const handleLoginSuccess = (userData) => {
        console.log('✅ Utilisateur connecté:', userData.nom, userData.prenom);
        setUser(userData);
        setAuthenticated(true);
        setError('');
    };

    const checkAuthStatus = async () => {
        try {
            setError('');

            // D'abord vérifier s'il y a une session serveur active (si vous utilisez authAPI)
            try {
                const response = await authAPI.getStatus();
                const isAuth = response.data.authenticated;

                if (isAuth) {
                    setAuthenticated(true);
                    console.log('✅ Session serveur existante trouvée');
                    if (response.data.user) {
                        setUser(response.data.user);
                    }
                    setLoading(false);
                    return;
                }
            } catch (serverError) {
                console.log('ℹ️ Pas de session serveur active');
            }

            // Sinon, essayer de récupérer les tokens des cookies pour une connexion proxy
            const savedTokens = cookieUtils.getTokens();
            if (savedTokens.phpsessid) {
                console.log('ℹ️ Tokens trouvés dans les cookies, tentative de reconnexion...');
                // La reconnexion sera gérée par le composant Login
            } else {
                console.log('ℹ️ Aucune session ou tokens sauvegardés');
            }

            setAuthenticated(false);

        } catch (error) {
            console.error('❌ Erreur vérification auth:', error);
            setError('Erreur de connexion au serveur');
            setAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour rafraîchir les données
    const handleRefresh = async (userWithAbsences = null) => {
        try {
            setError('');
            console.log('🔄 Actualisation des données utilisateur...');

            // Si on reçoit un user avec des données d'absences, l'utiliser directement
            if (userWithAbsences) {
                console.log('📊 Mise à jour avec données d\'absences');
                setUser(userWithAbsences);
                return;
            }

            if (user?.authMethod?.includes('Login') && user?.phpsessid) {
                // Relancer la requête proxy avec les tokens existants
                const proxyUrl = user?.proxyUrl || 'https://scodoc-proxy-production.up.railway.app';

                const response = await fetch(`${proxyUrl}/api/proxy/scodoc`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        phpsessid: user.phpsessid,
                        csrftoken: user.csrftoken || ''
                    })
                });

                const result = await response.json();
                if (result.success) {
                    const updatedUserData = parseStudentData(result.data);
                    setUser({
                        ...updatedUserData,
                        authenticated: true,
                        authMethod: user.authMethod,
                        loginTime: new Date().toISOString(),
                        phpsessid: user.phpsessid,
                        csrftoken: user.csrftoken,
                        proxyUrl: user.proxyUrl,
                        // ✅ PRÉSERVER les données d'absences existantes
                        rawData: {
                            ...updatedUserData.rawData,
                            absencesData: user.rawData?.absencesData // Conserver absencesData
                        }
                    });
                    console.log('✅ Données actualisées avec préservation des absences');
                } else {
                    throw new Error(result.error || 'Erreur lors de l\'actualisation');
                }
            } else {
                // Pour d'autres méthodes d'auth, réutiliser checkAuthStatus
                await checkAuthStatus();
            }
        } catch (error) {
            console.error('❌ Erreur actualisation:', error);
            setError(`Erreur lors de l'actualisation: ${error.message}`);

            // Si les tokens ont expiré, forcer la déconnexion
            if (error.message.includes('session') || error.message.includes('token')) {
                handleLogout();
            }
        }
    };

    // Fonction pour parser les données (même que dans Login)
    const parseStudentData = (data) => {
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
    };

    const handleLogout = () => {
        console.log('👋 Déconnexion');

        // Nettoyer les cookies des tokens
        cookieUtils.clearTokens();

        // Si vous utilisez casAuthService, décommentez la ligne suivante
        // casAuthService.cleanup();

        setAuthenticated(false);
        setUser(null);
        setError('');

        console.log('🧹 Session nettoyée');

        // Optionnel: redirection vers la page de déconnexion CAS
        // window.open('https://authc.univ-toulouse.fr/logout', '_blank');
    };

    // Écran de chargement initial
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">IUT Dashboard</h2>
                    <p className="text-gray-600">Vérification de la session...</p>
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Rendu principal : Login ou Dashboard
    return (
        <div className="App">
            {authenticated ? (
                <Dashboard
                    user={user}
                    onLogout={handleLogout}
                    onRefresh={handleRefresh}
                />
            ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
            )}

            {/* Affichage d'erreur global */}
            {error && authenticated && (
                <div className="fixed bottom-4 right-4 max-w-sm">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
                        <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                <button
                                    onClick={() => setError('')}
                                    className="text-xs text-red-600 hover:text-red-800 underline mt-2"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;