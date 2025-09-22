// components/ManualTokenLogin.jsx
import React, { useState } from 'react';
import { Loader, AlertTriangle, Key, ExternalLink, Copy } from 'lucide-react';

const ManualTokenLogin = ({ onLoginSuccess }) => {
    const [phpsessid, setPhpsessid] = useState('');
    const [csrftoken, setCsrftoken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!phpsessid.trim()) {
            setError('Le token PHPSESSID est requis');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('📤 Envoi des tokens au serveur proxy...');
            
            // Appeler notre serveur proxy
            const response = await fetch('http://localhost:3001/api/student-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    PHPSESSID: phpsessid.trim(),
                    csrftoken: csrftoken.trim() || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur ${response.status}`);
            }

            const studentData = await response.json();
            console.log('✅ Données reçues:', studentData);

            // Appeler le callback de succès
            onLoginSuccess({
                ...studentData,
                authenticated: true,
                authMethod: 'Manual Tokens',
                loginTime: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Erreur:', error);
            setError(error.message || 'Erreur lors de la récupération des données');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenIUTSite = () => {
        window.open('https://scodocetudiant.iut-blagnac.fr/', '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                {/* En-tête */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Key className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        IUT Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Connexion avec tokens manuels
                    </p>
                </div>

                {/* Bouton pour ouvrir le site IUT */}
                <button
                    onClick={handleOpenIUTSite}
                    className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir le site IUT
                </button>

                {/* Bouton instructions */}
                <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="w-full mb-4 text-blue-600 hover:text-blue-700 text-sm underline"
                >
                    {showInstructions ? 'Masquer' : 'Afficher'} les instructions
                </button>

                {/* Instructions */}
                {showInstructions && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg text-sm">
                        <h3 className="font-semibold mb-2">Comment récupérer les tokens :</h3>
                        <ol className="list-decimal list-inside space-y-1 text-gray-700">
                            <li>Ouvrez le site IUT et connectez-vous</li>
                            <li>Ouvrez les outils développeur (F12)</li>
                            <li>Allez dans l'onglet "Application" ou "Storage"</li>
                            <li>Cliquez sur "Cookies" puis sur le domaine IUT</li>
                            <li>Copiez les valeurs de PHPSESSID et csrftoken</li>
                            <li>Collez-les dans les champs ci-dessous</li>
                        </ol>
                    </div>
                )}

                {/* Message d'erreur */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-700 text-sm font-medium">
                                Erreur
                            </p>
                            <p className="text-red-600 text-xs">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            PHPSESSID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={phpsessid}
                            onChange={(e) => setPhpsessid(e.target.value)}
                            placeholder="c29171875fa65c71847c3f25427f5569a68601894dc46b66475d9bbf3a5dc716"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            csrftoken (optionnel)
                        </label>
                        <input
                            type="text"
                            value={csrftoken}
                            onChange={(e) => setCsrftoken(e.target.value)}
                            placeholder="xeUOFJwlQBrNSAaqwChqtmstVOlLRkm40vpx7XBSGOCSuq1D0Hqvr8bcN4tv0KjX"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !phpsessid.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 mr-2 animate-spin" />
                                Récupération...
                            </>
                        ) : (
                            <>
                                <Key className="w-5 h-5 mr-2" />
                                Se connecter
                            </>
                        )}
                    </button>
                </form>

                {/* Bouton pour remplir automatiquement les tokens d'exemple */}
                {process.env.NODE_ENV === 'development' && (
                    <button
                        onClick={() => {
                            setPhpsessid('c29171875fa65c71847c3f25427f5569a68601894dc46b66475d9bbf3a5dc716');
                            setCsrftoken('xeUOFJwlQBrNSAaqwChqtmstVOlLRkm40vpx7XBSGOCSuq1D0Hqvr8bcN4tv0KjX');
                        }}
                        className="w-full mt-2 text-gray-400 hover:text-gray-600 text-xs underline"
                    >
                        [Debug] Remplir avec tokens d'exemple
                    </button>
                )}
            </div>
        </div>
    );
};

export default ManualTokenLogin;