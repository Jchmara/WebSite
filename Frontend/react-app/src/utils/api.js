// Utilitaire pour les appels API centralisés
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export async function apiFetch(endpoint, { method = 'GET', params = {}, body = null } = {}) {
  const API_KEY = process.env.REACT_APP_API_KEY;
  const jwt = localStorage.getItem('jwt');
  let url = API_BASE + endpoint;
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString();
    url += '?' + query;
  }
  const headers = {
    'x-api-key': API_KEY,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(jwt ? { 'Authorization': 'Bearer ' + jwt } : {})
  };
  const options = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {})
  };
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Erreur API: ' + response.status);
  // Si 204, ne pas essayer de parser le JSON
  if (response.status === 204) return {};
  return response.json();
} 