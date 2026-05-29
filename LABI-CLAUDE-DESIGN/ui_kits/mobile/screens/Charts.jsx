// Charts screen — multi-marker with reference range band.

function MiniChart({ marker, points, refMin, refMax }) {
  const W = 320, H = 130;
  const pad = { l: 28, r: 12, t: 10, b: 22 };
  const minTime = Math.min(...points.map(p => p.t));
  const maxTime = Math.max(...points.map(p => p.t));
  const values = points.map(p => p.v);
  const dataMin = Math.min(...values, refMin);
  const dataMax = Math.max(...values, refMax);
  const vMin = dataMin * 0.92, vMax = dataMax * 1.08;
  const x = (t) => pad.l + ((t - minTime) / (maxTime - minTime || 1)) * (W - pad.l - pad.r);
  const y = (v) => H - pad.b - ((v - vMin) / (vMax - vMin || 1)) * (H - pad.t - pad.b);

  // Smooth path
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v)}`).join(' ');

  // Band
  const yMax = y(refMax), yMin = y(refMin);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`bg-${marker.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00C800" stopOpacity="0.22"/>
          <stop offset="1" stopColor="#00C800" stopOpacity="0.04"/>
        </linearGradient>
        <linearGradient id={`mh-${marker.key}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0"/>
          <stop offset="0.08" stopColor="#fff" stopOpacity="1"/>
          <stop offset="0.92" stopColor="#fff" stopOpacity="1"/>
          <stop offset="1" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
        <mask id={`bm-${marker.key}`}>
          <rect x="0" y="0" width={W} height={H} fill={`url(#mh-${marker.key})`}/>
        </mask>
      </defs>
      {/* horizontal gridlines */}
      {[0, 0.33, 0.66, 1].map((f, i) => (
        <line key={i} x1={pad.l} x2={W - pad.r} y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)} stroke="#F1F4F8" strokeWidth="1"/>
      ))}
      {/* reference band */}
      <rect x="0" y={yMax} width={W} height={Math.max(0, yMin - yMax)} fill={`url(#bg-${marker.key})`} mask={`url(#bm-${marker.key})`}/>
      {/* line */}
      <path d={path} fill="none" stroke="#4484B2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* points */}
      {points.map((p, i) => {
        const out = p.v < refMin || p.v > refMax;
        return <circle key={i} cx={x(p.t)} cy={y(p.v)} r={out ? 4.5 : 4} fill={out ? HEMEA.danger : HEMEA.primary} stroke="#fff" strokeWidth="1.5"/>;
      })}
      {/* y labels */}
      <g fontFamily="Inter" fontSize="9" fill="#95AAC9" textAnchor="end">
        <text x={pad.l - 4} y={pad.t + 4}>{vMax.toFixed(1)}</text>
        <text x={pad.l - 4} y={H - pad.b + 3}>{vMin.toFixed(1)}</text>
      </g>
      {/* x labels — first/middle/last */}
      <g fontFamily="Inter" fontSize="9" fill="#95AAC9" textAnchor="middle">
        {[0, Math.floor(points.length / 2), points.length - 1].map((i) => (
          <text key={i} x={x(points[i].t)} y={H - 6}>{points[i].label}</text>
        ))}
      </g>
    </svg>
  );
}

// Educational info per marker — surfaced via the info sheet overlay.
// Also feeds the search index alongside the marker label.
const MARKER_INFO = {
  hemoglobine: "L'hémoglobine est la protéine des globules rouges qui transporte l'oxygène des poumons vers les tissus. Une valeur basse peut indiquer une anémie ; une valeur haute peut être liée à la déshydratation ou à un trouble de la moelle osseuse.",
  crp: "La protéine C-réactive (CRP) est un marqueur d'inflammation produit par le foie. Elle augmente en cas d'infection, d'inflammation chronique ou après un traumatisme. Une CRP basse (< 5 mg/L) est rassurante.",
  cholesterol: "Le cholestérol total reflète l'ensemble des lipides circulants (LDL, HDL, VLDL). Une valeur élevée durablement augmente le risque cardiovasculaire. À interpréter avec le rapport LDL/HDL et les triglycérides.",
  tsh: "La TSH (thyréostimuline) régule la thyroïde. Une TSH haute évoque une hypothyroïdie ; basse, une hyperthyroïdie. Elle se lit toujours avec la T4 libre."
};

