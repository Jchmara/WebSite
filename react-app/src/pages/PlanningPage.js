import '../styles/App.css';
import { Link } from 'react-router-dom';

function PlanningPage({ presences, setPresences, types, jours, loading, selectedWeek, selectedYear, goToPrevWeek, goToNextWeek }) {
  const handleChange = (jourIndex, typeIndex) => {
    const newPresences = [...presences];
    newPresences[jourIndex] = typeIndex;
    setPresences(newPresences);
  };

  return (
    <div className="DashboardBg">
      <div className="TopBar">
        <div className="Logo">⏰</div>
        <div className="NavBarCenter">
          <nav className="NavBar">
            <Link to="/" className="NavBtn">Dashboard</Link>
            <Link to="/planning" className="NavBtn">Mon planning</Link>
            <button className="NavBtn">Mes projets</button>
            <button className="NavBtn">Reporting</button>
          </nav>
        </div>
      </div>
      <div style={{ padding: 32, maxWidth: 500, margin: '80px auto 0 auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <button onClick={goToPrevWeek} style={{ fontSize: 20, marginRight: 16, background: '#f0f0f0', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '4px 12px' }}>&lt;</button>
          <span style={{ fontWeight: 600, fontSize: 18 }}>Semaine {selectedWeek} - {selectedYear}</span>
          <button onClick={goToNextWeek} style={{ fontSize: 20, marginLeft: 16, background: '#f0f0f0', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '4px 12px' }}>&gt;</button>
        </div>
        <h1>Mon planning</h1>
        {loading ? <p>Chargement...</p> :
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Jour</th>
                <th style={{ textAlign: 'center' }}>Présence</th>
              </tr>
            </thead>
            <tbody>
              {jours.map((jour, j) => (
                <tr key={jour}>
                  <td style={{ fontWeight: 500 }}>{jour}</td>
                  <td>
                    {types.map((type, i) => (
                      <button
                        key={type.label}
                        style={{
                          background: presences[j] === i ? type.color : '#f0f0f0',
                          color: presences[j] === i ? '#fff' : '#333',
                          border: 'none',
                          borderRadius: 8,
                          marginRight: 8,
                          padding: '6px 14px',
                          fontWeight: presences[j] === i ? 700 : 400,
                          cursor: 'pointer',
                          boxShadow: presences[j] === i ? '0 2px 8px rgba(25,118,210,0.10)' : 'none',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => handleChange(j, i)}
                      >
                        {type.label}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}

export default PlanningPage; 