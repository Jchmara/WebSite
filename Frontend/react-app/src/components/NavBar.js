// Composant NavBar réutilisable
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function getRoleFromJWT() {
  const jwt = localStorage.getItem('jwt');
  if (!jwt) return '';
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return payload.role || '';
  } catch {
    return '';
  }
}

const baseNavItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/planning', label: 'Mon planning' },
  { to: '/projets', label: 'Mes projets' },
  { to: '/reporting', label: 'Reporting' },
];

export default function NavBar() {
  const location = useLocation();
  const role = getRoleFromJWT();
  let navItems = [...baseNavItems];
  if (role === 'admin' || role === 'superadmin' || role === 'manager') {
    navItems.push({ to: '/reporting-manager', label: 'Reporting admin' });
  }
  return (
    <nav className="NavBar">
      {navItems.map(item => (
        <Link
          key={item.to}
          to={item.to}
          className="NavBtn"
          style={{
            minWidth: 100,
            padding: '8px 8px',
            fontSize: 15,
            borderRadius: 8,
            margin: '0 6px',
            textAlign: 'center',
            ...(location.pathname === item.to ? { background: '#1976d2', color: '#fff' } : {})
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
} 