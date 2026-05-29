// Settings — rendered as a Modal sheet (consistent with Upload + Edit profile pattern).

function SettingsScreen({ onClose, onOpenProfile }) {
  const icon = (path, fill = false) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
  );
  return (
    <Modal open={true} title="Réglages" subtitle="Application et préférences" onClose={onClose}>
      <div style={{ padding: '16px 0 30px' }}>
        <ListSection title="Profil">
          <ListRow
            icon={icon(<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></>)}
            title="Profil utilisateur" detail="Camille · 32 ans · F"
            onClick={onOpenProfile} isLast/>
        </ListSection>
        <ListSection title="Configuration">
          <ListRow
            icon={icon(<><path d="M21 12.7V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6.3"/><path d="M7 12V7a5 5 0 0 1 10 0v5"/></>)}
            title="Clé API Mistral" detail="•••• 8f2a"/>
          <ListRow
            icon={icon(<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/></>)}
            title="Base de données" detail="5 analyses · 142 ko" isLast/>
        </ListSection>
        <ListSection title="Support">
          <ListRow
            icon={icon(<><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.83 1c0 2-3 2.5-3 4.5"/><path d="M12 18h.01"/></>)}
            title="Centre d'aide"/>
          <ListRow
            icon={icon(<><path d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6l-8-4z"/></>)}
            title="Confidentialité & sécurité"/>
          <ListRow
            icon={icon(<><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>)}
            title="À propos" detail="v1.2.0" isLast/>
        </ListSection>

        <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <HemeaWordmark size={14} color={HEMEA.muted}/>
          <div style={{ fontSize: 11, color: HEMEA.faint }}>Données stockées localement · SQLite chiffrée</div>
        </div>
      </div>
    </Modal>
  );
}

window.SettingsScreen = SettingsScreen;
