import React from "react";
import { useUseCases } from "../../src/presentation/contexts/UseCasesContext";
import { AIImportScreen } from "../../src/presentation/screens/upload/AIImportScreen";

export default function AiImportTab() {
  const { bundle, apiKeyError, checkAndLoadApiKey } = useUseCases();

  return (
    <AIImportScreen
      analyzePdfUseCase={bundle?.analyzePdfUseCase ?? null}
      isLoadingApiKey={!bundle}
      apiKeyError={apiKeyError}
      checkAndLoadApiKey={checkAndLoadApiKey}
    />
  );
}
