import '../styles/App.css';
import React, { useState, useEffect } from 'react';
import { getStartAndEndOfWeek } from '../utils/getStartAndEndOfWeek';
import { getWeekNumber } from '../utils/getWeekNumber';
import { mois } from '../utils/constants';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';
import { apiFetch } from '../utils/api';

function ProjectsPage({ projetsByWeek, setProjetsByWeek, fetchProjets }) {
  // Ajout du state local pour la semaine et l'année
  const today = new Date();
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(today));
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [role, setRole] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [form, setForm] = useState({ nom: '', pourcentage: '', commentaire: '', codeProjet: '', id_utilisateur: '' });
  const [addClicked, setAddClicked] = useState(false);
  const [percentError, setPercentError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPropagateModal, setShowPropagateModal] = useState(false);
  const [weeksToPropagate, setWeeksToPropagate] = useState(1);
  const [propagateLoading, setPropagateLoading] = useState(false);
  const [propagateSuccess, setPropagateSuccess] = useState('');
  const [propagateError, setPropagateError] = useState('');
  const [selectedProjets, setSelectedProjets] = useState([]);
  const weekKey = `${selectedYear}-${selectedWeek}`;
  const projets = Array.isArray(projetsByWeek[weekKey]) ? projetsByWeek[weekKey] : [];

  useEffect(() => {
    // Récupère le rôle depuis le JWT
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        setRole(payload.role || '');
      } catch {}
    }
    // Si manager/admin/superadmin, récupère les membres de l'équipe
    if (role === 'manager' || role === 'admin' || role === 'superadmin') {
      apiFetch('/equipe/membres').then(setTeamMembers).catch(() => setTeamMembers([]));
    }
  }, [role]);

  const syncToAPI = async (newProjets) => {
    await apiFetch('/projets', {
      method: 'POST',
      params: { week: selectedWeek, year: selectedYear },
      body: { projets: newProjets }
    });
    await fetchProjets(selectedYear, selectedWeek);
  };

  // Fonctions locales pour naviguer entre les semaines
  const goToPrevWeek = () => {
    if (selectedWeek === 1) {
      setSelectedWeek(52);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedWeek(selectedWeek - 1);
    }
  };
  const goToNextWeek = () => {
    if (selectedWeek === 52) {
      setSelectedWeek(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = e => {
    e.preventDefault();
    setAddClicked(true);
    setPercentError('');
    if (!form.nom.trim() || !form.pourcentage.trim() || !form.codeProjet.trim() || (['manager','admin','superadmin'].includes(role) && !form.id_utilisateur)) return;
    const pourcentageNum = Number(form.pourcentage);
    if (isNaN(pourcentageNum) || pourcentageNum < 0 || pourcentageNum > 100) {
      setPercentError('Le pourcentage doit être un nombre entre 0 et 100.');
      return;
    }
    const totalPourcent = projets.reduce((sum, p) => sum + (parseFloat(p.pourcentage) || 0), 0) + pourcentageNum;
    if (totalPourcent > 100) {
      setPercentError('Le total des pourcentages ne peut pas dépasser 100%.');
      return;
    }
    const projetToAdd = { ...form, pourcentage: pourcentageNum };
    if (!['manager','admin','superadmin'].includes(role)) {
      delete projetToAdd.id_utilisateur;
    }
    const newProjets = [...projets, projetToAdd];
    syncToAPI(newProjets);
    setForm({ nom: '', pourcentage: '', commentaire: '', codeProjet: '', id_utilisateur: '' });
    setAddClicked(false);
  };

  const handleRepartir = () => {
    if (projets.length === 0) return;
    const base = Math.floor(100 / projets.length);
    let reste = 100 - base * projets.length;
    const newProjets = projets.map((p, i) => ({
      ...p,
      pourcentage: base + (i === projets.length - 1 ? reste : 0)
    }));
    syncToAPI(newProjets);
  };

  const handleValiderProjets = () => {
    alert('Projets validés pour la semaine !');
  };

  const handleEffacer = () => {
    if (projets.length === 0) return;
    setShowDeleteModal(true);
  };

  const handleDeleteOne = idx => {
    const newProjets = projets.filter((_, i) => i !== idx);
    syncToAPI(newProjets);
    setShowDeleteModal(false);
  };

  const handleDeleteAll = () => {
    syncToAPI([]);
    setShowDeleteModal(false);
  };

  // Fonction pour propager les projets sélectionnés sur plusieurs semaines
  const handlePropagateProjets = async () => {
    setPropagateLoading(true);
    setPropagateSuccess('');
    setPropagateError('');
    try {
      const projetsAPropager = projets.filter((_, idx) => selectedProjets.includes(idx));
      for (let i = 1; i <= weeksToPropagate; i++) {
        let week = selectedWeek + i;
        let year = selectedYear;
        if (week > 52) {
          week = week - 52;
          year = year + 1;
        }
        await apiFetch('/projets', {
          method: 'POST',
          params: { week, year },
          body: { projets: projetsAPropager }
        });
      }
      setPropagateSuccess(`Projets propagés sur ${weeksToPropagate} semaine(s) !`);
      setShowPropagateModal(false);
    } catch (err) {
      setPropagateError("Erreur lors de la propagation des projets.");
    } finally {
      setPropagateLoading(false);
    }
  };

  return (
    <div className="DashboardBg">
      <TopBar />
      <div style={{ padding: '40px 60px', maxWidth: 1400, margin: '0 auto', background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(25, 118, 210, 0.13)', minHeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <button onClick={goToPrevWeek} style={{ fontSize: 28, marginRight: 24, background: '#f0f0f0', border: 'none', borderRadius: 12, cursor: 'pointer', padding: '10px 24px', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(25,118,210,0.08)' }}>&lt;</button>
          <span style={{ fontWeight: 800, fontSize: 28, color: '#1976d2', letterSpacing: 1.5 }}>Semaine {selectedWeek} - {selectedYear}</span>
          <button onClick={goToNextWeek} style={{ fontSize: 28, marginLeft: 24, background: '#f0f0f0', border: 'none', borderRadius: 12, cursor: 'pointer', padding: '10px 24px', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(25,118,210,0.08)' }}>&gt;</button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 18, fontSize: 20, color: '#1976d2', fontWeight: 700, letterSpacing: 0.7 }}>
          Semaine du {getStartAndEndOfWeek(selectedWeek, selectedYear).start.getDate().toString().padStart(2, '0')} au {getStartAndEndOfWeek(selectedWeek, selectedYear).end.getDate().toString().padStart(2, '0')} {mois[getStartAndEndOfWeek(selectedWeek, selectedYear).end.getMonth()]} {getStartAndEndOfWeek(selectedWeek, selectedYear).end.getFullYear()}
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 36, color: '#1976d2', fontWeight: 900, margin: '24px 0 32px 0', letterSpacing: 1.5 }}>Répartition des projets</h1>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <input name="nom" value={form.nom} onChange={handleChange} placeholder="Nom du projet" style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16, width: 180 }} />
          <input name="pourcentage" value={form.pourcentage} onChange={handleChange} placeholder="%" style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #43a047', fontSize: 16, width: 80 }} />
          <input name="commentaire" value={form.commentaire} onChange={handleChange} placeholder="Commentaire" style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 16, width: 220 }} />
          <input name="codeProjet" value={form.codeProjet} onChange={handleChange} placeholder="Code projet" style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #ffa000', fontSize: 16, width: 120 }} />
          {['manager','admin','superadmin'].includes(role) && (
            <select name="id_utilisateur" value={form.id_utilisateur} onChange={handleChange} style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16, width: 180 }} required>
              <option value="">Affecter à un membre</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>
              ))}
            </select>
          )}
          <button type="submit" disabled={!form.nom.trim() || !form.pourcentage.trim() || !form.codeProjet.trim()} style={{ background: (!form.nom.trim() || !form.pourcentage.trim() || !form.codeProjet.trim()) ? '#bdbdbd' : '#1976d2', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 36px', fontWeight: 800, cursor: (!form.nom.trim() || !form.pourcentage.trim() || !form.codeProjet.trim()) ? 'not-allowed' : 'pointer', fontSize: 20, boxShadow: '0 3px 12px rgba(25,118,210,0.10)', transition: 'background 0.2s' }}>Ajouter</button>
          {addClicked && (!form.nom.trim() || !form.pourcentage.trim() || !form.codeProjet.trim()) && (
            <div style={{ color: '#e53935', fontWeight: 500, fontSize: 15, width: '100%', marginTop: 6, textAlign: 'center' }}>
              Les champs "Nom du projet", "%" et "Code projet" sont obligatoires.
            </div>
          )}
          {percentError && (
            <div style={{ color: '#e53935', fontWeight: 500, fontSize: 15, width: '100%', marginTop: 6, textAlign: 'center' }}>{percentError}</div>
          )}
        </form>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 18px', marginBottom: 18, fontSize: 18 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: 22, color: '#1976d2', fontWeight: 800, minWidth: 220 }}>Projet</th>
              <th style={{ textAlign: 'center', fontSize: 22, color: '#1976d2', fontWeight: 800, minWidth: 120 }}>%</th>
              <th style={{ textAlign: 'left', fontSize: 22, color: '#1976d2', fontWeight: 800, minWidth: 260 }}>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {projets.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888', fontSize: 16 }}>Aucun projet pour cette semaine.</td></tr>
            ) : (
              projets.map((p, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, fontSize: 16 }}>{p.nom}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: '#43a047', fontSize: 16 }}>{p.pourcentage}</td>
                  <td style={{ fontSize: 15 }}>{p.commentaire}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Boutons d'action */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, margin: '36px 0 24px 0' }}>
          <button onClick={handleRepartir} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: projets.length === 0 ? 'not-allowed' : 'pointer', fontSize: 17, boxShadow: '0 2px 8px rgba(67,160,71,0.10)', transition: 'background 0.2s' }} disabled={projets.length === 0}>Répartir automatique</button>
          <button onClick={handleValiderProjets} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: projets.length === 0 ? 'not-allowed' : 'pointer', fontSize: 17, boxShadow: '0 2px 8px rgba(25,118,210,0.10)', transition: 'background 0.2s' }} disabled={projets.length === 0}>Valider les projets</button>
          <button onClick={handleEffacer} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: projets.length === 0 ? 'not-allowed' : 'pointer', fontSize: 17, boxShadow: '0 2px 8px rgba(229,57,53,0.10)', transition: 'background 0.2s' }} disabled={projets.length === 0}>Effacer</button>
          <button
            onClick={() => setShowPropagateModal(true)}
            style={{ background: '#ffa000', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: projets.length === 0 ? 'not-allowed' : 'pointer', fontSize: 17, boxShadow: '0 2px 8px rgba(255,160,0,0.10)', transition: 'background 0.2s' }}
            disabled={projets.length === 0}
          >Propager les projets</button>
        </div>
        {/* Modal de suppression */}
        <Modal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Supprimer des projets"
          actions={[
            <button onClick={handleDeleteAll} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>Tout effacer</button>,
            <button onClick={() => setShowDeleteModal(false)} style={{ background: '#bdbdbd', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>Annuler</button>
          ]}
        >
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 18 }}>
            {projets.map((p, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, background: '#f5f5f5', borderRadius: 8, padding: '8px 14px' }}>
                <span style={{ fontWeight: 600 }}>{p.nom}</span>
                <button onClick={() => handleDeleteOne(idx)} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 15, marginLeft: 12 }}>Supprimer</button>
              </li>
            ))}
          </ul>
        </Modal>
        {/* Modal de propagation */}
        <Modal
          open={showPropagateModal}
          onClose={() => setShowPropagateModal(false)}
          title="Propager les projets"
          actions={[
            <button
              onClick={handlePropagateProjets}
              disabled={propagateLoading || selectedProjets.length === 0}
              style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: propagateLoading || selectedProjets.length === 0 ? 'not-allowed' : 'pointer', opacity: propagateLoading || selectedProjets.length === 0 ? 0.7 : 1 }}
            >Valider</button>,
            <button
              onClick={() => setShowPropagateModal(false)}
              style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
            >Annuler</button>
          ]}
        >
          <div style={{ fontSize: 16, color: '#333', marginBottom: 12 }}>Sélectionnez les projets à propager :</div>
          <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 14, width: '100%' }}>
            {projets.length === 0 ? (
              <div style={{ color: '#888', fontSize: 15 }}>Aucun projet à propager.</div>
            ) : (
              projets.map((p, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 15, color: '#1976d2', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={selectedProjets.includes(idx)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedProjets(prev => [...prev, idx]);
                      } else {
                        setSelectedProjets(prev => prev.filter(i => i !== idx));
                      }
                    }}
                  />
                  {p.nom} <span style={{ color: '#43a047', fontWeight: 600 }}>({p.pourcentage}%)</span>
                  {p.commentaire ? <span style={{ color: '#888', fontStyle: 'italic', marginLeft: 8 }}>{p.commentaire}</span> : null}
                </label>
              ))
            )}
          </div>
          <div style={{ fontSize: 16, color: '#333', marginBottom: 12 }}>Sur combien de semaines voulez-vous propager ?</div>
          <input
            type="number"
            min={1}
            max={52}
            value={weeksToPropagate}
            onChange={e => setWeeksToPropagate(Math.max(1, Math.min(52, Number(e.target.value))))}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16, width: 80, marginBottom: 18, textAlign: 'center' }}
            autoFocus
          />
          {propagateLoading && <div style={{ color: '#1976d2', marginTop: 12 }}>Propagation en cours...</div>}
          {propagateSuccess && <div style={{ color: '#43a047', marginTop: 12 }}>{propagateSuccess}</div>}
          {propagateError && <div style={{ color: '#e53935', marginTop: 12 }}>{propagateError}</div>}
        </Modal>
      </div>
    </div>
  );
}

export default ProjectsPage; 