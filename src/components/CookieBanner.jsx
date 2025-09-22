// src/components/CookieBanner.jsx
import React from 'react';
import { Cookie, X, Check, Info } from 'lucide-react';
import { useCookieConsent } from '../hooks/useCookie';

export function CookieBanner() {
  const { needsConsent, acceptCookies, declineCookies } = useCookieConsent();

  // Ne pas afficher si l'utilisateur a déjà fait un choix
  if (!needsConsent) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icône et message */}
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-gray-800 font-medium mb-1">
                🍪 Utilisation des cookies
              </p>
              <p className="text-gray-600">
                Cette application utilise des cookies pour sauvegarder votre session ScoDoc 
                et améliorer votre expérience utilisateur. Vos données restent locales sur votre navigateur.
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={acceptCookies}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Check className="h-4 w-4" />
              Accepter
            </button>
            
            <button
              onClick={declineCookies}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <X className="h-4 w-4" />
              Refuser
            </button>
          </div>
        </div>

        {/* Info supplémentaire */}
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
          <Info className="h-3 w-3" />
          <span>
            Les cookies sont utilisés uniquement pour maintenir votre connexion. 
            Aucune donnée n'est partagée avec des tiers.
          </span>
        </div>
      </div>
    </div>
  );
}