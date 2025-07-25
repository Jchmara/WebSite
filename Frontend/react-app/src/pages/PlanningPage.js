import '../styles/App.css';
import React, { useState, useEffect } from 'react';
import { getStartAndEndOfWeek } from '../utils/getStartAndEndOfWeek';
import { getFrenchHolidays } from '../utils/getFrenchHolidays';
import { getWeekNumber } from '../utils/getWeekNumber';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';
import { apiFetch } from '../utils/api';

function PlanningPage({ presences, setPresences, types, jours, loading, reloadPresences }) {
  // Initialisation des states en tout début de composant
  const [codesProjet, setCodesProjet] = useState(['', '', '', '', '']);
  const [presencesLocal, setPresencesLocal] = useState([null, null, null, null, null]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [errorApi, setErrorApi] = useState('');
  const [isManualSave, setIsManualSave] = useState(false); // <-- Ajout de ce state

  // Ajout du state local pour la semaine et l'année
  const today = new Date();
  // Calcule la semaine ISO
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(today));
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Fonctions locales pour naviguer entre les semaines
  const goToPrevWeek = () => {
    if (selectedWeek === 1) {
      setSelectedWeek(52);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedWeek(selectedWeek - 1);
    }
  };
  const goToNextWeek = () => {
    if (selectedWeek === 52) {
      setSelectedWeek(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  // Charger les présences de la semaine affichée à chaque changement de semaine/année
  useEffect(() => {
    setLoadingLocal(true);
    setErrorApi('');
    apiFetch('/presences', {
      params: { week: selectedWeek, year: selectedYear }
    })
      .then(data => {
        setPresencesLocal(Array.isArray(data.presences) ? data.presences : [null, null, null, null, null]);
        // Persistance des codes projet : on charge ceux de la BDD si présents
        if (Array.isArray(data.codesProjet) && data.codesProjet.length === 5) {
          setCodesProjet(data.codesProjet);
        } else if (typeof data.codeProjet === 'string' && data.codeProjet.length > 0) {
          setCodesProjet([data.codeProjet, data.codeProjet, data.codeProjet, data.codeProjet, data.codeProjet]);
        } else {
          setCodesProjet(['', '', '', '', '']);
        }
        setLoadingLocal(false);
      })
      .catch((err) => {
        if (err.message && err.message.includes('401')) {
          localStorage.removeItem('jwt');
          window.location.href = '/login';
        }
        setPresencesLocal([null, null, null, null, null]);
        setCodesProjet(['', '', '', '', '']);
        setLoadingLocal(false);
        setErrorApi(err.message || 'Erreur API inconnue');
      });
  }, [selectedWeek, selectedYear]);

  // Sauvegarde automatique à chaque modification de presencesLocal, semaine ou année
  useEffect(() => {
    if (isManualSave) return; // Ignore la sauvegarde auto pendant la validation manuelle
    if (!presencesLocal) return;
    if (!presencesLocal.every(n => Number.isInteger(n))) return;
    setErrorApi('');
    apiFetch('/presences', {
      method: 'POST',
      body: {
        week: selectedWeek,
        year: selectedYear,
        presences: presencesLocal,
        codesProjet
      }
    }).catch((err) => {
      setErrorApi(err.message || 'Erreur API inconnue');
    });
  }, [presencesLocal, selectedWeek, selectedYear, codesProjet, isManualSave]);

  // Handler pour modifier une présence
  const handleChange = (jourIndex, typeIndex) => {
    const newPresences = [...presencesLocal];
    newPresences[jourIndex] = typeIndex;
    setPresencesLocal(newPresences);
  };

  const { start, end } = getStartAndEndOfWeek(selectedWeek, selectedYear);
  const mois = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const [showPropagateModal, setShowPropagateModal] = useState(false);
  const [weeksToPropagate, setWeeksToPropagate] = useState(1);
  const [propagateLoading, setPropagateLoading] = useState(false);
  const [propagateSuccess, setPropagateSuccess] = useState('');
  const [propagateError, setPropagateError] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Icônes pour chaque type de présence
  const typeIcons = {
    'Site': '🏢',
    'TT': '💻',
    'Client': '🤝',
    'Congés': '🌴',
    'Absent': '🚫'
  };

  // Calcul des jours fériés de la semaine affichée
  const holidays = getFrenchHolidays(selectedYear);
  const weekDates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    weekDates.push(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`);
  }

  // Calcul des indices des jours fériés de la semaine affichée
  const joursFeriesIndices = weekDates
    .map((date, idx) => holidays.includes(date) ? idx : null)
    .filter(idx => idx !== null);
  // Désactivation du bouton de validation si un jour ouvré n'est pas renseigné
  const tousOuvresRenseignes = presencesLocal.filter((_, idx) => !joursFeriesIndices.includes(idx)).every(n => Number.isInteger(n))
    && codesProjet.filter((_, idx) => !joursFeriesIndices.includes(idx)).every(code => code.trim() !== '');

  // Handler pour ouvrir la pop-up de validation
  const handleOpenValidationModal = () => {
    setValidationError('');
    setValidationSuccess('');
    setShowValidationModal(true);
  };

  // Handler pour ouvrir la pop-up d'effacement
  const handleOpenDeleteModal = () => {
    setDeleteError('');
    setDeleteSuccess('');
    setShowDeleteModal(true);
  };

  // Handler pour propager la semaine sur plusieurs semaines
  const handlePropagateWeek = async () => {
    if (!presencesLocal.every(n => Number.isInteger(n))) {
      setPropagateError('Veuillez renseigner tous les jours de la semaine avant de propager.');
      return;
    }
    setPropagateLoading(true);
    setPropagateSuccess('');
    setPropagateError('');
    try {
      for (let i = 1; i <= weeksToPropagate; i++) {
        let week = selectedWeek + i;
        let year = selectedYear;
        if (week > 52) {
          week = week - 52;
          year = year + 1;
        }
        const presencesAEnvoyer = presencesLocal.map((val, idx) =>
          joursFeriesIndices.includes(idx) ? 0 : val
        );
        const codesAEnvoyer = codesProjet.map((val, idx) =>
          joursFeriesIndices.includes(idx) ? '' : val
        );
        await apiFetch('/presences', {
          method: 'POST',
          body: {
            week,
            year,
            presences: presencesAEnvoyer,
            codesProjet: codesAEnvoyer
          }
        });
      }
      setPropagateSuccess(`Semaine propagée sur ${weeksToPropagate} semaine(s) !`);
      setShowPropagateModal(false);
    } catch (err) {
      setPropagateError("Erreur lors de la propagation de la semaine.");
    } finally {
      setPropagateLoading(false);
    }
  };

  // Handler pour valider la semaine avec vérification
  const handleValidationConfirm = async () => {
    setValidationError('');
    setValidationSuccess('');
    setIsManualSave(true); // Désactive la sauvegarde auto
    const joursNonFeries = presencesLocal.filter((_, idx) => !joursFeriesIndices.includes(idx));
    const codesNonFeries = codesProjet.filter((_, idx) => !joursFeriesIndices.includes(idx));
    if (joursNonFeries.some(n => !Number.isInteger(n)) || codesNonFeries.some(code => code.trim() === '')) {
      setValidationError('Veuillez renseigner tous les jours ouvrés de la semaine (présence et code projet, hors fériés).');
      return;
    }
    setValidationLoading(true);
    try {
      const presencesAEnvoyer = presencesLocal.map((val, idx) =>
        joursFeriesIndices.includes(idx) ? 0 : val
      );
      const codesAEnvoyer = codesProjet.map((val, idx) =>
        joursFeriesIndices.includes(idx) ? '' : val
      );
      await apiFetch('/presences', {
        method: 'POST',
        body: {
          week: selectedWeek,
          year: selectedYear,
          presences: presencesAEnvoyer,
          codesProjet: codesAEnvoyer
        }
      });
      setValidationSuccess('Semaine validée avec succès !');
      setShowValidationModal(false);
      setSuccessMessage('Semaine validée avec succès !');
      setShowSuccessModal(true);
      if (reloadPresences) reloadPresences();
    } catch (err) {
      let msg = "Erreur lors de la validation de la semaine.";
      if (err && err.message) msg = err.message;
      if (err && err.response && err.response.data && err.response.data.error) msg = err.response.data.error;
      setValidationError(msg);
    } finally {
      setValidationLoading(false);
      setIsManualSave(false); // Réactive la sauvegarde auto
    }
  };

  // Handler pour confirmer l'effacement
  const handleDeleteConfirm = async () => {
    setDeleteError('');
    setDeleteSuccess('');
    setDeleteLoading(true);
    try {
      await apiFetch('/presences', {
        method: 'POST',
        body: {
          week: selectedWeek,
          year: selectedYear,
          presences: [null, null, null, null, null],
          codesProjet: ['', '', '', '', '']
        }
      });
      setDeleteSuccess('Semaine effacée avec succès !');
      setShowDeleteModal(false);
      setSuccessMessage('Semaine effacée avec succès !');
      setShowSuccessModal(true);
      setPresencesLocal([null, null, null, null, null]);
      setCodesProjet(['', '', '', '', '']);
    } catch (err) {
      setDeleteError("Erreur lors de l'effacement de la semaine.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Calcul du résumé par type sans compter les jours fériés
  const joursNonFeries = jours.map((_, j) => holidays.includes(weekDates[j]) ? null : presencesLocal[j]);
  const counts = types.map((type, i) =>
    joursNonFeries.filter(n => n === i).length
  );

  return (
    <div className="DashboardBg">
      <TopBar />
      <div style={{ padding: '32px 48px', maxWidth: 900, margin: '0 auto 0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 6px 32px rgba(25, 118, 210, 0.13)', minHeight: 480 }}>
        {errorApi && (
          <div style={{ background: '#e53935', color: '#fff', padding: 16, borderRadius: 8, marginBottom: 18, fontWeight: 700, fontSize: 16, textAlign: 'center' }}>
            Erreur API : {errorApi}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <button onClick={goToPrevWeek} style={{ fontSize: 22, marginRight: 16, background: '#f0f0f0', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '6px 16px', transition: 'background 0.2s' }}>&lt;</button>
          <span style={{ fontWeight: 700, fontSize: 22, color: '#1976d2', letterSpacing: 1 }}>Semaine {selectedWeek} - {selectedYear}</span>
          <button onClick={goToNextWeek} style={{ fontSize: 22, marginLeft: 16, background: '#f0f0f0', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '6px 16px', transition: 'background 0.2s' }}>&gt;</button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 17, color: '#1976d2', fontWeight: 600, letterSpacing: 0.5 }}>
          Semaine du {start.getDate().toString().padStart(2, '0')} au {end.getDate().toString().padStart(2, '0')} {mois[end.getMonth()]} {end.getFullYear()}
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 28, color: '#1976d2', fontWeight: 800, margin: '18px 0 24px 0', letterSpacing: 1 }}>Mon planning</h1>
        {loadingLocal ? <p style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Chargement...</p> :
          <>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 16px', marginBottom: 10 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 18, color: '#1976d2', fontWeight: 700, minWidth: 140 }}>Jour</th>
                  <th style={{ textAlign: 'center', fontSize: 18, color: '#1976d2', fontWeight: 700, minWidth: 400 }}>Présence</th>
                </tr>
              </thead>
              <tbody>
                {jours.map((jour, j) => (
                  <tr key={jour}>
                    <td style={{ fontWeight: 600, fontSize: 16 }}>{jour}</td>
                    <td>
                      {holidays.includes(weekDates[j]) ? (
                        <span style={{ color: '#bdbdbd', fontWeight: 700, fontSize: 15, background: '#f5f5f5', borderRadius: 8, padding: '7px 18px', display: 'inline-block' }}>Férié</span>
                      ) : (
                        <>
                          {types.map((type, i) => (
                            <button
                              key={type.label}
                              style={{
                                background: presencesLocal[j] === i ? type.color : '#f0f0f0',
                                color: presencesLocal[j] === i ? '#fff' : '#333',
                                border: 'none',
                                borderRadius: 8,
                                marginRight: 8,
                                padding: '8px 18px',
                                fontWeight: presencesLocal[j] === i ? 700 : 400,
                                cursor: 'pointer',
                                boxShadow: presencesLocal[j] === i ? '0 2px 8px rgba(25,118,210,0.10)' : 'none',
                                outline: 'none',
                                transition: 'all 0.2s',
                                fontSize: 15,
                                marginBottom: 2,
                                borderBottom: presencesLocal[j] === i ? '3px solid #fff' : '3px solid transparent',
                              }}
                              onClick={() => handleChange(j, i)}
                              onMouseOver={e => e.currentTarget.style.background = type.color}
                              onMouseOut={e => e.currentTarget.style.background = presencesLocal[j] === i ? type.color : '#f0f0f0'}
                              disabled={holidays.includes(weekDates[j])}
                            >
                              {typeIcons[type.label] || ''} {type.label}
                            </button>
                          ))}
                          <input
                            type="text"
                            placeholder="Code projet"
                            value={codesProjet[j]}
                            onChange={e => {
                              const newCodes = [...codesProjet];
                              newCodes[j] = e.target.value;
                              setCodesProjet(newCodes);
                            }}
                            style={{
                              marginLeft: 12,
                              width: 140,
                              padding: '8px 14px',
                              borderRadius: 8,
                              border: '1.5px solid #1976d2',
                              fontSize: 15,
                              background: '#f5f8ff',
                              color: '#1976d2',
                              fontWeight: 600,
                              outline: 'none',
                              boxShadow: '0 1px 4px rgba(25,118,210,0.07)',
                              transition: 'border 0.2s',
                              marginTop: 4
                            }}
                            autoComplete="off"
                            maxLength={50}
                          />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Résumé même si vide */}
            <div style={{ margin: '24px 0 18px 0', textAlign: 'center' }}>
              <h3 style={{ color: '#1976d2', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Résumé de la semaine</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                {types.map((type, i) => (
                  <div key={type.label} style={{ background: '#f5f5f5', borderRadius: 10, padding: '12px 24px', fontWeight: 600, color: '#1976d2', fontSize: 16, minWidth: 90 }}>
                    {typeIcons[type.label] || ''} {type.label} : {counts[i] || 0}
                  </div>
                ))}
              </div>
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, margin: '28px 0 18px 0' }}>
              <button onClick={() => setShowPropagateModal(true)} style={{ background: '#ffa000', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 17, boxShadow: '0 2px 8px rgba(255,160,0,0.10)', transition: 'background 0.2s' }}>Propager la semaine</button>
              <button onClick={handleOpenValidationModal}
                disabled={!tousOuvresRenseignes}
                style={{
                  background: (!tousOuvresRenseignes) ? '#bdbdbd' : '#1976d2',
                  color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: (!tousOuvresRenseignes) ? 'not-allowed' : 'pointer', fontSize: 17, boxShadow: '0 2px 8px rgba(25,118,210,0.10)', transition: 'background 0.2s'
                }}
              >
                Valider la semaine
              </button>
              <button onClick={handleOpenDeleteModal} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 17, boxShadow: '0 2px 8px rgba(229,57,53,0.10)', transition: 'background 0.2s' }}>Effacer la semaine</button>
            </div>

            {/* Modal de propagation */}
            <Modal
              open={showPropagateModal}
              onClose={() => setShowPropagateModal(false)}
              title="Propager la semaine"
              actions={[
                <button
                  key="propager-valider"
                  onClick={handlePropagateWeek}
                  disabled={propagateLoading}
                  style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: propagateLoading ? 'not-allowed' : 'pointer', opacity: propagateLoading ? 0.7 : 1 }}
                >Valider</button>,
                <button
                  key="propager-annuler"
                  onClick={() => setShowPropagateModal(false)}
                  style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                >Annuler</button>
              ]}
            >
              <div style={{ fontSize: 16, color: '#333', marginBottom: 12 }}>Sur combien de semaines voulez-vous propager la semaine courante ?</div>
              <input
                type="number"
                min={1}
                max={52}
                value={weeksToPropagate}
                onChange={e => setWeeksToPropagate(Math.max(1, Math.min(52, Number(e.target.value))))}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #1976d2', fontSize: 16, width: 80, marginBottom: 18, textAlign: 'center' }}
                autoFocus
              />
              {propagateLoading && <div style={{ color: '#1976d2', marginTop: 12 }}>Propagation en cours...</div>}
              {propagateSuccess && <div style={{ color: '#43a047', marginTop: 12 }}>{propagateSuccess}</div>}
              {propagateError && <div style={{ color: '#e53935', marginTop: 12 }}>{propagateError}</div>}
            </Modal>
            {/* Modal de validation */}
            <Modal
              open={showValidationModal}
              onClose={() => setShowValidationModal(false)}
              title="Valider la semaine"
              actions={[
                <button
                  key="validation-valider"
                  onClick={handleValidationConfirm}
                  disabled={validationLoading}
                  style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: validationLoading ? 'not-allowed' : 'pointer', opacity: validationLoading ? 0.7 : 1 }}
                >Valider</button>,
                <button
                  key="validation-annuler"
                  onClick={() => setShowValidationModal(false)}
                  style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                >Annuler</button>
              ]}
            >
              <div style={{ fontSize: 16, color: '#333', marginBottom: 12 }}>Confirmez-vous la validation de la semaine courante ?</div>
              <div style={{ color: '#888', fontSize: 15, marginBottom: 18 }}>Tous les jours doivent être renseignés et le code projet doit être rempli.</div>
              {validationError && <div style={{ color: '#e53935', marginBottom: 10, fontWeight: 700, fontSize: 16 }}>Erreur : {validationError}</div>}
              {validationSuccess && <div style={{ color: '#43a047', marginBottom: 10 }}>{validationSuccess}</div>}
              {validationLoading && <div style={{ color: '#1976d2', marginTop: 12 }}>Validation en cours...</div>}
            </Modal>
            {/* Modal d'effacement */}
            <Modal
              open={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              title="Effacer la semaine"
              actions={[
                <button
                  key="delete-effacer"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.7 : 1 }}
                >Effacer</button>,
                <button
                  key="delete-annuler"
                  onClick={() => setShowDeleteModal(false)}
                  style={{ background: '#bdbdbd', color: '#333', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                >Annuler</button>
              ]}
            >
              <div style={{ fontSize: 16, color: '#333', marginBottom: 12 }}>Confirmez-vous l'effacement de la semaine courante ?</div>
              <div style={{ color: '#888', fontSize: 15, marginBottom: 18 }}>Cette action est irréversible.</div>
              {deleteError && <div style={{ color: '#e53935', marginBottom: 10 }}>{deleteError}</div>}
              {deleteSuccess && <div style={{ color: '#43a047', marginBottom: 10 }}>{deleteSuccess}</div>}
              {deleteLoading && <div style={{ color: '#e53935', marginTop: 12 }}>Effacement en cours...</div>}
            </Modal>
            {/* Modal de succès stylisé */}
            <Modal
              open={showSuccessModal}
              onClose={() => setShowSuccessModal(false)}
              title="Succès"
              actions={[
                <button
                  key="success-fermer"
                  onClick={() => setShowSuccessModal(false)}
                  style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                >Fermer</button>
              ]}
            >
              <div style={{ fontSize: 18, color: '#1976d2', fontWeight: 700, textAlign: 'center', margin: '18px 0' }}>{successMessage}</div>
            </Modal>
          </>
        }
      </div>
    </div>
  );
}

export default PlanningPage;