// Upload — main "Nouvelle analyse" choice screen is itself a Modal opened from the FAB.
// Picking a method opens a nested Modal (AI flow / manual flow) on top.

function UploadScreen({ onImported, onClose }) {
  const [mode, setMode] = React.useState(null); // null | 'ai' | 'manual'

  const closeInner = () => setMode(null);
  const handleImported = () => { setMode(null); onImported && onImported(); };

  return (
    <>
      <Modal
        open={true}
        title="Nouvelle analyse"
        subtitle="Choisissez votre méthode"
        onClose={onClose}
      >
        <ImportChoice onChoose={setMode}/>
      </Modal>

      <Modal
        open={mode === 'ai'}
        title="Import par IA"
        subtitle="OCR Mistral · 100% local"
        onClose={closeInner}
      >
        <AIUploadFlow onImported={handleImported}/>
      </Modal>

      <Modal
        open={mode === 'manual'}
        title="Import manuel"
        subtitle="Saisissez vos valeurs"
        onClose={closeInner}
        onPrimary={handleImported}
        primaryLabel="Enregistrer"
      >
        <ManualEntryFlow onImported={handleImported}/>
      </Modal>
    </>
  );
}

// ─── Choice screen (rendered INSIDE the outer Modal) ─────────
function ImportChoice({ onChoose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 16px 30px' }}>

      <button onClick={() => onChoose('ai')} style={{
        background: '#fff', border: `1px solid ${HEMEA.border}`,
        borderRadius: 18, padding: '20px 18px', cursor: 'pointer',
        fontFamily: 'inherit', textAlign: 'left',
        boxShadow: '0 4px 14px rgba(44,123,229,.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'linear-gradient(135deg, #2C7BE5 0%, #4FA3F5 100%)',
          color: '#fff', fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 999, letterSpacing: '.04em', textTransform: 'uppercase',
        }}>Recommandé</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #2C7BE5 0%, #4FA3F5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(44,123,229,.30)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>
              <circle cx="12" cy="12" r="4" fill="#fff"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: HEMEA.text, letterSpacing: '-0.01em' }}>Import par IA</div>
            <div style={{ fontSize: 13, color: HEMEA.body, marginTop: 4, lineHeight: 1.45 }}>
              Glissez un PDF de bilan. L'OCR Mistral extrait automatiquement la date et tous les marqueurs.
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ background: HEMEA.bgBlue, color: HEMEA.primary, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999 }}>~20 s</span>
              <span style={{ background: HEMEA.bgBlue, color: HEMEA.primary, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999 }}>PDF</span>
              <span style={{ background: HEMEA.bgBlue, color: HEMEA.primary, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999 }}>Tous marqueurs</span>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={HEMEA.muted} strokeWidth="2.4"><polyline points="9 6 15 12 9 18"/></svg>
        </div>
      </button>

      <button onClick={() => onChoose('manual')} style={{
        background: '#fff', border: `1px solid ${HEMEA.border}`,
        borderRadius: 18, padding: '20px 18px', cursor: 'pointer',
        fontFamily: 'inherit', textAlign: 'left',
        boxShadow: '0 2px 8px rgba(18,38,63,.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: HEMEA.bgBlue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={HEMEA.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: HEMEA.text, letterSpacing: '-0.01em' }}>Import manuel</div>
            <div style={{ fontSize: 13, color: HEMEA.body, marginTop: 4, lineHeight: 1.45 }}>
              Saisissez vous-même chaque valeur. Idéal si vous n'avez pas le PDF ou que l'OCR a manqué un marqueur.
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ background: HEMEA.bg, color: HEMEA.body, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, border: `1px solid ${HEMEA.border}` }}>Hors ligne</span>
              <span style={{ background: HEMEA.bg, color: HEMEA.body, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, border: `1px solid ${HEMEA.border}` }}>Sans clé API</span>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={HEMEA.muted} strokeWidth="2.4"><polyline points="9 6 15 12 9 18"/></svg>
        </div>
      </button>

      <div style={{ fontSize: 12, color: HEMEA.muted, textAlign: 'center', marginTop: 6, padding: '0 8px' }}>
        Vos données ne quittent jamais l'appareil. Seul l'OCR transite par votre clé Mistral.
      </div>
    </div>
  );
}

