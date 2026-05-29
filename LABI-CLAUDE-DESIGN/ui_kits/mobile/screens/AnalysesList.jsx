// All analyses list — surfaced via Modal when tapping "Mes analyses" on Home.

function AnalysesListScreen({ analyses, onOpenAnalysis, onClose }) {
  return (
    <Modal open={true} title="Mes analyses" subtitle={`${analyses.length} bilans · plus récents en premier`} onClose={onClose}>
      <div style={{ padding: '16px 16px 30px' }}>
        {analyses.map((a) => (
          <AnalysisCard
            key={a.id}
            label="CRP"
            date={a.date}
            value={a.crp.toFixed(2)}
            unit="mg/L"
            alert={a.alert}
            onClick={() => onOpenAnalysis(a)}
          />
        ))}
      </div>
    </Modal>
  );
}

window.AnalysesListScreen = AnalysesListScreen;
