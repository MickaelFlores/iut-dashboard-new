// components/CookieDebug.jsx - TEMPORAIRE pour debug
import React, { useState, useEffect } from 'react';
import { useScoDocSession } from '../hooks/useScoDocSession';
import { CookieService } from '../services/cookieService';

export function CookieDebug() {
  const [debugInfo, setDebugInfo] = useState({});
  const session = useScoDocSession();

  const updateDebugInfo = () => {
    const info = {
      // Cookies bruts
      documentCookies: document.cookie,
      
      // Via CookieService
      rawPhpsessid: CookieService.get('scodoc_phpsessid'),
      rawCsrftoken: CookieService.get('scodoc_csrftoken'),
      rawConsent: CookieService.get('cookie_consent'),
      
      // Via Hook
      hookPhpsessid: session.phpsessid,
      hookCsrftoken: session.csrftoken,
      hookHasSession: session.hasSession(),
      hookHasConsent: session.hasConsent(),
      
      // Tests
      canSetCookie: true,
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(info);
    console.log('🐛 Debug Info:', info);
  };

  useEffect(() => {
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  const testSetCookie = () => {
    const testValue = `test_${Date.now()}`;
    console.log('🧪 Test set cookie:', testValue);
    
    try {
      // Test direct
      document.cookie = `test_direct=${testValue}; path=/; max-age=3600`;
      
      // Test via service
      CookieService.set('test_service', testValue, { expires: 1, path: '/' });
      
      // Test via hook
      session.setPhpsessid(testValue);
      
      setTimeout(updateDebugInfo, 100);
      
    } catch (error) {
      console.error('❌ Erreur test cookie:', error);
    }
  };

  const testConsent = () => {
    console.log('🧪 Test consentement');
    session.acceptCookies();
    setTimeout(updateDebugInfo, 100);
  };

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-md text-xs z-50">
      <h3 className="font-bold text-yellow-800 mb-2">🐛 COOKIE DEBUG</h3>
      
      <div className="space-y-2 text-yellow-800">
        <div>
          <strong>Document.cookie:</strong>
          <div className="font-mono bg-white p-1 rounded text-xs break-all">
            {debugInfo.documentCookies || 'vide'}
          </div>
        </div>
        
        <div>
          <strong>Raw Cookies (CookieService):</strong>
          <ul className="text-xs">
            <li>PHPSESSID: {debugInfo.rawPhpsessid || 'null'}</li>
            <li>CSRF: {debugInfo.rawCsrftoken || 'null'}</li>
            <li>Consent: {debugInfo.rawConsent || 'null'}</li>
          </ul>
        </div>
        
        <div>
          <strong>Hook Values:</strong>
          <ul className="text-xs">
            <li>PHPSESSID: {debugInfo.hookPhpsessid || 'null'}</li>
            <li>CSRF: {debugInfo.hookCsrftoken || 'null'}</li>
            <li>hasSession: {debugInfo.hookHasSession ? 'true' : 'false'}</li>
            <li>hasConsent: {debugInfo.hookHasConsent ? 'true' : 'false'}</li>
          </ul>
        </div>
        
        <div className="flex gap-2 pt-2">
          <button 
            onClick={testSetCookie}
            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Set
          </button>
          <button 
            onClick={testConsent}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Accept Cookies
          </button>
          <button 
            onClick={updateDebugInfo}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Refresh
          </button>
          <button 
            onClick={() => {
              document.cookie.split(";").forEach(c => {
                const eqPos = c.indexOf("=");
                const name = eqPos > -1 ? c.substr(0, eqPos) : c;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
              });
              updateDebugInfo();
            }}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="text-xs mt-2 text-yellow-600">
        Updated: {debugInfo.timestamp}
      </div>
    </div>
  );
}