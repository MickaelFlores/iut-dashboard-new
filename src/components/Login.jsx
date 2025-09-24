// components/Login.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Loader, AlertTriangle, Shield, Server, RefreshCw, Info, X } from 'lucide-react';
import { cookieUtils } from '../utils/cookies';

const Login = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [autoConnecting, setAutoConnecting] = useState(false);
    const [error, setError] = useState('');
    const [proxyStatus, setProxyStatus] = useState('checking');
    const [proxyUrl] = useState('https://scodoc-proxy-production.up.railway.app');
    const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [showSecurityInfo, setShowSecurityInfo] = useState(false);

    const [tokens, setTokens] = useState({
        phpsessid: '',
        csrftoken: '',
        moodleSession: ''
    });

    // Chargement initial des tokens depuis les cookies
    useEffect(() => {
        const moodleSession = cookieUtils.get('MoodleSession') || '';
        const savedTokens = cookieUtils.getTokens();
        setTokens(savedTokens, moodleSession);
    }, []);

    const attemptAutoLogin = async () => {
        if (!tokens.phpsessid.trim() || proxyStatus !== 'online') {
            setAutoLoginAttempted(true);
            return;
        }

        setAutoConnecting(true);
        setError('');

        try {
            console.log('🔄 Vérification du statut de session...');

            // Vérifier d'abord si la session est encore active
            const sessionCheckResponse = await fetch(`${proxyUrl}/api/session/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phpsessid: tokens.phpsessid.trim()
                })
            });

            if (!sessionCheckResponse.ok) {
                throw new Error('Erreur lors de la vérification de session');
            }

            const sessionStatus = await sessionCheckResponse.json();

            if (!sessionStatus.success) {
                throw new Error(sessionStatus.error || 'Erreur de vérification de session');
            }

            // Si la session est expirée, nettoyer immédiatement
            if (!sessionStatus.sessionActive) {
                console.log('⏰ Session expirée détectée, nettoyage des cookies');
                cookieUtils.clearTokens();
                setTokens({ phpsessid: '', csrftoken: '' });
                setError('Votre session a expiré. Veuillez vous reconnecter.');
                setAutoLoginAttempted(true);
                setAutoConnecting(false);
                return;
            }

            console.log('✅ Session active, tentative de connexion automatique...');

            // Session active, procéder avec la connexion automatique
            const studentData = await fetchStudentData(
                tokens.phpsessid.trim(),
                tokens.csrftoken.trim()
            );

            // Sauvegarder les tokens qui fonctionnent
            cookieUtils.saveTokens(tokens.phpsessid.trim(), tokens.csrftoken.trim());

            console.log('✅ Connexion automatique réussie');

            onLoginSuccess({
                ...studentData,
                authenticated: true,
                authMethod: 'Auto Login',
                loginTime: new Date().toISOString(),
                phpsessid: tokens.phpsessid.trim(),
                csrftoken: tokens.csrftoken.trim(),
                moodleSession: tokens.moodleSession, // Ajoutez cette ligne

                proxyUrl
            });

        } catch (error) {
            console.warn('⚠️ Connexion automatique échouée:', error.message);
            setError('Connexion automatique échouée. Veuillez vérifier vos identifiants.');

            // Si l'erreur indique un problème de session/token, nettoyer les cookies
            if (error.message.includes('session') ||
                error.message.includes('token') ||
                error.message.includes('expiré') ||
                error.message.includes('redirect') ||
                error.message.includes('doAuth')) {
                console.log('🧹 Nettoyage des cookies invalides');
                cookieUtils.clearTokens();
                setTokens({ phpsessid: '', csrftoken: '' });
            }
        } finally {
            setAutoConnecting(false);
            setAutoLoginAttempted(true);
        }
    };

    // Vérification du statut du proxy avec retry automatique
    const checkProxyStatus = useCallback(async (currentRetryCount = 0) => {
        const maxRetries = 3;

        try {
            const testUrl = `${proxyUrl}/api/test`;
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(15000) // 15s pour le cold start
            });

            if (response.ok) {
                setProxyStatus('online');
                setError(''); // Effacer les erreurs précédentes
                setRetryCount(0);
                console.log('✅ Proxy disponible');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn(`⚠️ Tentative ${currentRetryCount + 1}/${maxRetries + 1} échouée:`, error.message);

            if (currentRetryCount < maxRetries) {
                const delay = (currentRetryCount + 1) * 2000; // 2s, 4s, 6s
                console.log(`🔄 Nouvelle tentative dans ${delay / 1000}s...`);

                setProxyStatus('retrying');
                setRetryCount(currentRetryCount + 1);
                setError(`Connexion au proxy... (tentative ${currentRetryCount + 1}/${maxRetries + 1})`);

                setTimeout(() => {
                    checkProxyStatus(currentRetryCount + 1);
                }, delay);
            } else {
                setProxyStatus('offline');
                setError('Proxy indisponible après plusieurs tentatives');
                setRetryCount(0);
                console.error('❌ Proxy définitivement indisponible après', maxRetries + 1, 'tentatives');
            }
        }
    }, [proxyUrl]);

    // Vérification automatique du proxy au chargement
    useEffect(() => {
        const handlePageLoaded = () => {
            console.log('📄 Page complètement chargée, vérification du proxy...');
            setTimeout(() => {
                checkProxyStatus(0);
            }, 1500);
        };

        if (document.readyState === 'complete') {
            handlePageLoaded();
        } else {
            window.addEventListener('load', handlePageLoaded);
            return () => window.removeEventListener('load', handlePageLoaded);
        }
    }, [checkProxyStatus]);

    // Tentative de connexion automatique
    useEffect(() => {
        if (proxyStatus === 'online' &&
            tokens.phpsessid &&
            !autoLoginAttempted &&
            !loading &&
            !autoConnecting) {

            console.log('🔄 Tentative de connexion automatique...');
            attemptAutoLogin();
        }
    }, [proxyStatus, tokens, autoLoginAttempted, loading, autoConnecting, attemptAutoLogin]);

    const parseStudentData = (data) => {
        const etudiant = data?.relevé?.etudiant || {};
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

        return {
            nom: etudiant.nom || 'Non trouvé',
            prenom: etudiant.prenom || 'Non trouvé',
            groupe_td,
            groupe_tp,
            moyenne_generale: semestre.notes?.value || 'Non trouvé',
            classement: semestre.rang?.value || 'Non trouvé',
            total_etudiants: semestre.rang?.total || 'Non trouvé',
            semestre: semestre.numero || 'Non trouvé',
            annee: semestre.annee_universitaire || 'Non trouvé',
            rawData: data
        };
    };

    const fetchStudentData = async (phpsessidValue, csrftokenValue) => {
        try {
            console.log('🔄 Requête via proxy...');

            const response = await fetch(`${proxyUrl}/api/proxy/scodoc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    phpsessid: phpsessidValue,
                    csrftoken: csrftokenValue
                }),
                signal: AbortSignal.timeout(30000)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Erreur du serveur proxy');
            }

            console.log('✅ Données reçues via proxy');
            return parseStudentData(result.data);

        } catch (error) {
            console.error('❌ Erreur requête proxy:', error);
            throw new Error(`Erreur proxy: ${error.message}`);
        }
    };



    const handleManualLogin = async () => {
        if (!tokens.phpsessid.trim()) {
            setError('PHPSESSID est requis');
            return;
        }

        if (proxyStatus !== 'online') {
            setError('Le serveur proxy n\'est pas disponible');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const studentData = await fetchStudentData(
                tokens.phpsessid.trim(),
                tokens.csrftoken.trim()
            );

            // Sauvegarder les tokens qui fonctionnent
            cookieUtils.saveTokens(tokens.phpsessid.trim(), tokens.csrftoken.trim());

            console.log('✅ Connexion manuelle réussie');

            onLoginSuccess({
                ...studentData,
                authenticated: true,
                authMethod: 'Manual Login',
                loginTime: new Date().toISOString(),
                phpsessid: tokens.phpsessid.trim(),
                csrftoken: tokens.csrftoken.trim(),
                proxyUrl
            });

        } catch (error) {
            console.error('❌ Erreur connexion manuelle:', error);

            if (error.message.includes('session') || error.message.includes('token')) {
                setError('Session expirée. Veuillez récupérer un nouveau PHPSESSID.');
            } else {
                setError(error.message || 'Erreur lors de la connexion');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTokenChange = (field, value) => {
        setTokens(prev => ({ ...prev, [field]: value }));

        // Sauvegarder immédiatement dans les cookies
        if (value.trim()) {
            if (field === 'phpsessid') {
                cookieUtils.set('scodoc_phpsessid', value.trim(), 1);
            } else if (field === 'csrftoken') {
                cookieUtils.set('scodoc_csrftoken', value.trim(), 30);
            } else if (field === 'MoodleSession') {
                cookieUtils.set('MoodleSession', value.trim(), 30);
            }
        }

        // Reset auto login si les tokens changent
        setAutoLoginAttempted(false);
    };

    const handleClearTokens = () => {
        setTokens({ phpsessid: '', csrftoken: '' });
        cookieUtils.clearTokens();
        setAutoLoginAttempted(false);
        setError('');
        console.log('🧹 Tokens effacés');
    };

    const getProxyStatusColor = () => {
        switch (proxyStatus) {
            case 'online': return 'text-green-600';
            case 'offline': return 'text-red-600';
            case 'retrying': return 'text-orange-600';
            case 'checking': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    const getProxyStatusText = () => {
        switch (proxyStatus) {
            case 'online': return '🟢 Proxy disponible';
            case 'offline': return '🔴 Proxy indisponible';
            case 'retrying': return `🟠 Reconnexion... (${retryCount}/3)`;
            case 'checking': return '🟡 Vérification...';
            default: return '⚪ Statut inconnu';
        }
    };

    // Écran de connexion automatique
    if (autoConnecting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Connexion automatique</h2>
                    <p className="text-gray-600 mb-4">Utilisation des identifiants sauvegardés...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 relative">
                {/* Bouton d'information sécurité - En haut à droite */}
                <button
                    onClick={() => setShowSecurityInfo(true)}
                    className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-2 flex items-center space-x-1 transition-colors duration-200"
                    title="Informations de sécurité"
                >
                    <span className="text-xs text-gray-600 font-medium">WARNING Sécurité</span>
                    <Info className="w-4 h-4 text-red-600" />
                </button>

                {/* Modal d'information sécurité */}
                {showSecurityInfo && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Shield className="w-5 h-5 text-orange-500 mr-2" />
                                    Sécurité des données
                                </h3>
                                <button
                                    onClick={() => setShowSecurityInfo(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="text-sm text-gray-700 space-y-3">
                                <p className="text-orange-600 font-medium">
                                    ⚠️ Informations importantes concernant la confidentialité
                                </p>

                                <p>
                                    Cette application traite des identifiants de session pour accéder aux données ScoDoc en <strong>lecture seule</strong>.
                                </p>

                                <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="text-green-700 font-medium mb-1">Points positifs :</p>
                                    <ul className="text-green-600 text-xs space-y-1">
                                        <li>• Accès en lecture seule uniquement</li>
                                        <li>• Aucune modification possible</li>
                                        <li>• Consultation de vos propres données</li>
                                    </ul>
                                </div>

                                <div className="bg-orange-50 p-3 rounded-lg">
                                    <p className="text-orange-700 font-medium mb-1">Recommandations :</p>
                                    <ul className="text-orange-600 text-xs space-y-1">
                                        <li>• Utilisez sur des réseaux de confiance</li>
                                        <li>• Évitez les ordinateurs publics</li>
                                        <li>• Risque théorique d'interception</li>
                                    </ul>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowSecurityInfo(false)}
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                                J'ai compris
                            </button>
                        </div>
                    </div>
                )}

                {/* En-tête */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        IUT Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Connexion ScoDoc via proxy
                    </p>
                </div>

                {/* Statut du proxy */}
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center">
                    <Server className="w-5 h-5 text-gray-500 mr-3" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Serveur Proxy</p>
                        <p className={`text-xs ${getProxyStatusColor()}`}>
                            {getProxyStatusText()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {proxyUrl}
                        </p>
                    </div>
                    <button
                        onClick={() => checkProxyStatus(0)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center"
                        disabled={proxyStatus === 'retrying'}
                    >
                        <RefreshCw className={`w-3 h-3 mr-1 ${proxyStatus === 'retrying' ? 'animate-spin' : ''}`} />
                        {proxyStatus === 'retrying' ? 'Vérification...' : 'Vérifier'}
                    </button>
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-700 text-sm font-medium mb-1">
                                Erreur de connexion
                            </p>
                            <p className="text-red-600 text-xs">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* Info tokens sauvegardés */}
                {(tokens.phpsessid || tokens.csrftoken) && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm text-green-700">Identifiants sauvegardés</span>
                            </div>
                            <button
                                onClick={handleClearTokens}
                                className="text-xs text-red-600 hover:text-red-800 underline"
                            >
                                Effacer
                            </button>
                        </div>
                    </div>
                )}

                {/* Instructions proxy si offline */}
                {proxyStatus === 'offline' && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="text-sm font-medium text-yellow-800 mb-2">
                            Serveur proxy indisponible
                        </h3>
                        <div className="text-xs text-yellow-700 space-y-1">
                            <p>Le proxy distant ne répond pas actuellement.</p>
                            <p>Veuillez réessayer dans quelques instants.</p>
                            <p>Si le problème persiste, contactez l'administrateur.</p>
                        </div>
                    </div>
                )}

                {/* Saisie des tokens */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            PHPSESSID *
                            {tokens.phpsessid && (
                                <span className="text-xs text-green-600 ml-2">(Sauvegardé)</span>
                            )}
                            <span className="text-xs text-red-500 ml-2">(Change à chaque session)</span>
                        </label>
                        <input
                            type="text"
                            value={tokens.phpsessid}
                            onChange={(e) => handleTokenChange('phpsessid', e.target.value)}
                            placeholder="f0c97684ba77997cafcc83bc68a78761685f213e..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                        />
                    </div>
                    <div>
                    </div>
                </div>

                {/* Bouton de connexion */}
                <button
                    onClick={handleManualLogin}
                    disabled={loading || !tokens.phpsessid || proxyStatus !== 'online'}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                            Connexion via proxy...
                        </>
                    ) : (
                        <>
                            <Server className="w-5 h-5 mr-2" />
                            Se connecter via proxy
                        </>
                    )}
                </button>

                {/* Instructions récupération tokens */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <a href="https://html-preview.github.io/?url=https://github.com/MickaelFlores/menu-s3-webetud/blob/main/index.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline"><strong>Accéder au tuto SETUP du dashboard</strong></a>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Installer une extension</li>
                        <li>• Se connecter a SCODOC une UNIQUE fois</li>
                        <li>• Accedez au dashboard !</li>
                    </ul>
                </div>

                {/* Note technique */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                        Les identifiants sont sauvegardés localement pour la connexion automatique
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;