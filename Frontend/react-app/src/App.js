import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './styles/App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PlanningPage from './pages/PlanningPage';
import ProjectsPage from './pages/ProjectsPage';
import ReportingPage from './pages/ReportingPage';
import ReportingManagerPage from './pages/ReportingManagerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { jours, types } from './utils/constants';
import TopBar from './components/TopBar';
import AdminUsersPage from './pages/AdminUsersPage';
import { apiFetch } from './utils/api';

function App() {
  const [date, setDate] = useState(new Date());
  const [presences, setPresences] = useState([null, null, null, null, null]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - jan1) / 86400000);
    return Math.ceil((days + jan1.getDay() + 1) / 7);
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [projetsByWeek, setProjetsByWeek] = useState({});
  const weekKey = `${selectedYear}-${selectedWeek}`;
  const projets = Array.isArray(projetsByWeek[weekKey]) ? projetsByWeek[weekKey] : [];

  // Simuler l'authentification (à remplacer par une vraie logique plus tard)
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('jwt'));
  const [role, setRole] = useState('');

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        setRole(payload.role || '');
      } catch {
        setRole('');
      }
    } else {
      setRole('');
    }
  }, [isAuthenticated]);

  // Charger les présences pour la semaine sélectionnée
  useEffect(() => {
    setLoading(true);
    apiFetch('/presences', {
      params: { week: selectedWeek, year: selectedYear }
    })
      .then(data => {
        setPresences(Array.isArray(data.presences) ? data.presences : [null, null, null, null, null]);
        setLoading(false);
      })
      .catch(() => {
        setPresences([null, null, null, null, null]);
        setLoading(false);
      });
  }, [selectedWeek, selectedYear, isAuthenticated]);

  // Fonction globale pour charger les projets d'une semaine
  const fetchProjets = useCallback(async (year = selectedYear, week = selectedWeek) => {
    try {
      const data = await apiFetch('/projets', {
        params: { week, year }
      });
      setProjetsByWeek(prev => ({ ...prev, [`${year}-${week}`]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error('Erreur lors du fetchProjects:', err);
    }
  }, [selectedYear, selectedWeek]);

  useEffect(() => {
    fetchProjets();
  }, [selectedWeek, selectedYear, isAuthenticated, fetchProjets]);

  // Trouver l'index du jour d'aujourd'hui (0 = Lundi, 4 = Vendredi)
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? null : today.getDay() - 1; // 0 = Lundi, 6 = Dimanche
  let todayPresenceLabel = 'Non renseigné';
  if (todayIndex !== null && todayIndex >= 0 && todayIndex < presences.length) {
    const idx = presences[todayIndex];
    if (typeof idx === 'number' && types[idx]) {
      todayPresenceLabel = types[idx].label;
    }
  }

  // Trouver la dernière semaine remplie si la semaine courante est vide
  // Désormais, on affiche uniquement la semaine courante, sans fallback sur d'anciennes semaines
  let displayProjets = projets;

  useEffect(() => {
    // Réinitialise les données à chaque changement d'utilisateur
    setPresences([null, null, null, null, null]);
    setProjetsByWeek({});
    fetchProjets();
  }, [isAuthenticated, fetchProjets]);

  const reloadPresences = () => {
    setLoading(true);
    apiFetch('/presences', {
      params: { week: selectedWeek, year: selectedYear }
    })
      .then(data => {
        setPresences(Array.isArray(data.presences) ? data.presences : [null, null, null, null, null]);
        setLoading(false);
      })
      .catch(() => {
        setPresences([null, null, null, null, null]);
        setLoading(false);
      });
  };

  return (
    <Router>
      <div className="DashboardBg">
        {isAuthenticated && <TopBar setIsAuthenticated={setIsAuthenticated} />}
        <Routes>
          <Route path="/admin/users" element={<AdminUsersPage />} />
          {!isAuthenticated ? (
            <>
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />
              <Route path="/" element={
                <div className="DashboardContent">
                  <div className="CardGroup">
                    <div className="Card InfosCard">
                      <div className="CardTitle">Aujourd'hui</div>
                      <div className="UI">{todayPresenceLabel}</div>
                      <div className="Projet">
                        {projets.length === 0 ? (
                          <span style={{ color: '#888' }}>Aucun projet</span>
                        ) : (
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {projets.map((p, idx) => (
                              <li key={idx} style={{ marginBottom: 2 }}>
                                {p.nom} <span style={{ color: '#43a047', fontWeight: 600 }}>({p.pourcentage}%)</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="Card SemaineCard">
                      <div className="CardTitle">Cette semaine</div>
                      {presences.every(n => n === null) ? (
                        <div style={{ color: '#e53935', fontWeight: 600, margin: '12px 0' }}>
                          Aucune donnée de présence pour la semaine courante. Remplissez et validez votre planning !
                        </div>
                      ) : (
                        <div className="JoursLigne">
                          {jours.map((jour, j) => (
                            <div className="JourColonne" key={jour}>
                              <div className="JourNom">{jour}</div>
                              <div className="Checkboxes">
                                {(() => {
                                  // Vérifie si le jour est férié
                                  const date = new Date(selectedYear, 0, 1);
                                  date.setDate(date.getDate() + (selectedWeek - 1) * 7 + j - date.getDay() + 1);
                                  const mois = (date.getMonth() + 1).toString().padStart(2, '0');
                                  const jourNum = date.getDate().toString().padStart(2, '0');
                                  const dateStr = `${date.getFullYear()}-${mois}-${jourNum}`;
                                  // Liste des jours fériés pour l'année
                                  const holidays = require('./utils/getFrenchHolidays').getFrenchHolidays(selectedYear);
                                  if (holidays.includes(dateStr)) {
                                    return null; // N'affiche rien si férié
                                  }
                                  return types.map((type, i) => (
                                    presences[j] === i ? (
                                      <label key={type.label} className="CheckboxLabel">
                                        <input type="checkbox" checked disabled readOnly />
                                        <span className="CustomCheckbox" style={{ background: type.color }}></span>
                                      </label>
                                    ) : null
                                  ));
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {presences.every(n => n === null) ? null : (
                        displayProjets.length > 0 && (
                          <div style={{ marginTop: 18, background: '#e3eafc', borderRadius: 10, padding: 12, color: '#1976d2', fontWeight: 500, fontSize: 15 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>Projets de la semaine :</div>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {displayProjets.map((p, idx) => (
                                <li key={idx} style={{ marginBottom: 2 }}>
                                  {p.nom} <span style={{ color: '#43a047', fontWeight: 600 }}>({p.pourcentage}%)</span>
                                  {p.commentaire ? <span style={{ color: '#888', fontStyle: 'italic', marginLeft: 8 }}>{p.commentaire}</span> : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="CalendarContainerVisible">
                    <Calendar onChange={setDate} value={date} />
                  </div>
                </div>
              } />
              <Route path="/planning" element={
                <PlanningPage
                  presences={presences}
                  setPresences={setPresences}
                  types={types}
                  jours={jours}
                  loading={loading}
                  reloadPresences={reloadPresences}
                />
              } />
              <Route path="/projets" element={<ProjectsPage
                projetsByWeek={projetsByWeek}
                setProjetsByWeek={setProjetsByWeek}
                fetchProjets={fetchProjets}
              />} />
              <Route path="/reporting" element={<ReportingPage />} />
              {(role === 'admin' || role === 'superadmin' || role === 'manager') && (
                <Route path="/reporting-manager" element={<ReportingManagerPage />} />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
