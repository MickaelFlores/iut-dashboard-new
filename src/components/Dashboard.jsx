import React, { useState, useEffect } from 'react'
import { cookieUtils } from '../utils/cookies';
import StudentInfos from '../services/StudentInfos';
import {
  GraduationCap,
  TrendingUp,
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
  UserCheck,
  X
} from 'lucide-react';


const ModernStudentDashboard = ({ user, onLogout, onRefresh }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showAbsencesDetail, setShowAbsencesDetail] = useState(false);
  const [loadingAbsences, setLoadingAbsences] = useState(false);



  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);



  const enhancedData = StudentInfos.extractAbsencesData(user?.rawData);



  const fetchAbsencesData = async () => {
    setLoadingAbsences(true);

    try {
      const moodleSession = cookieUtils.get('MoodleSession') || user?.moodleSession;

      if (!moodleSession) {
        throw new Error('Session Moodle requise pour récupérer les absences');
      }

      const updatedUser = await StudentInfos.updateAbsencesData({
        ...user,
        moodleSession
      });

      onRefresh(updatedUser);

    } catch (error) {
      console.error('❌ Erreur récupération absences:', error);
      console.error('Erreur lors du chargement des absences: ' + error.message);
    } finally {
      setLoadingAbsences(false);
    }
  };


  // 🚀 AUTO-FETCH DES ABSENCES AU LANCEMENT
  useEffect(() => {
    // Vérifier si on a un utilisateur et qu'on n'a pas déjà les données d'absences
    if (user && !user.rawData?.absencesData) {
      console.log('🔄 Auto-fetch des données d\'absences au lancement...');
      fetchAbsencesData();
    }
  }, [user]);

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
  // Couleur basée sur la moyenne
  const getMoyenneColor = (moyenne) => {
    const moyenneNum = parseFloat(moyenne);
    if (moyenneNum >= 14) return 'text-green-600 bg-green-50 border-green-200';
    if (moyenneNum >= 12) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (moyenneNum >= 10) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header moderne */}
      <header className="w-full border-b bg-white bg-opacity-90 backdrop-blur-md sticky top-0 z-10">
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

            {/* Alertes importantes - Absences */}
            {enhancedData && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg cursor-pointer hover:shadow-md transition-all"
                onClick={() => {
                  if (!enhancedData.absencesData) {
                    console.log('🔄 Pas de données absences, lancement fetch...');
                    fetchAbsencesData();
                  } else {
                    console.log('📊 Données absences disponibles:', enhancedData.absencesData);


                  }
                  setShowAbsencesDetail(true);
                }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <UserCheck className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 mb-1">
                        Suivi des absences
                      </h3>
                      {enhancedData.absencesData ? (
                        <div className="space-y-1">
                          <p className="text-sm text-blue-700">
                            {enhancedData.totalAbsences} absence(s) • {enhancedData.totalInjustifiees} injustifiée(s) • {enhancedData.totalRetards} retard(s)
                          </p>
                          {enhancedData.derniereAbsence && (
                            <p className="text-xs text-blue-600">
                              Dernière absence: {enhancedData.derniereAbsence}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm text-blue-700">
                            Cliquez pour charger vos données d'absences
                          </p>
                          <p className="text-xs text-blue-600">
                            Données non chargées
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                </div>
                {loadingAbsences && (
                  <div className="mt-3 flex items-center text-xs text-blue-600">
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                    Chargement des données...
                  </div>
                )}
                {loadingAbsences && (
                  <div className="mt-3 flex items-center text-xs text-blue-600">
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                    Chargement des données...
                  </div>
                )}
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

        {/* Modal détail des absences */}
        {showAbsencesDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center">
                      <UserCheck className="w-6 h-6 mr-2" />
                      Détail des absences
                    </h3>
                    {enhancedData?.absencesData?.nomEtudiant && (
                      <p className="text-blue-100 mt-1">{enhancedData.absencesData.nomEtudiant}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAbsencesDetail(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {enhancedData?.absencesData ? (
                  <div className="space-y-6">
                    {/* Totaux */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-4 text-blue-900">Totaux</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{enhancedData.totalAbsences}</div>
                          <div className="text-sm text-blue-700">Total absences</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{enhancedData.totalInjustifiees}</div>
                          <div className="text-sm text-red-700">Injustifiées</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{enhancedData.totalJustifiees}</div>
                          <div className="text-sm text-green-700">Justifiées</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{enhancedData.totalRetards}</div>
                          <div className="text-sm text-orange-700">Retards</div>
                        </div>
                      </div>
                    </div>

                    {/* Détail des absences */}
                    {enhancedData.absencesData?.detailAbsences?.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Détail des absences</h4>
                        <div className="bg-white border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left p-3 font-medium text-gray-900">Date</th>
                                  <th className="text-left p-3 font-medium text-gray-900">Cours</th>
                                  <th className="text-left p-3 font-medium text-gray-900">Enseignant</th>
                                  <th className="text-left p-3 font-medium text-gray-900">Type</th>
                                  <th className="text-left p-3 font-medium text-gray-900">Statut</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {enhancedData.absencesData.detailAbsences.map((absence, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="p-3">{absence.date}</td>
                                    <td className="p-3 font-medium">{absence.cours}</td>
                                    <td className="p-3">{absence.enseignant}</td>
                                    <td className="p-3">{absence.type}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${absence.statut === 'injustifiée' ? 'bg-red-100 text-red-800' :
                                        absence.statut === 'justifiée' ? 'bg-green-100 text-green-800' :
                                          absence.statut === 'retard' ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {absence.statut}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      {loadingAbsences ? (
                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">
                      {loadingAbsences ? 'Chargement des données d\'absences...' : 'Aucune donnée d\'absence disponible'}
                    </p>
                    {!loadingAbsences && (
                      <button
                        onClick={fetchAbsencesData}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Réessayer
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
