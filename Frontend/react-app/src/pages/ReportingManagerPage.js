import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import { apiFetch } from '../utils/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

const COLORS = ['#1976d2', '#43a047', '#ffa000', '#e53935', '#bdbdbd', '#8e24aa', '#00bcd4', '#fbc02d', '#388e3c', '#d84315'];

export default function ReportingManagerPage() {
  const [users, setUsers] = useState([]);
  const [projets, setProjets] = useState([]);
  const [teams, setTeams] = useState([]);
  const [mode, setMode] = useState('user'); // 'user' ou 'project'
  const [selectedId, setSelectedId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectPeople, setProjectPeople] = useState([]); // Pour la vue par projet
  const [teamStats, setTeamStats] = useState(null); // Pour la vue par équipe
  const [accessDenied, setAccessDenied] = useState(false);
  const navigate = useNavigate();
  const [showAffectModal, setShowAffectModal] = useState(false);
  const [affectProjectId, setAffectProjectId] = useState('');
  const [affectUserId, setAffectUserId] = useState('');
  const [affectLoading, setAffectLoading] = useState(false);
  const [affectError, setAffectError] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [role, setRole] = useState('');
  // Ajoute un state pour stocker l'id équipe sélectionné
  const [affectUserIdEquipe, setAffectUserIdEquipe] = useState('');

  // Protection d'accès
  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    let role = '';
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        role = payload.role || '';
      } catch {}
    }
    if (!(role === 'admin' || role === 'superadmin' || role === 'manager')) {
      setAccessDenied(true);
      setTimeout(() => navigate('/', { state: { error: 'Accès refusé au reporting admin.' } }), 2000);
    }
  }, [navigate]);

  // Charger les listes réelles au montage
  useEffect(() => {
    apiFetch('/utilisateurs').then(data => setUsers(Array.isArray(data) ? data : [])).catch(() => setUsers([]));
    apiFetch('/all-projets').then(data => setProjets(data)).catch(() => setProjets([]));
    apiFetch('/equipes').then(data => setTeams(data)).catch(() => setTeams([]));
  }, []);

  // Décoder le rôle au montage
  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        setRole(payload.role || '');
      } catch {}
    }
  }, []);

  // Charger les membres de l'équipe si manager/supérieur
  useEffect(() => {
    if (role === 'manager' || role === 'admin' || role === 'superadmin') {
      apiFetch('/equipe/membres').then(setTeamMembers).catch(() => setTeamMembers([]));
    }
  }, [role]);

  // DEBUG : afficher les données projets et membres
  console.log('projets:', projets);
  console.log('teamMembers:', teamMembers);

  // Simuler le fetch du reporting selon le mode et l'ID sélectionné
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    if (mode === 'user') {
      // Appel API réel pour le reporting utilisateur
      const today = new Date();
      const startYear = today.getFullYear();
      const startWeek = 1;
      const endYear = today.getFullYear();
      const endWeek = 52;
      apiFetch(`/reporting/user/${selectedId}?startYear=${startYear}&startWeek=${startWeek}&endYear=${endYear}&endWeek=${endWeek}`)
        .then(data => {
          setReport(data);
          setProjectPeople([]);
          setTeamStats(null);
        })
        .catch(() => {
          setReport(null);
          setProjectPeople([]);
          setTeamStats(null);
        })
        .finally(() => setLoading(false));
    } else if (mode === 'project') {
      // Appel API réel pour le reporting projet
      const today = new Date();
      const startYear = today.getFullYear();
      const startWeek = 1;
      const endYear = today.getFullYear();
      const endWeek = 52;
      const projet = projets.find(p => String(p.id) === String(selectedId));
      if (projet) {
        apiFetch(`/reporting/projet/${encodeURIComponent(projet.name)}?startYear=${startYear}&startWeek=${startWeek}&endYear=${endYear}&endWeek=${endWeek}`)
          .then(data => {
            setProjectPeople(data);
            setReport(null);
            setTeamStats(null);
          })
          .catch(() => {
            setProjectPeople([]);
            setReport(null);
            setTeamStats(null);
          })
          .finally(() => setLoading(false));
      } else {
        setProjectPeople([]);
        setReport(null);
        setTeamStats(null);
        setLoading(false);
      }
    } else if (mode === 'team') {
      // Appel API réel pour le reporting équipe
      const today = new Date();
      const startYear = today.getFullYear();
      const startWeek = 1;
      const endYear = today.getFullYear();
      const endWeek = 52;
      apiFetch(`/reporting/team/${selectedId}?startYear=${startYear}&startWeek=${startWeek}&endYear=${endYear}&endWeek=${endWeek}`)
        .then(data => {
          setTeamStats(data);
          setReport(null);
          setProjectPeople([]);
        })
        .catch(() => {
          setTeamStats(null);
          setReport(null);
          setProjectPeople([]);
        })
        .finally(() => setLoading(false));
    }
  }, [mode, selectedId, projets]);

  // Fonction d'affectation
  const handleAffectProject = async () => {
    setAffectLoading(true);
    setAffectError('');
    try {
      // On récupère le projet sélectionné
      const projet = projets.find(p => String(p.id) === String(affectProjectId));
      if (!projet || !affectUserId) {
        setAffectError('Veuillez sélectionner un projet et un membre.');
        setAffectLoading(false);
        return;
      }
      // On met à jour le projet côté API
      await apiFetch('/projets', {
        method: 'POST',
        params: { week: projet.week, year: projet.year },
        body: { projets: [{ ...projet, id_utilisateur: affectUserId, id_equipe: affectUserIdEquipe }] }
      });
      setShowAffectModal(false);
      setAffectProjectId('');
      setAffectUserId('');
      setAffectUserIdEquipe(''); // Reset l'id équipe
      // Recharger les projets
      apiFetch('/all-projets').then(setProjets).catch(() => {});
    } catch (err) {
      setAffectError("Erreur lors de l'affectation.");
    } finally {
      setAffectLoading(false);
    }
  };

  // Remplacer handleExport pour générer un fichier Excel
  const handleExport = () => {
    let ws, wb, data = [];
    if (mode === 'user' && report) {
      const user = users.find(u => String(u.id) === String(selectedId));
      // Ligne d'en-tête avec le nom de l'utilisateur
      const header = user ? [[`Utilisateur : ${user.name}`], []] : [];
      data = report.occupationParProjet.map(p => ({ Projet: p.nom, Pourcentage: p.pourcentage }));
      ws = XLSX.utils.json_to_sheet([]);
      if (header.length) XLSX.utils.sheet_add_aoa(ws, header, { origin: 0 });
      XLSX.utils.sheet_add_json(ws, data, { origin: -1, skipHeader: false });
      wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporting Utilisateur');
      XLSX.writeFile(wb, 'reporting_user.xlsx');
    } else if (mode === 'project' && projectPeople.length > 0) {
      const projet = projets.find(p => String(p.id) === String(selectedId));
      const header = projet ? [[`Projet : ${projet.name}`], []] : [];
      data = projectPeople.map(p => ({ Personne: p.name, Pourcentage: p.pourcentage }));
      ws = XLSX.utils.json_to_sheet([]);
      if (header.length) XLSX.utils.sheet_add_aoa(ws, header, { origin: 0 });
      XLSX.utils.sheet_add_json(ws, data, { origin: -1, skipHeader: false });
      wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporting Projet');
      XLSX.writeFile(wb, 'reporting_project.xlsx');
    } else if (mode === 'team' && teamStats) {
      const team = teams.find(t => String(t.id) === String(selectedId));
      const header = team ? [[`Équipe : ${team.name}`], []] : [];
      data = teamStats.membres.map(m => ({ Personne: m.name, 'Taux de présence': m.taux }));
      ws = XLSX.utils.json_to_sheet([]);
      if (header.length) XLSX.utils.sheet_add_aoa(ws, header, { origin: 0 });
      XLSX.utils.sheet_add_json(ws, data, { origin: -1, skipHeader: false });
      wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporting Équipe');
      XLSX.writeFile(wb, 'reporting_team.xlsx');
    }
  };

  // Lors de l'affichage des utilisateurs, on filtre ceux dont role !== 'superadmin' et role_equipe !== 'superadmin'
  const filteredUsers = users.filter(u => u.role !== 'superadmin' && u.role_equipe !== 'superadmin');

  // Grouper les membres par équipe pour le menu déroulant
  const teamMembersByTeam = teamMembers.reduce((acc, member) => {
    if (!acc[member.id_equipe]) acc[member.id_equipe] = { team_name: member.team_name, members: [] };
    acc[member.id_equipe].members.push(member);
    return acc;
  }, {});

  return (
    <div className="DashboardBg">
      <TopBar />
      {accessDenied ? (
        <div style={{ color: '#e53935', textAlign: 'center', marginTop: 60, fontSize: 22, fontWeight: 700 }}>
          Accès refusé. Redirection...
        </div>
      ) : (
        <div style={{ padding: '32px 48px', maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 6px 32px rgba(25, 118, 210, 0.13)', minHeight: 480 }}>
          <h1 style={{ textAlign: 'center', fontSize: 28, color: '#1976d2', fontWeight: 800, margin: '18px 0 24px 0', letterSpacing: 1 }}>Reporting Manager</h1>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 32 }}>
            <select value={mode} onChange={e => { setMode(e.target.value); setSelectedId(''); }} style={{ fontSize: 16, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #1976d2' }}>
              <option value="user">Par utilisateur</option>
              <option value="project">Par projet</option>
              <option value="team">Par équipe</option>
            </select>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ fontSize: 16, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #1976d2' }}>
              <option value="">Sélectionner...</option>
              {mode === 'user' && filteredUsers.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.prenom} {opt.nom}</option>
              ))}
              {mode === 'project' && projets.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
              {mode === 'team' && teams.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.nom}</option>
              ))}
            </select>
            <button onClick={handleExport} disabled={mode === 'user' ? !report : mode === 'project' ? projectPeople.length === 0 : !teamStats}
             style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, 
             cursor: (mode === 'user' ? !report : mode === 'project' ? projectPeople.length === 0 : !teamStats) ? 'not-allowed' : 'pointer' }}>Exporter Excel</button>
          </div>
          {loading && <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Chargement du reporting...</div>}
          {/* Mode utilisateur */}
          {mode === 'user' && report && !loading && (
            <div style={{ marginTop: 32 }}>
              <h2 style={{ color: '#1976d2', fontSize: 22, fontWeight: 700 }}>Résumé</h2>
              <div style={{ margin: '18px 0', fontSize: 17, color: '#333' }}>
                <div>Taux de présence : <b>{report.tauxPresence} %</b></div>
                <div>Nombre de jours sur site : <b>{report.joursSurSite}</b></div>
                <div style={{ marginTop: 16, fontWeight: 600 }}>Taux d'occupation par projet :</div>
                {selectedId && users.length > 0 ? (
                  (() => {
                    const selectedUser = users.find(u => String(u.id) === String(selectedId));
                    const projetsUtilisateur = selectedUser && selectedUser.projets ? selectedUser.projets : [];
                    if (projetsUtilisateur.length === 0) {
                      return <div style={{ color: '#888', fontSize: 15 }}>Aucun projet sur la période.</div>;
                    }
                    return <>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
                        {projetsUtilisateur.map(p => (
                          <li key={p.nom + '-' + p.year + '-' + p.week}>{p.nom} : <b>{p.pourcentage} %</b> (Semaine {p.week}, {p.year})</li>
                        ))}
                      </ul>
                      <div style={{ width: '100%', maxWidth: 420, height: 260, margin: '24px auto 0 auto' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={projetsUtilisateur}
                              dataKey="pourcentage"
                              nameKey="nom"
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              label={({ name, percent }) => `${name} (${Math.round(percent * 100)}%)`}
                            >
                              {projetsUtilisateur.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} %`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </>;
                  })()
                ) : (
                  <div style={{ color: '#888', fontSize: 15 }}>Aucun projet sur la période.</div>
                )}
              </div>
            </div>
          )}
          {/* Mode projet */}
          {mode === 'project' && !selectedId && (
            <div style={{ marginTop: 32, color: '#888', fontSize: 17, textAlign: 'center' }}>
              Sélectionnez un projet pour voir la répartition.
            </div>
          )}
          {mode === 'project' && selectedId && (
            <div style={{ marginTop: 32 }}>
              <h2 style={{ color: '#1976d2', fontSize: 22, fontWeight: 700 }}>Répartition par personne</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '18px 0' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: 17, color: '#1976d2', fontWeight: 700, padding: 8 }}>Projet</th>
                    <th style={{ textAlign: 'left', fontSize: 17, color: '#1976d2', fontWeight: 700, padding: 8 }}>Affecté à</th>
                  </tr>
                </thead>
                <tbody>
                  {projets.filter(p => String(p.id) === String(selectedId)).map(p => (
                    <tr key={p.id}>
                      <td style={{ padding: 8, fontWeight: 600 }}>{p.name || p.nom}</td>
                      <td style={{ padding: 8 }}>
                        {(() => {
                          const idUser = p.id_utilisateur || p.idUtilisateur || p.utilisateur_id;
                          if (!idUser) return <span style={{ color: '#888' }}>Non affecté</span>;
                          const user = teamMembers.find(u => String(u.id) === String(idUser));
                          return user ? `${user.prenom} ${user.nom}` : <span style={{ color: '#888' }}>Non affecté</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Modal
                open={showAffectModal}
                onClose={() => setShowAffectModal(false)}
                title="Affecter un projet à un membre de l'équipe"
                actions={[
                  <button onClick={handleAffectProject} disabled={affectLoading} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: affectLoading ? 'not-allowed' : 'pointer' }}>Valider</button>,
                  <button onClick={() => setShowAffectModal(false)} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Annuler</button>
                ]}
              >
                <div style={{ marginBottom: 16 }}>
                  <label>Projet&nbsp;:
                    <select value={affectProjectId} onChange={e => setAffectProjectId(e.target.value)} style={{ marginLeft: 8, fontSize: 16, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #1976d2' }}>
                      <option value="">Sélectionner...</option>
                      {projets.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label>Membre de l'équipe&nbsp;:
                    <select
                      value={affectUserId ? `${affectUserId}-${affectUserIdEquipe || ''}` : ''}
                      onChange={e => {
                        const [uid, eid] = e.target.value.split('-');
                        setAffectUserId(uid);
                        setAffectUserIdEquipe(eid);
                      }}
                      style={{ marginLeft: 8, fontSize: 16, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #1976d2' }}
                    >
                      <option value="">Sélectionner...</option>
                      {Object.entries(teamMembersByTeam).map(([id_equipe, group]) => (
                        <optgroup key={id_equipe} label={group.team_name || `Équipe ${id_equipe}`}>
                          {group.members.map(u => (
                            <option key={u.id + '-' + u.id_equipe} value={u.id + '-' + u.id_equipe}>
                              {u.prenom} {u.nom}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                </div>
                {affectError && <div style={{ color: '#e53935', marginTop: 8 }}>{affectError}</div>}
                {affectLoading && <div style={{ color: '#1976d2', marginTop: 8 }}>Affectation en cours...</div>}
              </Modal>
            </div>
          )}
          {/* Mode équipe */}
          {mode === 'team' && teamStats && !loading && (
            <div style={{ marginTop: 32 }}>
              <h2 style={{ color: '#1976d2', fontSize: 22, fontWeight: 700 }}>Statistiques de l'équipe</h2>
              <div style={{ margin: '18px 0', fontSize: 17, color: '#333' }}>
                <div>Taux moyen de présence sur site : <b>{Math.min(100, Math.round(teamStats.tauxMoyen))} %</b></div>
                <div>Nombre de personnes dans l'équipe : <b>{teamStats.nbMembres}</b></div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '18px 0' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: 17, color: '#1976d2', fontWeight: 700, padding: 8 }}>Personne</th>
                    <th style={{ textAlign: 'center', fontSize: 17, color: '#1976d2', fontWeight: 700, padding: 8 }}>Taux de présence (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {teamStats.membres.map(m => (
                    <tr key={m.name}>
                      <td style={{ padding: 8, fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: 8, textAlign: 'center', fontWeight: 600, color: '#43a047' }}>{Math.min(100, Math.round(m.taux))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ width: '100%', maxWidth: 520, height: 260, margin: '32px auto 0 auto' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamStats.membres}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="taux" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '100%', maxWidth: 420, height: 260, margin: '32px auto 0 auto' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={teamStats.camembert.map(c => ({ ...c, value: Math.min(100, c.value) }))}
                      dataKey="value"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} (${Math.round(percent * 100)}%)`}
                    >
                      {teamStats.camembert.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} %`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 