// ─── Marker info sheet — full-screen overlay with backdrop blur ──
function MarkerInfoSheet({ marker, info, onClose }) {
  // Lock body scroll while open + close on Escape.
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(18,38,63,0.28)',
      backdropFilter: 'blur(18px) saturate(180%)',
      WebkitBackdropFilter: 'blur(18px) saturate(180%)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'hm-fade-in 220ms var(--hemea-ease-out, ease-out)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: '#fff',
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '8px 20px 28px',
        boxShadow: '0 -10px 30px rgba(18,38,63,.18)',
        animation: 'hm-slide-up 280ms var(--hemea-ease-spring, ease-out)',
        maxHeight: '80%', overflowY: 'auto',
      }}>
        {/* Grabber */}
        <div style={{ width: 38, height: 4, borderRadius: 999, background: HEMEA.border, margin: '4px auto 14px' }}/>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: HEMEA.bgBlue, color: HEMEA.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>À propos du marqueur</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: HEMEA.text, letterSpacing: '-0.01em' }}>{marker.label}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: HEMEA.bg, color: HEMEA.body, flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ fontSize: 14.5, color: HEMEA.body, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{info}</div>

        {/* Reference range row */}
        <div style={{
          marginTop: 16, padding: '12px 14px',
          background: HEMEA.bgBlue, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 12, color: HEMEA.body, fontWeight: 600 }}>Plage normale</div>
          <div style={{ fontSize: 14, color: HEMEA.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {marker.refMin} – {marker.refMax} {marker.unit}
          </div>
        </div>

        <div style={{ fontSize: 11, color: HEMEA.muted, marginTop: 12, textAlign: 'center' }}>
          Information à but pédagogique. Pour toute question médicale, consultez un professionnel.
        </div>
      </div>

      <style>{`
        @keyframes hm-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes hm-slide-up { from { transform: translateY(40px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

function ChartCard({ marker, points, latest, mean, max, pinned, onTogglePin, onOpenInfo }) {
  const out = (v) => v < marker.refMin || v > marker.refMax;
  const info = MARKER_INFO[marker.key];
  const titleClickable = !!info;
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '14px 14px 12px',
      marginBottom: 14, boxShadow: '0 2px 6px rgba(18,38,63,.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <button
          onClick={titleClickable ? () => onOpenInfo(marker) : undefined}
          disabled={!titleClickable}
          style={{
            background: 'transparent', border: 'none', padding: 0, margin: 0, textAlign: 'left',
            cursor: titleClickable ? 'pointer' : 'default', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: HEMEA.text, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {marker.label}
              {titleClickable && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={HEMEA.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                </svg>
              )}
            </div>
            <div style={{ fontSize: 11, color: HEMEA.muted }}>{marker.unit}</div>
          </div>
        </button>
        <button onClick={onTogglePin} aria-label={pinned ? 'Désépingler' : 'Épingler'} style={{
          background: pinned ? HEMEA.bgBlue : 'transparent',
          border: pinned ? 'none' : `1px solid ${HEMEA.border}`,
          borderRadius: 999, padding: '4px 10px',
          color: pinned ? HEMEA.primary : HEMEA.muted,
          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"/></svg>
          {pinned ? 'Épinglé' : 'Épingler'}
        </button>
      </div>

      <MiniChart marker={marker} points={points} refMin={marker.refMin} refMax={marker.refMax}/>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <StatCard label="Dernier" value={latest.v.toFixed(1)} unit={marker.unit} date={latest.label} alert={out(latest.v)}/>
        <StatCard label="Moyenne" value={mean.toFixed(1)} unit={marker.unit} alert={out(mean)}/>
        <StatCard label="Max" value={max.v.toFixed(1)} unit={marker.unit} date={max.label} alert={out(max.v)}/>
      </div>
      <div style={{ fontSize: 10, color: HEMEA.muted, textAlign: 'center', marginTop: 6 }}>
        Plage normale&nbsp;: {marker.refMin}&nbsp;–&nbsp;{marker.refMax}&nbsp;{marker.unit}
      </div>
    </div>
  );
}

function ChartsScreen({ analyses, pinned = [], onTogglePin = () => {} }) {
  const [range, setRange] = React.useState('3y');
  const [fabOpen, setFabOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [infoMarker, setInfoMarker] = React.useState(null);
  const ranges = ['1y', '3y', '5y', 'Max'];

  // Build series per marker — analyses sorted ascending by time
  const sorted = [...analyses].sort((a, b) => a.timestamp - b.timestamp);
  const buildSeries = (key) => sorted.map((a) => ({ t: a.timestamp, v: a[key], label: a.dateShort }));
  const stats = (pts) => {
    const sum = pts.reduce((s, p) => s + p.v, 0);
    const max = pts.reduce((m, p) => p.v > m.v ? p : m, pts[0]);
    return { latest: pts[pts.length - 1], mean: sum / pts.length, max };
  };

  // Search filter — case-insensitive, matches marker label OR explanatory info text.
  const q = query.trim().toLowerCase();
  const matches = (m) => {
    if (!q) return true;
    if (m.label.toLowerCase().includes(q)) return true;
    const info = MARKER_INFO[m.key];
    return info && info.toLowerCase().includes(q);
  };

  const visibleCats = HEMEA_CATEGORIES
    .map((c) => ({ ...c, markers: c.markers.filter(matches) }))
    .filter((c) => c.markers.length > 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top-right glass FAB — opens the time-range picker. Mirrors the Settings / Edit FAB pattern. */}
      <button onClick={() => setFabOpen(o => !o)} aria-label="Plage de temps" style={{
        position: 'absolute', top: 4, right: 18, zIndex: 5,
        minWidth: 56, height: 40, padding: '0 14px',
        borderRadius: 9999, cursor: 'pointer', border: 'none',
        background: 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 4px 14px rgba(18,38,63,.08), inset 0 1px 0 rgba(255,255,255,.8)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        fontFamily: 'inherit',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={HEMEA.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 7 12 12 16 14"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: HEMEA.primary, letterSpacing: '-0.01em' }}>{range}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={HEMEA.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -2, opacity: 0.7, transform: fabOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Popover with the 4 range options, anchored under the FAB */}
      {fabOpen && (
        <>
          {/* dismiss-on-tap-outside scrim */}
          <div onClick={() => setFabOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 6 }}/>
          <div style={{
            position: 'absolute', top: 50, right: 18, zIndex: 7,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,.7)',
            borderRadius: 14, padding: 4,
            boxShadow: '0 12px 30px rgba(18,38,63,.18), inset 0 1px 0 rgba(255,255,255,.8)',
            minWidth: 110,
            animation: 'hm-pop-in 180ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}>
            {ranges.map((r) => {
              const active = range === r;
              return (
                <button key={r} onClick={() => { setRange(r); setFabOpen(false); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? HEMEA.bgBlue : 'transparent',
                  color: active ? HEMEA.primary : HEMEA.text,
                  fontSize: 14, fontWeight: active ? 700 : 500, fontFamily: 'inherit',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {r === 'Max' ? 'Tout' : r === '1y' ? '1 an' : r === '3y' ? '3 ans' : '5 ans'}
                  {active && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="5 12 10 17 19 7"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          <style>{`@keyframes hm-pop-in { from { opacity: 0; transform: translateY(-6px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
        </>
      )}

      <ScreenHeader title="Graphiques" subtitle="Évolution dans le temps"/>

      {/* Search bar */}
      <div style={{ padding: '4px 16px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: `1px solid ${HEMEA.border}`,
          borderRadius: 12, padding: '10px 12px',
          boxShadow: '0 1px 3px rgba(18,38,63,.04)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={HEMEA.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un marqueur (ex. hémoglobine, inflammation…)"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'inherit', fontSize: 14, color: HEMEA.text,
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Effacer" style={{
              background: HEMEA.bgBlue, border: 'none', borderRadius: '50%',
              width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: HEMEA.primary, cursor: 'pointer', padding: 0,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 14px 120px' }}>
        {visibleCats.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 14, padding: '24px 18px',
            marginTop: 6, textAlign: 'center', border: `1px dashed ${HEMEA.border}`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: HEMEA.text }}>Aucun résultat</div>
            <div style={{ fontSize: 12, color: HEMEA.muted, marginTop: 4 }}>Essayez un autre terme. La recherche couvre les titres et les descriptions.</div>
          </div>
        ) : visibleCats.map((cat) => (
          <div key={cat.id} style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 11, color: HEMEA.muted, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', padding: '10px 4px 6px',
            }}>{cat.name}</div>
            {cat.markers.map((m) => {
              const pts = buildSeries(m.key);
              const s = stats(pts);
              return <ChartCard key={m.key} marker={m} points={pts} latest={s.latest} mean={s.mean} max={s.max}
                                pinned={pinned.includes(m.key)} onTogglePin={() => onTogglePin(m.key)}
                                onOpenInfo={setInfoMarker}/>;
            })}
          </div>
        ))}
      </div>

      {/* Info sheet overlay — full-screen, blurred backdrop */}
      {infoMarker && (
        <MarkerInfoSheet
          marker={infoMarker}
          info={MARKER_INFO[infoMarker.key]}
          onClose={() => setInfoMarker(null)}
        />
      )}
    </div>
  );
}

window.ChartsScreen = ChartsScreen;
window.MiniChart = MiniChart;