// ─── AI flow (PDF + OCR steps) — rendered inside a Modal ──────
function AIUploadFlow({ onImported }) {
  const [phase, setPhase] = React.useState('idle');
  const [completed, setCompleted] = React.useState([]);
  const [current, setCurrent] = React.useState(null);

  const steps = [
    'Importation du document',
    'Extraction de la date',
    'Analyse · Hématologie',
    'Analyse · Biochimie',
    'Analyse · Lipides',
    'Analyse · TSH',
    "Sauvegarde de l'analyse",
  ];

  const start = () => {
    setPhase('analyzing'); setCompleted([]); setCurrent(steps[0]);
    let i = 0;
    const tick = () => {
      if (i >= steps.length) { setPhase('done'); setCurrent(null); setTimeout(() => onImported && onImported(), 900); return; }
      setCurrent(steps[i]);
      setTimeout(() => {
        setCompleted((c) => [...c, steps[i]]);
        i += 1; tick();
      }, 550);
    };
    tick();
  };

  return (
    <div style={{ padding: '20px 20px 40px' }}>
      <div style={{
        background: HEMEA.bgBlue, border: `1.5px dashed ${HEMEA.primary}`,
        borderRadius: 18, padding: '28px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#fff',
          boxShadow: '0 4px 14px rgba(44,123,229,.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={HEMEA.primary} strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: HEMEA.text }}>Sélectionnez un PDF</div>
        <div style={{ fontSize: 13, color: HEMEA.body, maxWidth: 280 }}>
          Bilan sanguin, biochimie, lipides… L'extraction des valeurs est automatique.
        </div>
        <PrimaryButton size="lg" onClick={start} disabled={phase === 'analyzing'} style={{ minWidth: 220, marginTop: 6 }}>
          {phase === 'analyzing' ? 'Analyse en cours…' : 'Sélectionner & analyser PDF'}
        </PrimaryButton>
      </div>

      {phase !== 'idle' && (
        <div style={{ marginTop: 16, background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 6px rgba(18,38,63,.06)' }}>
          {steps.map((s) => {
            const isCompleted = completed.includes(s);
            const isCurrent = current === s;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                {isCompleted ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={HEMEA.success}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.3 14.4L6.4 12.1l1.4-1.4 2.9 2.9 5.5-5.5 1.4 1.4-6.9 6.9z"/></svg>
                ) : isCurrent ? (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2.5px solid ${HEMEA.primary}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}/>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={HEMEA.muted} strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                )}
                <span style={{ fontSize: 13.5, fontWeight: isCurrent ? 700 : 500, color: isCompleted ? HEMEA.successDeep : isCurrent ? HEMEA.primary : HEMEA.muted }}>{s}</span>
              </div>
            );
          })}
        </div>
      )}

      {phase === 'done' && <div style={{ marginTop: 14 }}><Banner kind="success">Analyse extraite et sauvegardée.</Banner></div>}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Manual entry flow — rendered inside a Modal ──────────────
function ManualEntryFlow({ onImported }) {
  const [date, setDate] = React.useState('12/03/2024');
  const [values, setValues] = React.useState({ crp: '3.4', hemoglobine: '14.2', cholesterol: '1.85', tsh: '2.1' });

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 14, marginBottom: 14,
        boxShadow: '0 2px 6px rgba(18,38,63,.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>Date du bilan</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: HEMEA.text, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{date}</div>
        </div>
        <button style={{ background: HEMEA.bgBlue, color: HEMEA.primary, border: 'none', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Modifier
        </button>
      </div>

      {window.HEMEA_CATEGORIES.map((cat) => (
        <div key={cat.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 4px 8px' }}>{cat.name}</div>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 6px rgba(18,38,63,.06)', overflow: 'hidden' }}>
            {cat.markers.map((m, i) => (
              <div key={m.key} style={{
                padding: '12px 14px',
                borderTop: i === 0 ? 'none' : `1px solid ${HEMEA.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, color: HEMEA.text, fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: HEMEA.muted, marginTop: 1 }}>Plage&nbsp;: {m.refMin}–{m.refMax} {m.unit}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    inputMode="decimal"
                    value={values[m.key] || ''}
                    onChange={(e) => setValues({ ...values, [m.key]: e.target.value })}
                    placeholder="—"
                    style={{
                      width: 70, padding: '8px 10px', textAlign: 'right',
                      fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
                      color: HEMEA.text, fontVariantNumeric: 'tabular-nums',
                      background: HEMEA.bg, border: `1px solid ${HEMEA.border}`,
                      borderRadius: 8, outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 11, color: HEMEA.muted, minWidth: 32 }}>{m.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ fontSize: 11, color: HEMEA.muted, textAlign: 'center', marginTop: 8 }}>
        Vous pouvez laisser des valeurs vides ; elles ne s'afficheront pas dans les graphiques.
      </div>
    </div>
  );
}

window.UploadScreen = UploadScreen;
