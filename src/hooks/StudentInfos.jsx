// services/StudentInfos.jsx
import { cookieUtils } from '../utils/cookies';

export class StudentInfos {
  static proxyUrl = 'https://scodoc-proxy-production.up.railway.app';

  /**
   * Parse les données brutes de ScoDoc en format utilisable
   * @param {Object} rawData - Données brutes de l'API ScoDoc
   * @returns {Object} Données formatées de l'étudiant
   */
  static parseStudentData(rawData) {
    if (!rawData) return null;

    const etudiant = rawData?.relevé?.etudiant || {};
    const semestre = rawData?.relevé?.semestre || {};
    const groupes = semestre.groupes || [];

    let groupe_td = "Non trouvé";
    let groupe_tp = "Non trouvé";

    // Extraction des groupes TD/TP
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
      rawData
    };
  }

  /**
   * Extrait les données d'absences formatées
   * @param {Object} rawData - Données brutes contenant les informations d'absences
   * @returns {Object|null} Données d'absences formatées
   */
  static extractAbsencesData(rawData) {
    if (!rawData) return null;

    const absencesData = rawData.absencesData;
    const totaux = absencesData?.totaux || {};

    return {
      sessionId: rawData.auth?.session || 'Inconnue',
      totalAbsences: totaux.totalAbsences || 0,
      totalInjustifiees: totaux.totalInjustifiees || 0,
      totalJustifiees: totaux.totalJustifiees || 0,
      totalRetards: totaux.totalRetards || 0,
      derniereAbsence: absencesData?.derniereAbsence || null,
      absencesData,
      etatInscription: 'Inscrit'
    };
  }

  /**
   * Récupère les données ScoDoc via le proxy
   * @param {string} phpsessid - Session ID PHP
   * @param {string} csrftoken - Token CSRF (optionnel)
   * @returns {Promise<Object>} Données de l'étudiant formatées
   */
  static async fetchStudentData(phpsessid, csrftoken = '') {
    try {
      console.log('🔄 Requête ScoDoc via proxy...');

      const response = await fetch(`${this.proxyUrl}/api/proxy/scodoc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          phpsessid: phpsessid.trim(),
          csrftoken: csrftoken.trim()
        }),
        signal: AbortSignal.timeout(30000)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur du serveur proxy');
      }

      console.log('✅ Données ScoDoc reçues via proxy');
      return this.parseStudentData(result.data);

    } catch (error) {
      console.error('❌ Erreur requête ScoDoc:', error);
      throw new Error(`Erreur proxy ScoDoc: ${error.message}`);
    }
  }

  /**
   * Récupère les données d'absences via le proxy
   * @param {string} moodleSession - Session Moodle
   * @param {string} dpt - Département (par défaut 'INFO')
   * @param {string} cid - Code de classe (par défaut '874')
   * @returns {Promise<Object>} Données d'absences
   */
  static async fetchAbsencesData(moodleSession, dpt = 'INFO', cid = '874') {
    try {
      console.log('🔄 Requête données absences via proxy...');

      const response = await fetch(`${this.proxyUrl}/api/proxy/absences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodleSession: moodleSession.trim(),
          dpt,
          cid
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des absences');
      }

      console.log('✅ Données absences reçues via proxy');
      return result.data;

    } catch (error) {
      console.error('❌ Erreur requête absences:', error);
      throw new Error(`Erreur proxy absences: ${error.message}`);
    }
  }

  /**
   * Vérifie le statut de session ScoDoc
   * @param {string} phpsessid - Session ID PHP
   * @returns {Promise<Object>} Statut de la session
   */
  static async checkSessionStatus(phpsessid) {
    try {
      const response = await fetch(`${this.proxyUrl}/api/session/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phpsessid: phpsessid.trim()
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification de session');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur de vérification de session');
      }

      return {
        sessionActive: result.sessionActive,
        message: result.message || 'Session vérifiée'
      };

    } catch (error) {
      console.error('❌ Erreur vérification session:', error);
      throw new Error(`Erreur vérification session: ${error.message}`);
    }
  }

  /**
   * Vérifie le statut du proxy
   * @returns {Promise<boolean>} True si le proxy est disponible
   */
  static async checkProxyStatus() {
    try {
      const response = await fetch(`${this.proxyUrl}/api/test`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000)
      });

      return response.ok;
    } catch (error) {
      console.warn('⚠️ Proxy indisponible:', error.message);
      return false;
    }
  }

  /**
   * Connexion automatique avec les tokens sauvegardés
   * @returns {Promise<Object|null>} Données utilisateur ou null si échec
   */
  static async attemptAutoLogin() {
    try {
      const savedTokens = cookieUtils.getTokens();
      
      if (!savedTokens.phpsessid?.trim()) {
        console.log('ℹ️ Aucun token sauvegardé pour la connexion auto');
        return null;
      }

      console.log('🔄 Tentative de connexion automatique...');

      // Vérifier d'abord le statut de session
      const sessionStatus = await this.checkSessionStatus(savedTokens.phpsessid);
      
      if (!sessionStatus.sessionActive) {
        console.log('⏰ Session expirée, nettoyage des cookies');
        cookieUtils.clearTokens();
        return null;
      }

      // Session active, récupérer les données
      const studentData = await this.fetchStudentData(
        savedTokens.phpsessid,
        savedTokens.csrftoken
      );

      console.log('✅ Connexion automatique réussie');

      return {
        ...studentData,
        authenticated: true,
        authMethod: 'Auto Login',
        loginTime: new Date().toISOString(),
        phpsessid: savedTokens.phpsessid,
        csrftoken: savedTokens.csrftoken,
        moodleSession: cookieUtils.get('MoodleSession') || '',
        proxyUrl: this.proxyUrl
      };

    } catch (error) {
      console.warn('⚠️ Connexion automatique échouée:', error.message);

      // Si erreur de session/token, nettoyer les cookies
      if (error.message.includes('session') ||
          error.message.includes('token') ||
          error.message.includes('expiré')) {
        console.log('🧹 Nettoyage des cookies invalides');
        cookieUtils.clearTokens();
      }

      return null;
    }
  }

  /**
   * Rafraîchit les données utilisateur existantes
   * @param {Object} currentUser - Utilisateur actuel
   * @param {Object} options - Options de rafraîchissement
   * @returns {Promise<Object>} Données utilisateur mises à jour
   */
  static async refreshUserData(currentUser, options = {}) {
    try {
      console.log('🔄 Actualisation des données utilisateur...');

      const { preserveAbsences = true } = options;

      if (!currentUser?.phpsessid) {
        throw new Error('Aucun token de session disponible');
      }

      // Récupérer les nouvelles données ScoDoc
      const updatedStudentData = await this.fetchStudentData(
        currentUser.phpsessid,
        currentUser.csrftoken || ''
      );

      // Construire l'utilisateur mis à jour
      const updatedUser = {
        ...updatedStudentData,
        authenticated: true,
        authMethod: currentUser.authMethod,
        loginTime: new Date().toISOString(),
        phpsessid: currentUser.phpsessid,
        csrftoken: currentUser.csrftoken,
        moodleSession: currentUser.moodleSession,
        proxyUrl: currentUser.proxyUrl
      };

      // Préserver les données d'absences si demandé
      if (preserveAbsences && currentUser.rawData?.absencesData) {
        updatedUser.rawData = {
          ...updatedUser.rawData,
          absencesData: currentUser.rawData.absencesData
        };
      }

      console.log('✅ Données utilisateur actualisées');
      return updatedUser;

    } catch (error) {
      console.error('❌ Erreur actualisation:', error);
      throw error;
    }
  }

  /**
   * Met à jour les données d'absences d'un utilisateur
   * @param {Object} currentUser - Utilisateur actuel
   * @returns {Promise<Object>} Utilisateur avec données d'absences mises à jour
   */
  static async updateAbsencesData(currentUser) {
    try {
      if (!currentUser?.moodleSession) {
        throw new Error('Session Moodle requise pour les données d\'absences');
      }

      const absencesData = await this.fetchAbsencesData(currentUser.moodleSession);

      const updatedUser = {
        ...currentUser,
        rawData: {
          ...currentUser.rawData,
          absencesData
        }
      };

      console.log('✅ Données d\'absences mises à jour');
      return updatedUser;

    } catch (error) {
      console.error('❌ Erreur mise à jour absences:', error);
      throw error;
    }
  }
}

export default StudentInfos;