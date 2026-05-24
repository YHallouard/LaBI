// Analysis detail — drill-in from Home. Shows full marker table.

function AnalysisDetailScreen({ analysis, onBack }) {
  if (!analysis) return null;
  const rows = HEMEA_CATEGORIES.flatMap((cat) => cat.markers.map((m) => ({
    category: cat.name, ...m, value: analysis[m.key],
    out: analysis[m.key] < m.refMin || analysis[m.key] > m.refMax,
  })));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 16px 4px' }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', color: HEMEA.primary,
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 15, padding: 0, cursor: 'pointer',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={HEMEA.primary} strokeWidth="2.2"><polyline points="15 6 9 12 15 18"/></svg>
          Mes analyses
        </button>
      </div>
      <ScreenHeader title="Bilan sanguin" subtitle={analysis.date}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 120px' }}>
        {HEMEA_CATEGORIES.map((cat) => (
          <div key={cat.id} style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 11, color: HEMEA.muted, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', padding: '4px 4px 8px',
            }}>{cat.name}</div>
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 3px rgba(18,38,63,.06)', overflow: 'hidden' }}>
              {cat.markers.map((m, i) => {
                const v = analysis[m.key];
                const out = v < m.refMin || v > m.refMax;
                return (
                  <div key={m.key} style={{
                    padding: '14px 16px',
                    borderTop: i === 0 ? 'none' : `1px solid ${HEMEA.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, color: HEMEA.text, fontWeight: 500 }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: HEMEA.muted, marginTop: 2 }}>Plage&nbsp;: {m.refMin} – {m.refMax} {m.unit}</div>
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 700,
                      color: out ? HEMEA.danger : HEMEA.primary,
                      fontVariantNumeric: 'tabular-nums',
                    }}>{v.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 500, color: HEMEA.muted }}>{m.unit}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {rows.some(r => r.out) && (
          <Banner kind="warning">
            Une ou plusieurs valeurs sont hors plage. Discutez‑en avec votre médecin.
          </Banner>
        )}
      </div>
    </div>
  );
}

window.AnalysisDetailScreen = AnalysisDetailScreen;
