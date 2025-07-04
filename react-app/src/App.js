import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './styles/App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PlanningPage from './pages/PlanningPage';

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const types = [
  { label: 'Site', color: '#1976d2' },
  { label: 'TT', color: '#43a047' },
  { label: 'Client', color: '#ffa000' },
  { label: 'Congés', color: '#e53935' },
  { label: 'Absent', color: '#bdbdbd' }
];

// Fonction pour obtenir le numéro de la semaine ISO à partir d'une date
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// Génère une répartition aléatoire pour chaque jour
function getRandomPresences() {
  return jours.map(() => {
    const idx = Math.floor(Math.random() * types.length);
    return idx;
  });
}

function App() {
  const [date, setDate] = useState(new Date());
  const ui = 'Site';
  const [presences, setPresences] = useState([null, null, null, null, null]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Charger les présences pour la semaine sélectionnée
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/presences?week=${selectedWeek}&year=${selectedYear}`)
      .then(res => res.json())
      .then(data => {
        setPresences(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedWeek, selectedYear]);

  // Mettre à jour l'API à chaque modification
  const updatePresences = (newPresences) => {
    setPresences(newPresences);
    fetch(`http://localhost:5000/api/presences?week=${selectedWeek}&year=${selectedYear}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presences: newPresences })
    });
  };

  // Navigation entre les semaines
  const goToPrevWeek = () => {
    if (selectedWeek === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedWeek(52); // approximation, à affiner si besoin
    } else {
      setSelectedWeek(selectedWeek - 1);
    }
  };
  const goToNextWeek = () => {
    if (selectedWeek === 52) {
      setSelectedYear(selectedYear + 1);
      setSelectedWeek(1);
    } else {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  // Trouver l'index du jour d'aujourd'hui (0 = Lundi, 4 = Vendredi)
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? null : today.getDay() - 1; // 0 = Lundi, 6 = Dimanche
  let todayPresenceLabel = 'Non renseigné';
  if (todayIndex !== null && todayIndex >= 0 && todayIndex < presences.length) {
    const idx = presences[todayIndex];
    if (typeof idx === 'number' && types[idx]) {
      todayPresenceLabel = types[idx].label;
    }
  }

  return (
    <Router>
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
        <Routes>
          <Route path="/" element={
            <div className="DashboardContent">
              <div className="CardGroup">
                <div className="Card InfosCard">
                  <div className="CardTitle">Aujourd'hui</div>
                  <div className="UI">{todayPresenceLabel}</div>
                  <div className="Projet">Projet XX</div>
                </div>
                <div className="Card SemaineCard">
                  <div className="CardTitle">Cette semaine</div>
                  <div className="JoursLigne">
                    {jours.map((jour, j) => (
                      <div className="JourColonne" key={jour}>
                        <div className="JourNom">{jour}</div>
                        <div className="Checkboxes">
                          {types.map((type, i) => (
                            presences[j] === i ? (
                              <label key={type.label} className="CheckboxLabel">
                                <input type="checkbox" checked disabled readOnly />
                                <span className="CustomCheckbox" style={{ background: type.color }}></span>
                              </label>
                            ) : null
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="CalendarContainerVisible">
                <Calendar onChange={setDate} value={date} />
              </div>
            </div>
          } />
          <Route path="/planning" element={
            <PlanningPage
              presences={presences}
              setPresences={updatePresences}
              types={types}
              jours={jours}
              loading={loading}
              selectedWeek={selectedWeek}
              selectedYear={selectedYear}
              goToPrevWeek={goToPrevWeek}
              goToNextWeek={goToNextWeek}
            />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
