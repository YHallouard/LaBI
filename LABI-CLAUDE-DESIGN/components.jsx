// Shared Héméa mobile UI primitives. Loaded as a Babel script.
// Exposes via window so other component files can use them.

const HEMEA = {
  primary: '#2C7BE5',
  primaryHover: '#1F66C9',
  secondary: '#00B4A6',
  text: '#12263F',
  body: '#5A7184',
  muted: '#95AAC9',
  faint: '#ADB5BD',
  bg: '#F8F9FA',
  bgBlue: '#EEF2FB',
  surface: '#FFFFFF',
  border: '#E3EBF6',
  success: '#6DD39A',
  successDeep: '#00A86B',
  warning: '#FFC107',
  warningDeep: '#856404',
  danger: '#E5363F',
  labAlert: '#CE5283'
};

// ─── Hemea brand wordmark with drop ──────────────────────────
function HemeaWordmark({ size = 22, color = HEMEA.text }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <span style={{
        fontSize: size, fontWeight: 800, color,
        letterSpacing: '-0.02em', fontFamily: '-apple-system, "SF Pro Display", Inter'
      }}>Héméa</span>
      <svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" style={{ marginLeft: -2 }}>
        <defs>
          <linearGradient id={`hg-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E5363F" />
            <stop offset="0.5" stopColor="#CE5283" />
            <stop offset="1" stopColor="#C255DF" />
          </linearGradient>
        </defs>
        <path d="M12 2C9 5 6 9 6 13a6 6 0 0 0 12 0c0-4-3-8-6-11z" fill={`url(#hg-${size})`} />
      </svg>
    </div>);

}

// ─── Glass FAB (round) ──────────────────────────────────────
function GlassFAB({ children, onClick, ariaLabel, style = {} }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel} style={{
      width: 44, height: 44, borderRadius: '50%',
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.7)',
      boxShadow: '0 6px 20px rgba(18,38,63,.10), inset 0 1px 0 rgba(255,255,255,.8)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style
    }}>{children}</button>);

}

// ─── Liquid Glass tab bar: compact pill + primary FAB ───────
function TabBar({ active, onChange, onImport }) {
  const TabIcon = ({ id, isActive }) => {
    const stroke = isActive ? HEMEA.primary : HEMEA.body;
    if (id === 'home') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11 12 3l9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z" /></svg>;
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="12" width="4" height="8" /><rect x="10" y="6" width="4" height="14" /><rect x="17" y="3" width="4" height="17" /></svg>;
  };
  const tabs = [{ id: 'home', label: 'Accueil' }, { id: 'charts', label: 'Graphiques' }];

  const Tab = ({ id, label }) => {
    const isActive = id === active;
    return (
      <button onClick={() => onChange(id)} style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        width: 78, padding: '7px 0 6px', borderRadius: 9999, gap: 1, border: 'none',
        background: isActive ? '#fff' : 'transparent',
        boxShadow: isActive ? '0 2px 6px rgba(18,38,63,.10), inset 0 1px 0 rgba(255,255,255,.8)' : 'none',
        color: isActive ? HEMEA.primary : HEMEA.body,
        fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
        transition: 'all 200ms'
      }}>
        <TabIcon id={id} isActive={isActive} />
        {label}
      </button>);

  };

  return (
    <div style={{
      position: 'absolute', left: 18, right: 18, bottom: 22,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 2, padding: 5,
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(255,255,255,.65)',
        borderRadius: 9999,
        boxShadow: '0 12px 30px rgba(18,38,63,.10), inset 0 1px 0 rgba(255,255,255,.8)'
      }}>
        {tabs.map((t) => <Tab key={t.id} id={t.id} label={t.label} />)}
      </div>
      <button onClick={onImport} aria-label="Importer un PDF" style={{
        width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: HEMEA.primary, color: '#fff',
        boxShadow: '0 6px 20px rgba(44,123,229,.45), inset 0 1px 0 rgba(255,255,255,.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>);

}

// ─── Top header w/ title + logo ──────────────────────────────
function ScreenHeader({ title, subtitle, right, showLogo = false }) {
  return (
    <div style={{
      padding: '16px 20px 12px',
      background: HEMEA.bg,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 12
    }}>
      <div>
        {showLogo && <div style={{ marginBottom: 4 }}><HemeaWordmark size={14} color={HEMEA.muted} /></div>}
        <div style={{
          fontSize: 28, fontWeight: 800, color: HEMEA.text,
          letterSpacing: '-0.02em', lineHeight: 1.1
        }}>{title}</div>
        {subtitle &&
        <div style={{ fontSize: 14, color: HEMEA.body, marginTop: 4 }}>{subtitle}</div>
        }
      </div>
      {right}
    </div>);

}

// ─── Primary button ──────────────────────────────────────────
function PrimaryButton({ children, onClick, disabled, icon, size = 'md', style = {}, variant = 'primary' }) {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13, radius: 6 },
    md: { padding: '12px 22px', fontSize: 15, radius: 8 },
    lg: { padding: '15px 28px', fontSize: 16, radius: 8 }
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: HEMEA.primary, fg: '#fff' },
    secondary: { bg: HEMEA.secondary, fg: '#fff' },
    danger: { bg: HEMEA.danger, fg: '#fff' },
    ghost: { bg: 'transparent', fg: HEMEA.primary, border: `1.5px solid ${HEMEA.primary}` }
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#A0C7F0' : v.bg,
      color: v.fg, border: v.border || 'none',
      padding: s.padding, borderRadius: s.radius, fontSize: s.fontSize,
      fontWeight: 600, fontFamily: 'inherit',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'background 150ms',
      ...style
    }}>
      {icon}
      {children}
    </button>);

}

