import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Save, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Shield, 
  Key,
  AlertCircle,
  CheckCircle,
  Database,
  Globe
} from 'lucide-react';

const SettingsPanel = ({ isOpen, onClose, cookieUtils }) => {
  const [showPhpSessionId, setShowPhpSessionId] = useState(false);
  const [showMoodleSession, setShowMoodleSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // États pour les formulaires
  const [phpSessionId, setPhpSessionId] = useState(
    cookieUtils.get('scodoc_phpsessid') || ''
  );
  const [moodleSession, setMoodleSession] = useState(
    cookieUtils.get('MoodleSession') || ''
  );

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Sauvegarder les cookies
      if (phpSessionId.trim()) {
        cookieUtils.set('scodoc_phpsessid', phpSessionId.trim(), 1);
      }
      if (moodleSession.trim()) {
        cookieUtils.set('MoodleSession', moodleSession.trim(), 30);
      }

      setSaveStatus('success');
      
      // Fermer le panel après un délai
      setTimeout(() => {
        onClose();
        setSaveStatus(null);
      }, 1500);

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCookies = () => {
    cookieUtils.clearTokens();
    cookieUtils.delete('MoodleSession');
    setPhpSessionId('');
    setMoodleSession('');
    setSaveStatus('cleared');
    
    setTimeout(() => {
      setSaveStatus(null);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
                <p className="text-sm text-gray-500">Sessions & Cookies</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status Alert */}
          {saveStatus && (
            <div className={`p-4 rounded-xl border-l-4 ${
              saveStatus === 'success' 
                ? 'bg-green-50 border-green-400 text-green-800' 
                : saveStatus === 'error'
                ? 'bg-red-50 border-red-400 text-red-800'
                : 'bg-blue-50 border-blue-400 text-blue-800'
            } transition-all duration-300`}>
              <div className="flex items-center space-x-2">
                {saveStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : saveStatus === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {saveStatus === 'success' && 'Configuration sauvegardée !'}
                  {saveStatus === 'error' && 'Erreur lors de la sauvegarde'}
                  {saveStatus === 'cleared' && 'Cookies supprimés'}
                </span>
              </div>
            </div>
          )}

          {/* PHP Session ID */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-semibold text-gray-900">Session ScoDoc</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Identifiant de session pour accéder aux données ScoDoc. Cette session expire généralement après 24h.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">PHP Session ID</label>
              <div className="relative">
                <input
                  type={showPhpSessionId ? "text" : "password"}
                  value={phpSessionId}
                  onChange={(e) => setPhpSessionId(e.target.value)}
                  placeholder="Entrez votre PHP Session ID"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPhpSessionId(!showPhpSessionId)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPhpSessionId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Moodle Session */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-green-500" />
              <h3 className="text-base font-semibold text-gray-900">Session Moodle</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Session Moodle pour récupérer les données d'absences et autres informations complémentaires.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Moodle Session</label>
              <div className="relative">
                <input
                  type={showMoodleSession ? "text" : "password"}
                  value={moodleSession}
                  onChange={(e) => setMoodleSession(e.target.value)}
                  placeholder="Entrez votre session Moodle"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowMoodleSession(!showMoodleSession)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showMoodleSession ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-800 mb-1">Sécurité & Confidentialité</h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Vos sessions sont stockées localement dans votre navigateur et ne sont jamais transmises à des tiers. 
                  A l'éxception du phpsessid qui ne donne acces qu'a la visualisation de vos notes...
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <Key className="w-4 h-4 mr-2 text-purple-500" />
              Actions rapides
            </h3>
            <button
              onClick={handleClearCookies}
              className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Effacer tous les cookies</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-medium flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;