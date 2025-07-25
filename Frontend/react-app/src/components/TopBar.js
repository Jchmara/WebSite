// Composant TopBar réutilisable
import React, { useEffect, useState } from 'react';
import Logo from './Logo';
import NavBar from './NavBar';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export default function TopBar({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ nom: '', prenom: '' });
  const [role, setRole] = useState('');
  // Décoder l’id utilisateur et le rôle depuis le JWT
  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        setRole(payload.role || '');
        if (payload.id) {
          apiFetch(`/utilisateur/${payload.id}`)
            .then(data => setUserInfo(data))
            .catch(() => setUserInfo({ nom: '', prenom: '' }));
        }
      } catch {}
    }
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('jwt');
    if (setIsAuthenticated) setIsAuthenticated(false);
    navigate('/login');
  };
  const goToAdmin = () => {
    navigate('/admin/users');
  };
  return (
    <div className="TopBar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#1976d2', borderBottom: '1px solid #1565c0', minHeight: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1 }}>
        <Logo />
        {(userInfo.nom || userInfo.prenom) && <span style={{ fontWeight: 600, color: '#fff', fontSize: 17 }}>{userInfo.prenom} {userInfo.nom}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1, justifyContent: 'center' }}>
        <NavBar />
        <button onClick={handleLogout} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px #0002' }}>
          Déconnexion
        </button>
        {(role === 'admin' || role === 'superadmin' || role === 'manager') && (
          <button onClick={goToAdmin} style={{ background: '#fff', color: '#1976d2', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px #0002', marginLeft: 8 }}>
            Administration
          </button>
        )}
      </div>
      <div style={{ flex: 1 }} />
    </div>
  );
} 