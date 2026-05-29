// Héméa main app — click-through prototype.
// Base view = the active tab (Home / Charts). Upload, Settings, and AnalysesList
// render as Modal sheets on top. AnalysisDetail is a true drill-in that replaces.

function HemeaApp({ platform = 'ios' }) {
  const headerMode = platform === 'android' ? 'crossfade' : 'shrink';
  // iOS overlays its status bar (content needs a 50px inset); the Android frame
  // renders the status bar in-flow, so content starts at 0.
  const topInset = platform === 'android' ? 0 : 50;
  const [tab, setTab] = React.useState('home');
  const [overlay, setOverlay] = React.useState(null); // null | 'upload' | 'settings' | 'analyses'
  const [openAnalysis, setOpenAnalysis] = React.useState(null);
  const [analyses] = React.useState(window.HEMEA_ANALYSES);
  const [pinned, setPinned] = React.useState(['hemoglobine', 'cholesterol']);

  const togglePin = (key) => setPinned((p) => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);

  const goImport = () => setOverlay('upload');
  const goSettings = () => setOverlay('settings');
  const goAllAnalyses = () => setOverlay('analyses');
  const closeOverlay = () => setOverlay(null);

  // Base screen — what sits underneath any Modal sheet.
  let baseScreen;
  if (openAnalysis) {
    baseScreen = <AnalysisDetailScreen analysis={openAnalysis} onBack={() => setOpenAnalysis(null)}/>;
  } else if (tab === 'home') {
    baseScreen = (
      <HomeScreen
        analyses={analyses}
        pinned={pinned}
        onUnpin={togglePin}
        onOpenAnalysis={setOpenAnalysis}
        onGoUpload={goImport}
        onOpenSettings={goSettings}
        onSeeAllAnalyses={goAllAnalyses}
        onGoCharts={() => setTab('charts')}
        headerMode={headerMode}
        topInset={topInset}
      />
    );
  } else {
    baseScreen = <ChartsScreen analyses={analyses} pinned={pinned} onTogglePin={togglePin}/>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: HEMEA.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: topInset }}>
        {baseScreen}
      </div>

      {/* Tab bar — hidden during the analysis-detail drill-in only. */}
      {!openAnalysis && (
        <TabBar active={tab} onChange={setTab} onImport={goImport}/>
      )}

      {/* Modal sheets — render on top, self-contained */}
      {overlay === 'upload' && (
        <UploadScreen onImported={closeOverlay} onClose={closeOverlay}/>
      )}
      {overlay === 'settings' && (
        <SettingsScreen
          onClose={closeOverlay}
          onOpenProfile={() => setOverlay('profile')}
          onOpenSync={() => setOverlay('sync')}
        />
      )}
      {overlay === 'profile' && (
        <ProfileScreen onClose={() => setOverlay('settings')}/>
      )}
      {overlay === 'sync' && (
        <SyncScreen onClose={() => setOverlay('settings')}/>
      )}
      {overlay === 'analyses' && (
        <AnalysesListScreen
          analyses={analyses}
          onOpenAnalysis={(a) => { closeOverlay(); setOpenAnalysis(a); }}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
}

window.HemeaApp = HemeaApp;
