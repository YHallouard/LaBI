// Profile — view/consult the user profile. Top-right glass FAB opens edit mode.

function ProfileScreen({ onClose }) {
  const [editing, setEditing] = React.useState(false);
  const [profile, setProfile] = React.useState({
    firstName: 'Camille',
    lastName: 'Leroy',
    age: 32,
    sex: 'F',
    birthDate: '12/03/1992',
    email: 'camille@hemea.app',
    weight: 62,
    height: 168,
  });

  const Row = ({ label, value, mono }) => (
    <div style={{
      padding: '14px 16px',
      borderTop: `1px solid ${HEMEA.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <span style={{ fontSize: 13, color: HEMEA.body }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: 600, color: HEMEA.text,
        fontVariantNumeric: mono ? 'tabular-nums' : 'normal',
      }}>{value}</span>
    </div>
  );

  return (
    <Modal open={true} title="Profil" subtitle="Vos informations" onClose={onClose}>
      <div style={{ position: 'relative', padding: '20px 16px 30px' }}>

        {/* Top-right Edit FAB (glass) */}
        <button onClick={() => setEditing(true)} aria-label="Modifier le profil" style={{
          position: 'absolute', top: 8, right: 16,
          width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
          background: 'rgba(255,255,255,0.62)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255,255,255,.7)',
          boxShadow: '0 4px 14px rgba(18,38,63,.10), inset 0 1px 0 rgba(255,255,255,.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={HEMEA.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/>
          </svg>
        </button>

        {/* Hero: avatar + name + age */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <PersonAvatar size={92}/>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: HEMEA.text, letterSpacing: '-0.02em' }}>
              {profile.firstName} {profile.lastName}
            </div>
            <div style={{ fontSize: 13, color: HEMEA.muted, marginTop: 2 }}>
              {profile.age} ans · {profile.sex === 'F' ? 'Femme' : 'Homme'}
            </div>
          </div>
        </div>

        {/* Identity */}
        <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 4px 8px' }}>Identité</div>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 6px rgba(18,38,63,.06)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: HEMEA.body }}>Prénom</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: HEMEA.text }}>{profile.firstName}</span>
          </div>
          <Row label="Nom" value={profile.lastName}/>
          <Row label="Date de naissance" value={profile.birthDate} mono/>
          <Row label="Sexe" value={profile.sex === 'F' ? 'Femme' : 'Homme'}/>
        </div>

        {/* Body */}
        <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '18px 4px 8px' }}>Mensurations</div>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 6px rgba(18,38,63,.06)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: HEMEA.body }}>Poids</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: HEMEA.text, fontVariantNumeric: 'tabular-nums' }}>{profile.weight} kg</span>
          </div>
          <Row label="Taille" value={`${profile.height} cm`} mono/>
        </div>

        {/* Contact */}
        <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '18px 4px 8px' }}>Contact</div>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 6px rgba(18,38,63,.06)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: HEMEA.body }}>Email</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: HEMEA.text }}>{profile.email}</span>
          </div>
        </div>

        <div style={{ fontSize: 11, color: HEMEA.muted, textAlign: 'center', marginTop: 18, padding: '0 12px' }}>
          Vos informations restent sur votre appareil et déterminent les plages de référence appliquées à vos analyses.
        </div>
      </div>

      {/* Edit profile modal — opens on top of profile view */}
      <Modal
        open={editing}
        title="Modifier le profil"
        onClose={() => setEditing(false)}
        onPrimary={() => setEditing(false)}
        primaryLabel="Enregistrer"
      >
        <ProfileEditForm profile={profile} onChange={setProfile}/>
      </Modal>
    </Modal>
  );
}

function ProfileEditForm({ profile, onChange }) {
  const update = (k, v) => onChange({ ...profile, [k]: v });
  const inputStyle = {
    width: '100%', padding: '12px 14px', boxSizing: 'border-box',
    fontFamily: 'inherit', fontSize: 15, color: HEMEA.text,
    background: '#fff', border: `1px solid ${HEMEA.border}`,
    borderRadius: 10, outline: 'none',
  };
  return (
    <div style={{ padding: '20px 16px 30px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <PersonAvatar size={76}/>
        <button style={{
          background: HEMEA.bgBlue, color: HEMEA.primary, border: 'none',
          borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
        }}>Changer la photo</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 600, marginBottom: 6 }}>Prénom</div>
          <input style={inputStyle} value={profile.firstName} onChange={(e) => update('firstName', e.target.value)}/>
        </div>
        <div>
          <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 600, marginBottom: 6 }}>Nom</div>
          <input style={inputStyle} value={profile.lastName} onChange={(e) => update('lastName', e.target.value)}/>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 600, marginBottom: 6 }}>Date de naissance</div>
          <input style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }} value={profile.birthDate} onChange={(e) => update('birthDate', e.target.value)}/>
        </div>
        <div>
          <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 600, marginBottom: 6 }}>Sexe</div>
          <div style={{ display: 'flex', background: HEMEA.bgBlue, borderRadius: 999, padding: 3, height: 44 }}>
            {['F', 'M'].map((s) => (
              <button key={s} onClick={() => update('sex', s)} style={{
                flex: 1, border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 600,
                background: profile.sex === s ? '#fff' : 'transparent',
                color: profile.sex === s ? HEMEA.primary : HEMEA.body,
                boxShadow: profile.sex === s ? '0 1px 3px rgba(44,123,229,.20)' : 'none',
              }}>{s === 'F' ? 'Femme' : 'Homme'}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 600, marginBottom: 6 }}>Poids (kg)</div>
          <input inputMode="decimal" style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }} value={profile.weight} onChange={(e) => update('weight', e.target.value)}/>
        </div>
        <div>
          <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 600, marginBottom: 6 }}>Taille (cm)</div>
          <input inputMode="numeric" style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }} value={profile.height} onChange={(e) => update('height', e.target.value)}/>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: HEMEA.muted, fontWeight: 600, marginBottom: 6 }}>Email</div>
        <input type="email" style={inputStyle} value={profile.email} onChange={(e) => update('email', e.target.value)}/>
      </div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
