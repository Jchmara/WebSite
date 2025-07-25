import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export default function LoginPage({ setIsAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await apiFetch('/login', { method: 'POST', body: { email, password } });
      localStorage.setItem('jwt', res.token);
      if (setIsAuthenticated) setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      setMessage(err.message.includes('403') ?
        'Votre compte n’a pas encore été validé par un administrateur.' :
        (err.message.includes('401') ? 'Email ou mot de passe incorrect.' : err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = () => {
    navigate('/register');
  };

  const goToAdmin = () => {
    setAdminMsg('');
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        if (payload.role === 'admin' || payload.role === 'superadmin' || payload.role === 'manager') {
          navigate('/admin/users');
        } else {
          localStorage.removeItem('jwt');
          setAdminMsg('Veuillez vous connecter avec un compte administrateur pour accéder à l’administration.');
        }
      } catch (e) {
        localStorage.removeItem('jwt');
        setAdminMsg('Veuillez vous connecter avec un compte administrateur pour accéder à l’administration.');
      }
    } else {
      setAdminMsg('Veuillez d’abord vous connecter pour accéder à l’administration.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 6px 32px rgba(25, 118, 210, 0.13)', padding: 40, minWidth: 340 }}>
        <h2 style={{ color: '#1976d2', textAlign: 'center', marginBottom: 24 }}>Connexion</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <input
            type="email"
            placeholder="Email professionnel"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16 }}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16 }}
          />
          <button type="submit" disabled={loading} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer' }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button onClick={handleRequestAccess} style={{ background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', fontSize: 15 }}>
            Première connexion ? Demander un accès
          </button>
        </div>
        {message && <div style={{ color: message.includes('réussie') ? '#43a047' : '#e53935', marginTop: 18, textAlign: 'center' }}>{message}</div>}
        {/* Le bouton Accès admin a été supprimé */}
      </div>
    </div>
  );
} 