// ─── Analysis card (Home list) ───────────────────────────────
function AnalysisCard({ date, label, value, unit, alert, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 14, padding: '14px 16px',
      marginBottom: 10, cursor: 'pointer',
      boxShadow: '0 2px 6px rgba(18,38,63,.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 500, color: HEMEA.text }}>{date}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{
          fontSize: 22, fontWeight: 700,
          color: alert ? HEMEA.danger : HEMEA.primary,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1
        }}>{value}</span>
        <span style={{ fontSize: 11, color: HEMEA.muted }}>{unit}{alert ? ' · hors plage' : ''}</span>
      </div>
    </div>);

}

// ─── Stat card (chart screen) ────────────────────────────────
function StatCard({ label, value, unit, date, alert }) {
  return (
    <div style={{
      flex: 1, background: alert ? 'rgba(229,54,63,.10)' : '#fff',
      borderRadius: 10, padding: 12, textAlign: 'center',
      boxShadow: alert ? 'none' : '0 1px 2px rgba(18,38,63,.06)'
    }}>
      <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: alert ? HEMEA.danger : HEMEA.primary, fontVariantNumeric: 'tabular-nums' }}>
        {value} <span style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 500 }}>{unit}</span>
      </div>
      {date && <div style={{ fontSize: 10, color: HEMEA.muted, marginTop: 2 }}>{date}</div>}
    </div>);

}

// ─── List row (Settings) ─────────────────────────────────────
function ListRow({ icon, title, detail, onClick, isLast }) {
  return (
    <div onClick={onClick} style={{
      padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      cursor: 'pointer', position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: HEMEA.primary, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ fontSize: 15, color: HEMEA.text }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {detail && <span style={{ fontSize: 14, color: HEMEA.muted }}>{detail}</span>}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={HEMEA.muted} strokeWidth="2.5"><polyline points="9 6 15 12 9 18" /></svg>
      </div>
      {!isLast && <div style={{ position: 'absolute', left: 52, right: 16, bottom: 0, height: 1, background: HEMEA.border }} />}
    </div>);

}

function ListSection({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 11, color: HEMEA.muted, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        padding: '0 20px 8px'
      }}>{title}</div>
      <div style={{
        margin: '0 16px', background: '#fff', borderRadius: 14,
        boxShadow: '0 1px 3px rgba(18,38,63,.06)', overflow: 'hidden'
      }}>{children}</div>
    </div>);

}

// ─── Banner (success/error/warning) ──────────────────────────
function Banner({ kind = 'info', children }) {
  const styles = {
    success: { bg: 'rgba(0,217,126,.10)', border: HEMEA.successDeep, fg: HEMEA.successDeep },
    error: { bg: 'rgba(229,54,63,.10)', border: HEMEA.danger, fg: HEMEA.danger },
    warning: { bg: '#FFF3CD', border: '#FFEEBA', fg: HEMEA.warningDeep }
  };
  const s = styles[kind] || styles.success;
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
      padding: '12px 14px', color: s.fg, fontSize: 14, lineHeight: 1.4
    }}>{children}</div>);

}

Object.assign(window, {
  HEMEA,
  HemeaWordmark, TabBar, GlassFAB, ScreenHeader, PrimaryButton,
  AnalysisCard, StatCard, ListRow, ListSection, Banner
});