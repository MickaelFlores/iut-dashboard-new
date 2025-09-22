// utils/cookies.js
export const cookieUtils = {
    // Définir un cookie
    set: (name, value, days = 30) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
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
    },

    // Sauvegarder les tokens
    saveTokens: (phpsessid, csrftoken) => {
        if (phpsessid) {
            cookieUtils.set('scodoc_phpsessid', phpsessid, 1); // 1 jour seulement car change souvent
        }
        if (csrftoken) {
            cookieUtils.set('scodoc_csrftoken', csrftoken, 30); // 30 jours
        }
    },

    // Récupérer les tokens
    getTokens: () => {
        return {
            phpsessid: cookieUtils.get('scodoc_phpsessid') || '',
            csrftoken: cookieUtils.get('scodoc_csrftoken') || ''
        };
    },

    // Supprimer les tokens
    clearTokens: () => {
        cookieUtils.delete('scodoc_phpsessid');
        cookieUtils.delete('scodoc_csrftoken');
    }
};