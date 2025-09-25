// utils/cookies.js - Version améliorée
export const cookieUtils = {
    // Définir un cookie
    set: (name, value, days = 30) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
        console.log(`🍪 Cookie ${name} défini pour ${days} jours`);
    },

    // Récupérer un cookie
    get: (name) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    // Supprimer un cookie
    delete: (name) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        console.log(`🗑️ Cookie ${name} supprimé`);
    },

    // Sauvegarder les tokens ScoDoc
    saveTokens: (phpsessid, csrftoken) => {
        if (phpsessid) {
            cookieUtils.set('scodoc_phpsessid', phpsessid, 1); // 1 jour seulement car change souvent
        }
        if (csrftoken) {
            cookieUtils.set('scodoc_csrftoken', csrftoken, 30); // 30 jours
        }
    },

    // Récupérer les tokens ScoDoc
    getTokens: () => {
        return {
            phpsessid: cookieUtils.get('scodoc_phpsessid') || '',
            csrftoken: cookieUtils.get('scodoc_csrftoken') || ''
        };
    },

    // Sauvegarder la session Moodle
    saveMoodleSession: (sessionId) => {
        if (sessionId) {
            cookieUtils.set('MoodleSession', sessionId, 30); // 30 jours
            console.log('🎓 Session Moodle sauvegardée');
        }
    },

    // Récupérer la session Moodle
    getMoodleSession: () => {
        return cookieUtils.get('MoodleSession') || '';
    },

    // Supprimer tous les tokens (ScoDoc + Moodle)
    clearTokens: () => {
        cookieUtils.delete('scodoc_phpsessid');
        cookieUtils.delete('scodoc_csrftoken');
        cookieUtils.delete('MoodleSession');
        console.log('🧹 Tous les tokens supprimés');
    },

    // Vérifier si les sessions sont valides
    hasValidSessions: () => {
        const scodocSession = cookieUtils.get('scodoc_phpsessid');
        const moodleSession = cookieUtils.get('MoodleSession');
        
        return {
            scodoc: !!scodocSession,
            moodle: !!moodleSession,
            both: !!scodocSession && !!moodleSession
        };
    },

    // Debug: afficher tous les cookies
    debugCookies: () => {
        const cookies = {
            scodoc_phpsessid: cookieUtils.get('scodoc_phpsessid'),
            scodoc_csrftoken: cookieUtils.get('scodoc_csrftoken'),
            MoodleSession: cookieUtils.get('MoodleSession')
        };
        
        console.table(cookies);
        return cookies;
    }
};