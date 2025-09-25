import React, { useState, useEffect } from 'react';
import Login from './components/Login'; // Utilise le nouveau composant
import Dashboard from './components/Dashboard';
import { authAPI } from './services/api';
import { cookieUtils } from './utils/cookies';
import { Loader, AlertTriangle } from 'lucide-react';
import StudentInfos from './services/StudentInfos';

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

            // Vérifier s'il y a une session serveur active
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

            // Tentative de connexion automatique avec les tokens sauvegardés
            const userData = await StudentInfos.attemptAutoLogin();

            if (userData) {
                console.log('✅ Connexion automatique réussie');
                setUser(userData);
                setAuthenticated(true);
            } else {
                console.log('ℹ️ Aucune session ou tokens valides');
                setAuthenticated(false);
            }

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
                // Utiliser le service pour rafraîchir les données
                const updatedUser = await StudentInfos.refreshUserData(user, {
                    preserveAbsences: true
                });

                setUser(updatedUser);
                console.log('✅ Données actualisées avec préservation des absences');
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