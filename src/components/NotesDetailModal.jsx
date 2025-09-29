import React, { useState } from 'react';
import { X, TrendingUp, BookOpen, ChevronDown, ChevronUp, Award, Target, BarChart3, Star, Medal, Trophy } from 'lucide-react';
import StudentInfos from '../hooks/StudentInfos';

const NotesDetailModal = ({ isOpen, onClose, user }) => {
    const [expandedCompetences, setExpandedCompetences] = useState({});
    const [activeTab, setActiveTab] = useState('competences');

    if (!isOpen) return null;

    // Parser les données détaillées des notes
    const detailedNotes = StudentInfos.parseDetailedNotes(user?.rawData);

    if (!detailedNotes) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
                <div className="bg-white rounded-2xl max-h-[10vh] max-w-3xl p-8 shadow-2xl">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Données non disponibles</h3>
                        <p className="text-gray-600 mb-6">Impossible de charger les détails des notes.</p>
                        <button
                            onClick={onClose}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const toggleCompetence = (competenceId) => {
        setExpandedCompetences(prev => ({
            ...prev,
            [competenceId]: !prev[competenceId]
        }));
    };

    const getMoyenneColor = (moyenne) => {
        if (moyenne === '~' || moyenne === '' || moyenne === null) return 'text-gray-500 bg-gray-50';
        const moyenneNum = parseFloat(moyenne);
        if (isNaN(moyenneNum)) return 'text-gray-500 bg-gray-50';
        if (moyenneNum >= 16) return 'text-emerald-700 bg-emerald-50';
        if (moyenneNum >= 14) return 'text-green-700 bg-green-50';
        if (moyenneNum >= 12) return 'text-blue-700 bg-blue-50';
        if (moyenneNum >= 10) return 'text-amber-700 bg-amber-50';
        return 'text-red-700 bg-red-50';
    };

    const getMoyenneBadgeColor = (moyenne) => {
        if (moyenne === '~' || moyenne === '' || moyenne === null) return 'bg-gray-100 text-gray-600';
        const moyenneNum = parseFloat(moyenne);
        if (isNaN(moyenneNum)) return 'bg-gray-100 text-gray-600';
        if (moyenneNum >= 16) return 'bg-emerald-500 text-white';
        if (moyenneNum >= 14) return 'bg-green-500 text-white';
        if (moyenneNum >= 12) return 'bg-blue-500 text-white';
        if (moyenneNum >= 10) return 'bg-amber-500 text-white';
        return 'bg-red-500 text-white';
    };

    const getRankIcon = (moyenne) => {
        if (moyenne === '~' || moyenne === '' || moyenne === null) return null;
        const moyenneNum = parseFloat(moyenne);
        if (isNaN(moyenneNum)) return null;
        if (moyenneNum >= 16) return <Trophy className="w-4 h-4" />;
        if (moyenneNum >= 14) return <Medal className="w-4 h-4" />;
        if (moyenneNum >= 12) return <Star className="w-4 h-4" />;
        return null;
    };

    const formatNote = (note) => {
        if (note === '~' || note === '' || note === null || note === undefined) return '~';
        return note;
    };

    const tabs = [
        {
            id: 'competences',
            label: 'Compétences par UE',
            icon: Award,
            count: detailedNotes.competences.length
        },
        {
            id: 'ressources',
            label: 'Ressources détaillées',
            icon: BookOpen,
            count: detailedNotes.ressources.length
        },
        {
            id: 'saes',
            label: 'SAÉ',
            icon: Target,
            count: detailedNotes.saes.length
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
            <div className="bg-white rounded-2xl max-w-7xl w-full h-[80vh] flex flex-col shadow-2xl">
                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center mb-3">
                                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        Détail des Notes - Semestre {detailedNotes.semestre.numero}
                                    </h2>
                                    <p className="text-blue-100">
                                        {user?.prenom} {user?.nom}
                                    </p>
                                </div>
                            </div>

                            {/* Stats principales */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {detailedNotes.semestre.moyenne_generale}
                                    </div>
                                    <div className="text-blue-100 text-sm">Moyenne générale</div>
                                </div>
                                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {detailedNotes.semestre.rang_general.split('/')[0]}
                                    </div>
                                    <div className="text-blue-100 text-sm">Rang</div>
                                </div>
                                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {detailedNotes.semestre.min_promo}
                                    </div>
                                    <div className="text-blue-100 text-sm">Min promo</div>
                                </div>
                                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {detailedNotes.semestre.max_promo}
                                    </div>
                                    <div className="text-blue-100 text-sm">Max promo</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-3 transition-all duration-200 ml-4"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Navigation par onglets améliorée */}
                <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0">
                    <div className="flex overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-6 py-4 font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-white hover:bg-opacity-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${activeTab === tab.id
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Contenu avec scroll amélioré */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {/* Bannière d'information */}
                    <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                        <div className="flex items-start">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">Information importante</h3>
                                <p className="text-blue-700 text-sm leading-relaxed">
                                    La moyenne des ressources dans une UE dépend des poids donnés aux évaluations.
                                    Les coefficients peuvent varier selon les compétences ciblées.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tab: Compétences */}
                    {activeTab === 'competences' && (
                        <div className="space-y-6">
                            {detailedNotes.competences.map((competence) => (
                                <div key={competence.id} className="bg-white border border-gray-200 rounded-2xl flex-1 overflow-y-auto shadow-sm hover:shadow-md transition-shadow">
                                    <div
                                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                        style={{ borderLeft: `5px solid ${competence.color}` }}
                                        onClick={() => toggleCompetence(competence.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center mb-3">
                                                    <h4 className="font-semibold text-xl text-gray-900 mr-3">
                                                        {competence.id}
                                                    </h4>
                                                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getMoyenneBadgeColor(competence.moyenne)}`}>
                                                        {getRankIcon(competence.moyenne)}
                                                        {formatNote(competence.moyenne)}
                                                    </div>
                                                </div>
                                                <h5 className="text-gray-700 font-medium mb-3">{competence.nom}</h5>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Rang</div>
                                                        <div className="font-semibold text-gray-900">{competence.rang}</div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">ECTS</div>
                                                        <div className="font-semibold text-gray-900">{competence.ects}</div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Bonus</div>
                                                        <div className="font-semibold text-green-600">{competence.bonus}</div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Malus</div>
                                                        <div className="font-semibold text-red-600">{competence.malus}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-gray-400 ml-4">
                                                {expandedCompetences[competence.id] ? (
                                                    <ChevronUp className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedCompetences[competence.id] && (
                                        <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50">
                                            <div className="pt-6 space-y-6">
                                                {/* Ressources */}
                                                {competence.ressources.length > 0 && (
                                                    <div>
                                                        <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                                                            <BookOpen className="w-4 h-4 mr-2" />
                                                            Ressources ({competence.ressources.length})
                                                        </h5>
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            {competence.ressources.map((ressource, index) => (
                                                                <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="font-medium text-gray-900 text-sm">
                                                                            {ressource.code}
                                                                        </span>
                                                                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${getMoyenneColor(ressource.moyenne)}`}>
                                                                            {formatNote(ressource.moyenne)}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ressource.nom}</p>
                                                                    <div className="text-xs text-gray-500">
                                                                        Coefficient: {ressource.coef}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SAEs */}
                                                {competence.saes.length > 0 && (
                                                    <div>
                                                        <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                                                            <Target className="w-4 h-4 mr-2" />
                                                            Situations d'Apprentissage ({competence.saes.length})
                                                        </h5>
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                            {competence.saes.map((sae, index) => (
                                                                <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="font-medium text-gray-900 text-sm">
                                                                            {sae.code}
                                                                        </span>
                                                                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${getMoyenneColor(sae.moyenne)}`}>
                                                                            {formatNote(sae.moyenne)}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{sae.nom}</p>
                                                                    <div className="text-xs text-gray-500">
                                                                        Coefficient: {sae.coef}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab: Ressources détaillées */}
                    {activeTab === 'ressources' && (
                        <div className="space-y-6">
                            {detailedNotes.ressources.map((ressource) => (
                                <div key={ressource.code} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h4 className="font-semibold text-xl text-gray-900 mb-1">
                                                {ressource.code}
                                            </h4>
                                            <p className="text-gray-600">{ressource.nom}</p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-lg font-bold flex items-center gap-2 ${getMoyenneBadgeColor(ressource.moyenne)}`}>
                                            {getRankIcon(ressource.moyenne)}
                                            {formatNote(ressource.moyenne)}
                                        </div>
                                    </div>

                                    {ressource.evaluations && ressource.evaluations.length > 0 ? (
                                        <div className="space-y-4">
                                            <h5 className="font-medium text-gray-800">Évaluations ({ressource.evaluations.length})</h5>
                                            {ressource.evaluations.map((evaluation, index) => (
                                                <div key={index} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="font-medium text-gray-900">
                                                            {evaluation.description || `Évaluation ${index + 1}`}
                                                        </span>
                                                        <div className={`px-3 py-1 rounded-lg font-bold ${getMoyenneBadgeColor(evaluation.note?.value)}`}>
                                                            {formatNote(evaluation.note?.value)}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="bg-white rounded-lg p-3">
                                                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Coefficient</div>
                                                            <div className="font-semibold text-gray-900">{evaluation.coef || '~'}</div>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3">
                                                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Maximum</div>
                                                            <div className="font-semibold text-gray-900">{formatNote(evaluation.note?.max)}</div>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3">
                                                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Moyenne</div>
                                                            <div className="font-semibold text-gray-900">{formatNote(evaluation.note?.moy)}</div>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3">
                                                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Minimum</div>
                                                            <div className="font-semibold text-gray-900">{formatNote(evaluation.note?.min)}</div>
                                                        </div>
                                                    </div>

                                                    {evaluation.poids && Object.keys(evaluation.poids).length > 0 && (
                                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                            <div className="text-xs font-medium text-blue-800 mb-2">Poids dans les compétences:</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {Object.entries(evaluation.poids)
                                                                    .filter(([_, poids]) => poids > 0)
                                                                    .map(([comp, poids]) => (
                                                                        <span key={comp} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md font-medium">
                                                                            {comp}: {poids}
                                                                        </span>
                                                                    ))
                                                                }
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <BookOpen className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p>Aucune évaluation disponible pour cette ressource</p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {detailedNotes.ressources.length === 0 && (
                                <div className="text-center py-16 text-gray-500">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <BookOpen className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <p className="text-lg">Aucune ressource trouvée</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: SAÉs */}
                    {activeTab === 'saes' && (
                        <div className="space-y-6">
                            {detailedNotes.saes.map((sae) => (
                                <div key={sae.code} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h4 className="font-semibold text-xl text-gray-900 mb-1">
                                                {sae.code}
                                            </h4>
                                            <p className="text-gray-600">{sae.nom}</p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-lg font-bold flex items-center gap-2 ${getMoyenneBadgeColor(sae.moyenne)}`}>
                                            {getRankIcon(sae.moyenne)}
                                            {formatNote(sae.moyenne)}
                                        </div>
                                    </div>

                                    {sae.evaluations && sae.evaluations.length > 0 ? (
                                        <div className="space-y-4">
                                            <h5 className="font-medium text-gray-800">Évaluations ({sae.evaluations.length})</h5>
                                            {sae.evaluations.map((evaluation, index) => (
                                                <div key={index} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="font-medium text-gray-900">
                                                            {evaluation.description || `Évaluation ${index + 1}`}
                                                        </span>
                                                        <div className={`px-3 py-1 rounded-lg font-bold ${getMoyenneBadgeColor(evaluation.note?.value)}`}>
                                                            {formatNote(evaluation.note?.value)}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="bg-white rounded-lg p-3">
                                                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Coefficient</div>
                                                            <div className="font-semibold text-gray-900">{evaluation.coef || '~'}</div>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3">
                                                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Maximum</div>
                                                            <div className="font-semibold text-gray-900">{formatNote(evaluation.note?.max)}</div>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3">
                                                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Moyenne</div>
                                                            <div className="font-semibold text-gray-900">{formatNote(evaluation.note?.moy)}</div>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3">
                                                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Minimum</div>
                                                            <div className="font-semibold text-gray-900">{formatNote(evaluation.note?.min)}</div>
                                                        </div>
                                                    </div>

                                                    {evaluation.poids && Object.keys(evaluation.poids).length > 0 && (
                                                        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                                                            <div className="text-xs font-medium text-purple-800 mb-2">Poids dans les compétences:</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {Object.entries(evaluation.poids)
                                                                    .filter(([_, poids]) => poids > 0)
                                                                    .map(([comp, poids]) => (
                                                                        <span key={comp} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md font-medium">
                                                                            {comp}: {poids}
                                                                        </span>
                                                                    ))
                                                                }
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Target className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p>Aucune évaluation disponible pour cette SAÉ</p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {detailedNotes.saes.length === 0 && (
                                <div className="text-center py-16 text-gray-500">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Target className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <p className="text-lg">Aucune SAÉ trouvée</p>
                                </div>
                            )}
                        </div>
                    )}
                </div> {/* Fermeture du div p-8 */}
            </div> {/* Fermeture du div flex-1 overflow-y-auto */}

            {/* Footer avec statistiques amélioré */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 p-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center">
                            <Award className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                                {detailedNotes.competences.length} compétence(s)
                            </span>
                        </div>
                        <div className="flex items-center">
                            <BookOpen className="w-4 h-4 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                                {detailedNotes.ressources.length} ressource(s)
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Target className="w-4 h-4 text-purple-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                                {detailedNotes.saes.length} SAÉ(s)
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-gray-200">
                        <BarChart3 className="w-4 h-4 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">
                            Semestre {detailedNotes.semestre.numero} - {detailedNotes.semestre.annee}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotesDetailModal;