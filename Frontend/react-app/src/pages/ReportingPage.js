import '../styles/App.css';
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getWeekNumber } from '../utils/getWeekNumber';
import TopBar from '../components/TopBar';
import { apiFetch } from '../utils/api';

function ReportingPage() {
  // Sélection de la période (par défaut, cette semaine)
  const today = new Date();
  const [startWeek, setStartWeek] = useState(getWeekNumber(today));
  const [startYear, setStartYear] = useState(today.getFullYear());
  const [endWeek, setEndWeek] = useState(getWeekNumber(today));
  const [endYear, setEndYear] = useState(today.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // Génère la liste des semaines entre deux (année, semaine) incluses
  function getWeeksInRange(startY, startW, endY, endW) {
    const result = [];
    let y = startY, w = startW;
    while (y < endY || (y === endY && w <= endW)) {
      result.push({ year: y, week: w });
      w++;
      if (w > 52) { w = 1; y++; }
    }
    return result;
  }

  // Palette de couleurs pour les projets
  const COLORS = ['#1976d2', '#43a047', '#ffa000', '#e53935', '#bdbdbd', '#8e24aa', '#00bcd4', '#fbc02d', '#388e3c', '#d84315'];

  // Affiche le reporting automatiquement à chaque changement de période
  useEffect(() => {
    let ignore = false;
    const fetchReport = async () => {
      setLoading(true);
      setReport(null);
      const weeks = getWeeksInRange(startYear, startWeek, endYear, endWeek);
      let totalJours = 0;
      let joursRenseignes = 0;
      let joursSurSite = 0;
      let projetsOccupation = {};
      let totalPourcentage = 0;
      for (const { year, week } of weeks) {
        try {
          const data = await apiFetch('/presences', {
            params: { week, year }
          });
          if (Array.isArray(data.presences)) {
            totalJours += data.presences.length;
            joursRenseignes += data.presences.filter(n => Number.isInteger(n)).length;
            joursSurSite += data.presences.filter(n => n === 0).length;
          }
        } catch (e) {}
        try {
          const data2 = await apiFetch('/projets', {
            params: { week, year }
          });
          if (Array.isArray(data2)) {
            for (const p of data2) {
              if (p.nom && p.pourcentage) {
                projetsOccupation[p.nom] = (projetsOccupation[p.nom] || 0) + parseFloat(p.pourcentage);
                totalPourcentage += parseFloat(p.pourcentage);
              }
            }
          }
        } catch (e) {}
      }
      const tauxPresence = totalJours > 0 ? Math.round((joursRenseignes / totalJours) * 100) : 0;
      let occupationParProjet = [];
      for (const [nom, val] of Object.entries(projetsOccupation)) {
        occupationParProjet.push({ nom, pourcentage: Math.round((val / totalPourcentage) * 100) });
      }
      occupationParProjet.sort((a, b) => b.pourcentage - a.pourcentage);
      if (!ignore) {
        setReport({ tauxPresence, occupationParProjet, joursSurSite });
        setLoading(false);
      }
    };
    fetchReport();
    return () => { ignore = true; };
  }, [startWeek, startYear, endWeek, endYear]);

  return (
    <div className="DashboardBg">
      <TopBar />
      <div style={{ padding: '32px 48px', maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 6px 32px rgba(25, 118, 210, 0.13)', minHeight: 480 }}>
        <h1 style={{ textAlign: 'center', fontSize: 28, color: '#1976d2', fontWeight: 800, margin: '18px 0 24px 0', letterSpacing: 1 }}>Reporting de présence</h1>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 32 }}>
          <div>
            <label>Semaine de début&nbsp;:
              <input type="number" min={1} max={52} value={startWeek} onChange={e => setStartWeek(Number(e.target.value))} style={{ marginLeft: 8, width: 60 }} />
              <input type="number" min={2000} max={2100} value={startYear} onChange={e => setStartYear(Number(e.target.value))} style={{ marginLeft: 8, width: 80 }} />
            </label>
          </div>
          <div>
            <label>Semaine de fin&nbsp;:
              <input type="number" min={1} max={52} value={endWeek} onChange={e => setEndWeek(Number(e.target.value))} style={{ marginLeft: 8, width: 60 }} />
              <input type="number" min={2000} max={2100} value={endYear} onChange={e => setEndYear(Number(e.target.value))} style={{ marginLeft: 8, width: 80 }} />
            </label>
          </div>
        </div>
        {loading && <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Chargement du reporting...</div>}
        {report && !loading && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ color: '#1976d2', fontSize: 22, fontWeight: 700 }}>Résumé</h2>
            <div style={{ margin: '18px 0', fontSize: 17, color: '#333' }}>
              <div>Taux de présence : <b>{report.tauxPresence} %</b></div>
              <div>Nombre de jours sur site : <b>{report.joursSurSite}</b></div>
              <div style={{ marginTop: 16, fontWeight: 600 }}>Taux d'occupation par projet :</div>
              {report.occupationParProjet.length === 0 ? (
                <div style={{ color: '#888', fontSize: 15 }}>Aucun projet sur la période.</div>
              ) : (
                <>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
                    {report.occupationParProjet.map(p => (
                      <li key={p.nom}>{p.nom} : <b>{p.pourcentage} %</b></li>
                    ))}
                  </ul>
                  <div style={{ width: '100%', maxWidth: 420, height: 260, margin: '24px auto 0 auto' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report.occupationParProjet}
                          dataKey="pourcentage"
                          nameKey="nom"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) => `${name} (${Math.round(percent * 100)}%)`}
                        >
                          {report.occupationParProjet.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} %`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportingPage;
