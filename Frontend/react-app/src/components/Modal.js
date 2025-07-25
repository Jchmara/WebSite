// Composant Modal réutilisable
import React from 'react';

export default function Modal({ open, onClose, title, children, actions }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(25, 118, 210, 0.18)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 6px 32px rgba(25, 118, 210, 0.18)', padding: 32, minWidth: 340, maxWidth: 480, textAlign: 'center', position: 'relative' }}>
        {title && <div style={{ fontWeight: 700, fontSize: 20, color: '#1976d2', marginBottom: 18 }}>{title}</div>}
        <div>{children}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
          {actions}
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
      </div>
    </div>
  );
} 