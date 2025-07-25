import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const roles = [
  { value: 'user', label: 'Utilisateur' },
  { value: 'manager', label: 'Manager' }
];

export default function RegisterPage() {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '', id_equipe: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [equipes, setEquipes] = useState([]);
  const [loadingEquipes, setLoadingEquipes] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('RegisterPage monté');
    setLoading(true);
    console.log('Je vais fetch /api/equipes-public');
    fetch('/api/equipes-public')
      .then(res => res.json())
      .then(data => {
        console.log('Réponse fetch équipes', data);
        setEquipes(data);
      })
      .catch((err) => {
        console.log('Erreur fetch équipes', err);
        setEquipes([]);
      })
      .finally(() => {
        setLoading(false);
        setLoadingEquipes(false);
      });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    // Validation email Deloitte
    if (!form.email.endsWith('@deloitte.fr')) {
      setError('L’email doit se terminer par @deloitte.fr');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/register', { method: 'POST', body: { ...form, id_equipe: Number(form.id_equipe) } });
      setSuccess(true);
    } catch (err) {
      setError(err.message.includes('409') ? 'Email déjà utilisé.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => navigate('/login');

  const filteredEquipes = equipes.filter(e => e.nom !== 'admin');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 6px 32px rgba(25, 118, 210, 0.13)', padding: 40, minWidth: 340, maxWidth: 420 }}>
        <h2 style={{ color: '#1976d2', textAlign: 'center', marginBottom: 24 }}>Inscription</h2>
        {success ? (
          <>
            <div style={{ color: 'green', marginBottom: 16, textAlign: 'center', fontWeight: 500 }}>
              Votre demande a été envoyée, un administrateur doit la valider.
            </div>
            <button onClick={goToLogin} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer', width: '100%' }}>
              Retour à la connexion
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <input
              name="nom"
              placeholder="Nom"
              value={form.nom}
              onChange={handleChange}
              required
              disabled={loading}
              style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16 }}
            />
            <input
              name="prenom"
              placeholder="Prénom"
              value={form.prenom}
              onChange={handleChange}
              required
              disabled={loading}
              style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16 }}
            />
            <input
              name="email"
              type="email"
              placeholder="Email professionnel"
              value={form.email}
              onChange={handleChange}
              required
              disabled={loading}
              style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16 }}
            />
            <input
              name="password"
              type="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={handleChange}
              required
              disabled={loading}
              style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16 }}
            />
            {loading ? (
              <span style={{ color: '#1976d2', fontWeight: 500 }}>Chargement des équipes...</span>
            ) : (
              filteredEquipes.length === 0 ? (
                <div style={{ color: '#e53935', fontWeight: 600, margin: '16px 0' }}>
                  Aucune équipe disponible pour l'inscription. Veuillez contacter un administrateur.
                </div>
              ) : (
                <select name="id_equipe" value={form.id_equipe} onChange={handleChange} required style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16 }}>
                  <option value="">Sélectionner une équipe</option>
                  {filteredEquipes.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.nom}</option>
                  ))}
                </select>
              )
            )}
            <select name="role" value={form.role} onChange={handleChange} disabled={loading} style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16 }}>
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {error && <div style={{ color: 'red', marginBottom: 4, textAlign: 'center' }}>{error}</div>}
            <button type="submit" disabled={loading || loadingEquipes} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer' }}>
              {loading ? 'Inscription...' : 'S’inscrire'}
            </button>
            <button type="button" onClick={goToLogin} style={{ background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', fontSize: 15, marginTop: 4 }}>
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 