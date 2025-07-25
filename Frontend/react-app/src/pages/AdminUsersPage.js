import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    apiFetch('/admin/utilisateurs-attente')
      .then(setUsers)
      .catch(() => setError('Erreur lors du chargement.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleValidate = async (id_utilisateur) => {
    setActionMsg('');
    try {
      await apiFetch('/admin/valider-utilisateur', { method: 'POST', body: { id_utilisateur } });
      setActionMsg('Utilisateur validé.');
      fetchUsers();
    } catch {
      setActionMsg('Erreur lors de la validation.');
    }
  };

  const handleDelete = async (id_utilisateur) => {
    setActionMsg('');
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await apiFetch(`/admin/supprimer-utilisateur/${id_utilisateur}`, { method: 'DELETE' });
      setActionMsg('Utilisateur supprimé.');
      fetchUsers();
    } catch {
      setActionMsg('Erreur lors de la suppression.');
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px #1976d220', padding: 32 }}>
      <h2 style={{ color: '#1976d2', textAlign: 'center', marginBottom: 24 }}>Utilisateurs en attente</h2>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {actionMsg && <div style={{ color: '#43a047', marginBottom: 16 }}>{actionMsg}</div>}
      {loading ? (
        <div>Chargement...</div>
      ) : users.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center' }}>Aucun utilisateur en attente.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#e3eafc' }}>
              <th style={{ padding: 8 }}>Nom</th>
              <th style={{ padding: 8 }}>Prénom</th>
              <th style={{ padding: 8 }}>Email</th>
              <th style={{ padding: 8 }}>Équipe</th>
              <th style={{ padding: 8 }}>Rôle</th>
              <th style={{ padding: 8 }}>Date</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id_utilisateur} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{u.nom}</td>
                <td style={{ padding: 8 }}>{u.prenom}</td>
                <td style={{ padding: 8 }}>{u.email}</td>
                <td style={{ padding: 8 }}>{u.id_equipe}</td>
                <td style={{ padding: 8 }}>{u.role}</td>
                <td style={{ padding: 8 }}>{u.date_creation && u.date_creation.slice(0, 10)}</td>
                <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                  <button onClick={() => handleValidate(u.id_utilisateur)} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Valider</button>
                  <button onClick={() => handleDelete(u.id_utilisateur)} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
