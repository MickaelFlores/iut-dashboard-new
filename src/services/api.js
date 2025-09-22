import axios from 'axios';

// Configuration axios
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://iam-mickael.me/dashboard' 
    : 'http://localhost:3001',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expirée - redirection vers login
      console.log('Session expirée, redirection...');
    }
    return Promise.reject(error);
  }
);

// API d'authentification CAS
export const authAPI = {
  // Authentifier avec identifiants CAS
  login: (credentials) => api.post('/api/auth/cas/login', credentials),
  
  // Vérifier le statut de connexion
  getStatus: () => api.get('/api/auth/status'),
  
  // Se déconnecter
  logout: () => api.post('/api/auth/logout'),
};

// API des données étudiant (simulées pour le développement)
export const studentAPI = {
  // Récupérer toutes les données étudiant
  getData: () => {
    // Retourner des données simulées pour le développement
    return Promise.resolve({
      data: {
        nom: "Florrres",
        prenom: "Mickkkael",
        email: "mickael.flores@etu.iut-blagnac.fr",
        formation: "BUT Informatique",
        semestre: 3,
        annee: "2024-2025",
        groupe_td: "3",
        groupe_tp: "A",
        moyenne_generale: "14.5",
        classement: "12",
        total_etudiants: 45,
        moyenne_promo: "12.8",
        ects_acquis: 90,
        ects_total: 120,
        date_debut: "2024-09-01",
        date_fin: "2025-01-31",
        stats: {
          total_ues: 6,
          ues_avec_notes: 6,
          progression_ects: 75
        },
        absences: {
          injustifiees: 2,
          justifiees: 1,
          retards: 0
        },
        agenda: [
          {
            titre: "Examen Algorithmique",
            date: "2024-12-15",
            lieu: "Amphi A"
          },
          {
            titre: "Projet tutoré - Soutenance",
            date: "2024-12-20",
            lieu: "Salle B102"
          }
        ],
        ues: {
          "RT3.01": {
            titre: "Administrer des systèmes informatiques communicants complexes",
            moyenne: "15.2",
            rang: "8",
            total_etudiants: 45,
            ects_acquis: 5,
            ects_total: 5,
            couleur: "#3B82F6"
          },
          "RT3.02": {
            titre: "Déployer des services dans une architecture réseau",
            moyenne: "13.8",
            rang: "15",
            total_etudiants: 45,
            ects_acquis: 4,
            ects_total: 4,
            couleur: "#10B981"
          },
          "RT3.03": {
            titre: "Maintenir et sécuriser une architecture réseau",
            moyenne: "14.1",
            rang: "12",
            total_etudiants: 45,
            ects_acquis: 4,
            ects_total: 4,
            couleur: "#F59E0B"
          },
          "RT3.04": {
            titre: "Créer des outils et applications informatiques",
            moyenne: "16.0",
            rang: "5",
            total_etudiants: 45,
            ects_acquis: 3,
            ects_total: 3,
            couleur: "#EF4444"
          },
          "RT3.05": {
            titre: "Coordonner la mise en place d'une architecture réseau",
            moyenne: "12.5",
            rang: "20",
            total_etudiants: 45,
            ects_acquis: 2,
            ects_total: 3,
            couleur: "#8B5CF6"
          },
          "RT3.06": {
            titre: "Piloter un projet informatique",
            moyenne: "14.8",
            rang: "10",
            total_etudiants: 45,
            ects_acquis: 2,
            ects_total: 2,
            couleur: "#06B6D4"
          }
        },
        session_age: Date.now() - 1800000 // 30 minutes ago
      }
    });
  },
  
  // Rafraîchir les données
  refresh: () => studentAPI.getData(),
  
  // Récupérer les détails d'une UE
  getUEDetails: (ueCode) => api.get(`/api/ue/${ueCode}`),
  
  // Test de connectivité
  ping: () => api.get('/health'),
};

// Utilitaires
export const handleAPIError = (error) => {
  if (error.code === 'ECONNABORTED') {
    return 'Timeout - Le serveur met trop de temps à répondre';
  }
  
  if (error.response) {
    switch (error.response.status) {
      case 401:
        return 'Session expirée, veuillez vous reconnecter';
      case 403:
        return 'Accès interdit';
      case 404:
        return 'Service non trouvé';
      case 408:
        return 'Timeout du serveur';
      case 500:
        return 'Erreur serveur interne';
      default:
        return error.response.data?.error || 'Erreur inconnue';
    }
  }
  
  if (error.request) {
    return 'Impossible de contacter le serveur';
  }
  
  return error.message || 'Erreur inattendue';
};

export default api;