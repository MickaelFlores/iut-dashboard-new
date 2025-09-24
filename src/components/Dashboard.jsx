import React, { useState, useEffect } from 'react'
import { cookieUtils } from '../utils/cookies';

import {
  User,
  GraduationCap,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  Award,
  Clock,
  Target,
  ChevronRight,
  Settings,
  Bell,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronLeft,
  MapPin,
  UserCheck
} from 'lucide-react';


const ModernStudentDashboard = ({ user, onLogout, onRefresh }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);

  // Mock data pour l'emploi du temps
  const mockSchedule = {
    timeSlots: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
    courses: {
      'Lundi': [
        { time: '08:00-10:00', subject: 'Mathématiques', teacher: 'M. Dupont', room: 'A101', type: 'CM' },
        { time: '14:00-16:00', subject: 'Programmation', teacher: 'Mme Martin', room: 'B205', type: 'TP' }
      ],
      'Mardi': [
        { time: '09:00-11:00', subject: 'Physique', teacher: 'M. Durand', room: 'C302', type: 'TD' },
        { time: '14:00-17:00', subject: 'Projet', teacher: 'M. Lefebvre', room: 'Lab1', type: 'Projet' }
      ],
      'Mercredi': [
        { time: '08:00-12:00', subject: 'Stage entreprise', teacher: '', room: 'Externe', type: 'Stage' }
      ],
      'Jeudi': [
        { time: '10:00-12:00', subject: 'Anglais', teacher: 'Mrs. Smith', room: 'A203', type: 'TD' },
        { time: '14:00-16:00', subject: 'Bases de données', teacher: 'M. Garcia', room: 'B104', type: 'CM' }
      ],
      'Vendredi': [
        { time: '09:00-12:00', subject: 'Projet tutoré', teacher: 'Équipe pédago', room: 'B301', type: 'Projet' }
      ]
    }
  };

  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Extraction des données
  const extractEnhancedData = (rawData) => {
    if (!rawData) return null;
    const auth = rawData.auth || {};
    const releve = rawData.relevé || {};
    const absences = rawData.absences || {};

    let totalAbsences = 0;
    let derniereAbsence = null;
    Object.entries(absences).forEach(([date, abs]) => {
      if (Array.isArray(abs)) {
        totalAbsences += abs.length;
        if (!derniereAbsence || new Date(date) > new Date(derniereAbsence)) {
          derniereAbsence = date;
        }
      }
    });

    return {
      sessionId: auth.session || 'Inconnue',
      totalAbsences,
      derniereAbsence,
      etatInscription: releve.etat_inscription === 'I' ? '✅ Inscrit' : '❓ Statut inconnu'
    };
  };

  // Données par défaut
  const defaultData = {
    nom: 'Nom',
    prenom: 'Prénom',
    groupe_td: '0',
    groupe_tp: '0',
    moyenne_generale: '0',
    classement: '0',
    total_etudiants: '0',
    semestre: '0',
    annee: '0'
  };

  const data = { ...defaultData, ...user };
  const enhancedData = extractEnhancedData(user?.rawData);

  // Couleur basée sur la moyenne
  const getMoyenneColor = (moyenne) => {
    const moyenneNum = parseFloat(moyenne);
    if (moyenneNum >= 14) return 'text-green-600 bg-green-50 border-green-200';
    if (moyenneNum >= 12) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (moyenneNum >= 10) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Obtenir le prochain cours
  const getNextCourse = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('fr-FR', { weekday: 'long' });
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const todayCourses = mockSchedule.courses[currentDay] || [];

    for (const course of todayCourses) {
      const [startTime] = course.time.split('-');
      const [hours, minutes] = startTime.split(':').map(Number);
      const courseTime = hours * 100 + minutes;

      if (courseTime > currentTime) {
        return { ...course, day: currentDay, isToday: true };
      }
    }

    // Si aucun cours aujourd'hui, chercher le prochain jour
    const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const currentDayIndex = dayOrder.indexOf(currentDay);

    for (let i = 1; i < dayOrder.length; i++) {
      const nextDayIndex = (currentDayIndex + i) % dayOrder.length;
      const nextDay = dayOrder[nextDayIndex];
      const nextDayCourses = mockSchedule.courses[nextDay] || [];

      if (nextDayCourses.length > 0) {
        return { ...nextDayCourses[0], day: nextDay, isToday: false };
      }
    }

    return null;
  };

  const nextCourse = getNextCourse();

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'CM': 'bg-blue-100 text-blue-800 border-blue-200',
      'TD': 'bg-green-100 text-green-800 border-green-200',
      'TP': 'bg-purple-100 text-purple-800 border-purple-200',
      'Projet': 'bg-orange-100 text-orange-800 border-orange-200',
      'Stage': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header moderne */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-5">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Dashboard IUT</h1>
                <p className="text-sm text-muted-foreground">Bienvenue, {data.prenom}</p>
              </div>
            </div>

            {/* Actions header */}
            <div className="flex items-center gap-3">
              {enhancedData && (
                <div className="hidden sm:flex items-center text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Session active
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  console.log('🔓 Déconnexion et nettoyage cookies...');
                  cookieUtils.clearTokens();
                  onLogout();
                }}
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto px-5 py-8">
        {/* Section principale avec infos rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Carte principale avec prochain cours */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Salut {data.prenom} ! 👋 {data.groupe_td}{data.groupe_tp}
                  </h2>
                  <p className="text-muted-foreground mb-1">
                    {currentTime.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    {currentTime.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-foreground">{data.semestre}</div>
                  <div className="text-muted-foreground text-sm">{data.annee}</div>
                </div>
              </div>
            </div>

            {/* Alertes importantes */}
            {enhancedData && enhancedData.totalAbsences > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Attention aux absences
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Vous avez {enhancedData.totalAbsences} absence(s) enregistrée(s).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats rapides */}
          <div className="space-y-4">
            {/* Moyenne */}
            <div className={`p-4 rounded-xl border-2 ${getMoyenneColor(data.moyenne_generale)}`}>
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-2xl font-bold">{data.moyenne_generale}</span>
              </div>
              <h3 className="font-semibold">Moyenne Générale</h3>
            </div>

            {/* Classement */}
            <div className="bg-white p-4 rounded-xl border">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-foreground">#{data.classement}</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Classement</h3>
              <p className="text-sm text-muted-foreground">{data.classement}/{data.total_etudiants}</p>
            </div>
          </div>
        </div>

        {/* Intégration directe de l'emploi du temps */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="bg-secondary p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Planning des cours</h2>
              <div className="flex items-center gap-2">
                <a
                  href="https://iam-mickael.me/flop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                  Ouvrir en plein écran
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>


          {/* iframe pour intégrer le planning */}
          <div className="relative" style={{ height: '1000px' }}>
            <iframe
              src="https://iam-mickael.me/flop-no-head"
              className="w-full h-full border-0"
              onLoad={() => {
                window.scrollTo({
                  top: document.body.scrollHeight - 200,
                  behavior: "smooth"
                });
              }}
              title="Emploi du temps"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{
                minHeight: '1000px',
                background: 'white'
              }
              }
            />

            {/* Overlay de chargement */}
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm"
              style={{
                opacity: loading ? 1 : 0,
                pointerEvents: loading ? 'auto' : 'none',
                transition: 'opacity 0.3s ease'
              }}>
              <div className="flex items-center gap-3 bg-background px-4 py-2 rounded-lg border shadow-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Chargement de l'emploi du temps...</span>
              </div>
            </div>
          </div>

          {/* Footer avec informations */}
          <div className="bg-muted/30 p-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Emploi du temps synchronisé en temps réel</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  En ligne
                </span>
                <button
                  onClick={() => {
                    const iframe = document.querySelector('iframe[title="Emploi du temps"]');
                    if (iframe) {
                      iframe.src = iframe.src;
                    }
                  }}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Actualiser
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides en bas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-between p-4 bg-white rounded-xl border hover:bg-secondary transition-colors"
            onClick={() => {
              window.location.href = "https://scodocetudiant.iut-blagnac.fr";
            }}>
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-blue-600 mr-3" />
              <span className="font-medium text-foreground">Voir toutes les notes</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button className="flex items-center justify-between p-4 bg-white rounded-xl border hover:bg-secondary transition-colors"
            onClick={() => {
              window.location.href = "https://iam-mickael.me/flop";
            }}>
            <div className="flex items-center">

              <Calendar className="w-5 h-5 text-green-600 mr-3" />
              <span className="font-medium text-foreground">Planning complet</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button className="flex items-center justify-between p-4 bg-white rounded-xl border hover:bg-secondary transition-colors">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-purple-600 mr-3" />
              <span className="font-medium text-foreground">Mes objectifs</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernStudentDashboard;