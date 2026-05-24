// Home — large profile header that shrinks on scroll, Héméa brand mark, then
// indicator card, "Mes analyses" CTA, and pinned charts.

function PersonAvatar({ size = 56 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #E5363F 0%, #CE5283 50%, #C255DF 100%)',
      padding: 2,
      boxShadow: '0 4px 14px rgba(206,82,131,.30)',
      flexShrink: 0,
      transition: 'width 200ms var(--hemea-ease-out, ease-out), height 200ms var(--hemea-ease-out, ease-out), box-shadow 200ms',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '-apple-system, "SF Pro Display", Inter',
        fontWeight: 700, fontSize: size * 0.36,
        color: HEMEA.text,
        letterSpacing: '-0.02em',
      }}>
        CL
      </div>
    </div>
  );
}

function imbalanceForAnalysis(a) {
  const markers = window.HEMEA_CATEGORIES.flatMap(c => c.markers);
  let out = 0;
  markers.forEach((m) => {
    const v = a[m.key];
    if (typeof v !== 'number' || v < m.refMin || v > m.refMax) out += 1;
  });
  return out / markers.length;
}

function BalanceTrendChart({ points, refMax = 0.5 }) {
  const W = 320, H = 110;
  const pad = { l: 6, r: 6, t: 8, b: 22 };
  const minT = Math.min(...points.map(p => p.t));
  const maxT = Math.max(...points.map(p => p.t));
  const xOf = (t) => pad.l + ((t - minT) / (maxT - minT || 1)) * (W - pad.l - pad.r);
  const yOf = (v) => H - pad.b - (v / 1) * (H - pad.t - pad.b);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.t).toFixed(1)} ${yOf(p.v).toFixed(1)}`).join(' ');
  const bandTop = yOf(refMax), bandBot = yOf(0);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="balance-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00C800" stopOpacity="0.22"/>
          <stop offset="1" stopColor="#00C800" stopOpacity="0.04"/>
        </linearGradient>
        <linearGradient id="balance-mask-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0"/>
          <stop offset="0.06" stopColor="#fff" stopOpacity="1"/>
          <stop offset="0.94" stopColor="#fff" stopOpacity="1"/>
          <stop offset="1" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
        <mask id="balance-band-mask"><rect x="0" y="0" width={W} height={H} fill="url(#balance-mask-h)"/></mask>
        <linearGradient id="balance-line" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2C7BE5"/><stop offset="1" stopColor="#4484B2"/></linearGradient>
      </defs>
      <line x1={pad.l} x2={W - pad.r} y1={pad.t} y2={pad.t} stroke="#F1F4F8"/>
      <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="#F1F4F8"/>
      <rect x="0" y={bandTop} width={W} height={Math.max(0, bandBot - bandTop)} fill="url(#balance-band)" mask="url(#balance-band-mask)"/>
      <path d={path} fill="none" stroke="url(#balance-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => {
        const out = p.v > refMax;
        return <circle key={i} cx={xOf(p.t)} cy={yOf(p.v)} r={i === points.length - 1 ? 5 : 3.5} fill={out ? HEMEA.danger : HEMEA.primary} stroke="#fff" strokeWidth="1.5"/>;
      })}
      <g fontFamily="Inter" fontSize="9" fill="#95AAC9" textAnchor="middle">
        {[0, Math.floor(points.length / 2), points.length - 1].map((i) => (
          <text key={i} x={xOf(points[i].t)} y={H - 6}>{points[i].label}</text>
        ))}
      </g>
    </svg>
  );
}

function BalanceCard({ analyses }) {
  const sorted = [...analyses].sort((a, b) => a.timestamp - b.timestamp);
  const points = sorted.map((a) => ({ t: a.timestamp, v: imbalanceForAnalysis(a), label: a.dateShort }));
  const latest = points[points.length - 1].v;
  const isGood = latest <= 0.5;
  const totalMarkers = window.HEMEA_CATEGORIES.flatMap(c => c.markers).length;
  const outMarkers = Math.round(latest * totalMarkers);
  const inMarkers = totalMarkers - outMarkers;
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '16px 16px 12px',
      boxShadow: '0 4px 14px rgba(18,38,63,.06)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>Indicateur</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: HEMEA.text, marginTop: 2, letterSpacing: '-0.01em' }}>Équilibre biologique</div>
          <div style={{ fontSize: 12, color: HEMEA.body, marginTop: 3 }}>{inMarkers} marqueurs sur {totalMarkers} dans la plage normale</div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 4,
          background: isGood ? 'rgba(0,217,126,.10)' : 'rgba(229,54,63,.10)',
          color: isGood ? HEMEA.successDeep : HEMEA.danger,
          padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
        }}>{latest.toFixed(2)}<span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>actuel</span></div>
      </div>
      <BalanceTrendChart points={points} refMax={0.5}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: HEMEA.muted }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 8, background: 'rgba(0,200,0,.22)', borderRadius: 3 }}/>
          Zone d'équilibre (≤ 0.50)
        </span>
        <span>Plus bas = meilleur</span>
      </div>
    </div>
  );
}

function PinnedChartCard({ marker, points, onUnpin }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '12px 12px 8px', boxShadow: '0 2px 6px rgba(18,38,63,.06)', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: HEMEA.text }}>{marker.label}</div>
          <div style={{ fontSize: 10.5, color: HEMEA.muted }}>
            Dernier&nbsp;: <b style={{ color: HEMEA.text, fontVariantNumeric: 'tabular-nums' }}>{points[points.length - 1].v.toFixed(2)}</b> {marker.unit} · plage {marker.refMin}–{marker.refMax}
          </div>
        </div>
        <button onClick={onUnpin} aria-label="Désépingler" style={{
          background: HEMEA.bgBlue, border: 'none', borderRadius: 999, padding: '4px 8px',
          color: HEMEA.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"/></svg>
          Épinglé
        </button>
      </div>
      <MiniChart marker={marker} points={points} refMin={marker.refMin} refMax={marker.refMax}/>
    </div>
  );
}

// ─── Collapsible profile header ──────────────────────────────
// `progress` goes 0→1 as the user scrolls. We interpolate.
function ProfileHero({ progress, profile, analysesCount, onOpenSettings }) {
  // Clamp 0..1
  const p = Math.max(0, Math.min(1, progress));
  const lerp = (a, b) => a + (b - a) * p;

  const avatarSize = lerp(84, 40);
  const nameSize   = lerp(30, 18);
  const padV       = lerp(20, 10);
  const gap        = lerp(16, 10);
  const showHello  = p < 0.6;
  const showMeta   = p < 0.4;

  return (
    <div style={{
      position: 'relative',
      padding: `${padV}px 20px ${padV}px`,
      display: 'flex', alignItems: 'center', gap,
      transition: 'padding 200ms ease-out',
      zIndex: 1,
    }}>
      <PersonAvatar size={avatarSize}/>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {showHello && (
          <div style={{
            fontSize: lerp(13, 11), color: HEMEA.muted, fontWeight: 500,
            opacity: lerp(1, 0), transition: 'opacity 150ms',
          }}>Bonjour,</div>
        )}
        <div style={{
          fontSize: nameSize, fontWeight: 800, color: HEMEA.text,
          letterSpacing: '-0.02em', lineHeight: 1.12,
          transition: 'font-size 200ms ease-out',
        }}>{profile.name.split(' ')[0]}</div>
        {showMeta && (
          <div style={{
            display: 'flex', gap: 8, marginTop: 4, fontSize: 13, color: HEMEA.body, alignItems: 'center',
            opacity: lerp(1, 0), transition: 'opacity 150ms', whiteSpace: 'nowrap',
          }}>
            <span><b style={{ color: HEMEA.text, fontWeight: 700 }}>{profile.age}</b>&nbsp;ans · {profile.sex}</span>
            <span style={{ color: HEMEA.muted }}>·</span>
            <span><b style={{ color: HEMEA.text, fontWeight: 700 }}>{analysesCount}</b>&nbsp;analyses</span>
          </div>
        )}
      </div>
      <button onClick={onOpenSettings} aria-label="Réglages" style={{
        width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', border: 'none',
        background: 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 4px 14px rgba(18,38,63,.08), inset 0 1px 0 rgba(255,255,255,.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={HEMEA.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
        </svg>
      </button>
    </div>
  );
}

function HomeScreen({ analyses, pinned, onUnpin, onOpenAnalysis, onGoUpload, onOpenSettings, onSeeAllAnalyses, onGoCharts }) {
  const showEmpty = !analyses || analyses.length === 0;
  const profile = { name: 'Camille Leroy', age: 32, sex: 'F' };
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const scrollRef = React.useRef(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const SHRINK_RANGE = 80; // px of scroll to fully collapse
    setScrollTop(el.scrollTop);
    setScrollProgress(Math.max(0, Math.min(1, el.scrollTop / SHRINK_RANGE)));
  };

  const sortedAsc = [...analyses].sort((a, b) => a.timestamp - b.timestamp);
  const pinnedSeries = (pinned || []).map((key) => {
    const marker = window.HEMEA_CATEGORIES.flatMap(c => c.markers).find(m => m.key === key);
    if (!marker) return null;
    return { marker, points: sortedAsc.map(a => ({ t: a.timestamp, v: a[key], label: a.dateShort })) };
  }).filter(Boolean);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
      {/* Hero gradient — anchored to the top of the screen; translated upward as the user scrolls.
          Sits behind everything else (z-index 0) and is non-interactive. Tall enough to comfortably
          fade past the profile + indicator card; the bottom 35 % is transparent so it blends into
          the page background. */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: -50, left: 0, right: 0, height: 530,
        background: 'linear-gradient(to bottom, rgba(44,123,229,0.38) 0%, rgba(44,123,229,0.30) 18%, rgba(44,123,229,0.12) 50%, rgba(248,249,250,0.0) 85%)',
        transform: `translateY(${-scrollTop}px)`,
        pointerEvents: 'none', zIndex: 0,
      }}/>
      {/* Top brand mark — always visible */}
      <div style={{
        padding: '4px 20px 0', display: 'flex', alignItems: 'center', gap: 4,
        position: 'relative', zIndex: 1,
      }}>
        <HemeaWordmark size={16} color={HEMEA.text}/>
      </div>

      {showEmpty ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: HEMEA.text }}>Aucune analyse</div>
          <div style={{ fontSize: 14, color: HEMEA.muted, textAlign: 'center', marginBottom: 8 }}>Importez un bilan sanguin pour commencer.</div>
          <PrimaryButton size="md" onClick={onGoUpload}>Importer un PDF</PrimaryButton>
        </div>
      ) : (
        <>
          {/* Collapsible profile hero (sits outside the scroll container) */}
          <ProfileHero
            progress={scrollProgress}
            profile={profile}
            analysesCount={analyses.length}
            onOpenSettings={onOpenSettings}
          />

          <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflow: 'auto', padding: '6px 16px 120px', position: 'relative', zIndex: 1 }}>
            <BalanceCard analyses={analyses}/>

            <button onClick={onSeeAllAnalyses} style={{
              marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#fff', border: `1px solid ${HEMEA.border}`,
              borderRadius: 14, padding: '14px 16px',
              boxShadow: '0 2px 6px rgba(18,38,63,.05)', fontFamily: 'inherit', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: HEMEA.bgBlue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={HEMEA.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: HEMEA.text }}>Mes analyses</div>
                  <div style={{ fontSize: 12, color: HEMEA.muted }}>{analyses.length} bilans importés</div>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={HEMEA.muted} strokeWidth="2.4"><polyline points="9 6 15 12 9 18"/></svg>
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 4px 8px' }}>
              <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Graphiques épinglés</div>
              <button onClick={onGoCharts} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: HEMEA.primary, fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Tous les graphiques</button>
            </div>

            {pinnedSeries.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 16px', border: `1px dashed ${HEMEA.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: HEMEA.body, marginBottom: 8 }}>Aucun graphique épinglé. Épinglez vos marqueurs préférés depuis l'onglet Graphiques.</div>
                <PrimaryButton size="sm" variant="ghost" onClick={onGoCharts}>Parcourir les graphiques</PrimaryButton>
              </div>
            ) : (
              pinnedSeries.map(({ marker, points }) => (
                <PinnedChartCard key={marker.key} marker={marker} points={points} onUnpin={() => onUnpin(marker.key)}/>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

window.HomeScreen = HomeScreen;
