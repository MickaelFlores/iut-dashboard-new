// components/LoginWithProxy.jsx
import React, { useState, useEffect } from 'react';
import { Loader, AlertTriangle, Shield, Server, RefreshCw } from 'lucide-react';
import { cookieUtils } from '../utils/cookies';

const LoginWithProxy = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [autoConnecting, setAutoConnecting] = useState(false);
    const [error, setError] = useState('');
    const [proxyStatus, setProxyStatus] = useState('checking');
    const [proxyUrl, setProxyUrl] = useState('');
    const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
    
    const [tokens, setTokens] = useState({
        phpsessid: '',
        csrftoken: ''
    });

    // Configuration proxy - utilisation du proxy distant même en localhost
    useEffect(() => {
        // Toujours utiliser le proxy distant
        const url = 'https://scodoc-proxy-production.up.railway.app';
        
        setProxyUrl(url);
        
        // Charger les tokens depuis les cookies
        const savedTokens = cookieUtils.getTokens();
        setTokens(savedTokens);
        
        // Vérifier le statut du proxy
        checkProxyStatus();
    }, []);

    // Tentative de connexion automatique quand proxy est ready et tokens disponibles
    useEffect(() => {
        if (proxyStatus === 'online' && 
            tokens.phpsessid && 
            !autoLoginAttempted && 
            !loading && 
            !autoConnecting) {
            
            console.log('🔄 Tentative de connexion automatique...');
            attemptAutoLogin();
        }
    }, [proxyStatus, tokens, autoLoginAttempted, loading, autoConnecting]);

    const checkProxyStatus = async () => {
        try {
            const testUrl = `${proxyUrl}/api/test`;
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                setProxyStatus('online');
                console.log('✅ Proxy disponible');
            } else {
                setProxyStatus('offline');
                setError(`Proxy indisponible (HTTP ${response.status})`);
            }
        } catch (error) {
            setProxyStatus('offline');
            setError('Proxy indisponible');
            console.warn('⚠️ Proxy non disponible:', error.message);
        }
    };

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
        const response = await fetch(`${proxyUrl}/api/proxy/scodoc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
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
            throw new Error(result.error || 'Erreur serveur proxy');
        }

        return parseStudentData(result.data);
    };

    const attemptAutoLogin = async () => {
        if (!tokens.phpsessid.trim() || proxyStatus !== 'online') {
            setAutoLoginAttempted(true);
            return;
        }

        setAutoConnecting(true);
        setError('');

        try {
            console.log('🔄 Connexion automatique en cours...');
            
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
                proxyUrl
            });

        } catch (error) {
            console.warn('⚠️ Connexion automatique échouée:', error.message);
            setError('Connexion automatique échouée. Veuillez vérifier vos identifiants.');
            
            // Si l'auto-login échoue, nettoyer les cookies invalides
            if (error.message.includes('session') || error.message.includes('token')) {
                console.log('🧹 Nettoyage des cookies invalides');
                cookieUtils.clearTokens();
            }
        } finally {
            setAutoConnecting(false);
            setAutoLoginAttempted(true);
        }
    };

    const handleManualLogin = async () => {
        if (!tokens.phpsessid.trim()) {
            setError('PHPSESSID requis');
            return;
        }

        if (proxyStatus !== 'online') {
            setError('Proxy indisponible');
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
            setError(error.message || 'Erreur de connexion');
            
            // Si la connexion échoue, suggérer de vérifier les tokens
            if (error.message.includes('session') || error.message.includes('token')) {
                setError('Session expirée. Veuillez récupérer un nouveau PHPSESSID.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTokenChange = (field, value) => {
        setTokens(prev => ({ ...prev, [field]: value }));
        
        // Sauvegarder immédiatement dans les cookies quand l'utilisateur modifie
        if (value.trim()) {
            if (field === 'phpsessid') {
                cookieUtils.set('scodoc_phpsessid', value.trim(), 1);
            } else if (field === 'csrftoken') {
                cookieUtils.set('scodoc_csrftoken', value.trim(), 30);
            }
        }
    };

    const handleClearTokens = () => {
        setTokens({ phpsessid: '', csrftoken: '' });
        cookieUtils.clearTokens();
        setAutoLoginAttempted(false);
        setError('');
        console.log('🧹 Tokens effacés');
    };

    // Si une connexion automatique est en cours
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
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                {/* En-tête */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">IUT Dashboard</h1>
                    <p className="text-gray-600">Connexion ScoDoc</p>
                </div>

                {/* Statut proxy */}
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center">
                    <Server className="w-5 h-5 text-gray-500 mr-3" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Proxy Status</p>
                        <p className={`text-xs ${
                            proxyStatus === 'online' ? 'text-green-600' : 
                            proxyStatus === 'offline' ? 'text-red-600' : 
                            proxyStatus === 'retrying' ? 'text-orange-600' : 'text-yellow-600'
                        }`}>
                            {proxyStatus === 'online' ? '🟢 Disponible' : 
                             proxyStatus === 'offline' ? '🔴 Indisponible' : 
                             proxyStatus === 'retrying' ? '🟠 Connexion...' : '🟡 Vérification...'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {proxyUrl}
                        </p>
                    </div>
                    <button
                        onClick={checkProxyStatus}
                        className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center"
                    >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Vérifier
                    </button>
                </div>

                {/* Erreur */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-700 text-sm font-medium">Erreur de connexion</p>
                            <p className="text-red-600 text-xs mt-1">{error}</p>
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

                {/* Formulaire */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            PHPSESSID *
                            {tokens.phpsessid && (
                                <span className="text-xs text-green-600 ml-2">(Sauvegardé)</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={tokens.phpsessid}
                            onChange={(e) => handleTokenChange('phpsessid', e.target.value)}
                            placeholder="Collez votre PHPSESSID..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            CSRFTOKEN (Optionnel)
                            {tokens.csrftoken && (
                                <span className="text-xs text-green-600 ml-2">(Sauvegardé)</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={tokens.csrftoken}
                            onChange={(e) => handleTokenChange('csrftoken', e.target.value)}
                            placeholder="CSRFTOKEN..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono bg-gray-50"
                        />
                    </div>
                </div>

                <button
                    onClick={handleManualLogin}
                    disabled={loading || !tokens.phpsessid.trim() || proxyStatus !== 'online'}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                            Connexion...
                        </>
                    ) : (
                        <>
                            <Server className="w-5 h-5 mr-2" />
                            Se connecter
                        </>
                    )}
                </button>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Comment récupérer le PHPSESSID ?
                    </h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• <strong>F12</strong> → Outils développeur</li>
                        <li>• Aller sur <strong>scodocetudiant.iut-blagnac.fr</strong></li>
                        <li>• Se connecter avec l'ENT</li>
                        <li>• <strong>Application</strong> → <strong>Cookies</strong></li>
                        <li>• Copier la valeur de <strong>PHPSESSID</strong></li>
                    </ul>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                        Les identifiants sont sauvegardés localement pour la connexion automatique
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginWithProxy;