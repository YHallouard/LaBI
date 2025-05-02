const fs = require('fs');
const path = require('path');

// Read the App.tsx file
const appFilePath = path.join(__dirname, 'App.tsx');
let appContent = fs.readFileSync(appFilePath, 'utf8');

// 1. Update the import to include GetLabTestDataUseCase
appContent = appContent.replace(
  "import { GetAnalysesUseCase, GetAnalysisByIdUseCase } from './src/application/usecases/GetAnalysesUseCase';",
  "import { GetAnalysesUseCase, GetAnalysisByIdUseCase, GetLabTestDataUseCase } from './src/application/usecases/GetAnalysesUseCase';"
);

// 2. Add state for GetLabTestDataUseCase
appContent = appContent.replace(
  "const [loadApiKeyUseCase, setLoadApiKeyUseCase] = useState<LoadApiKeyUseCase | null>(null);",
  "const [loadApiKeyUseCase, setLoadApiKeyUseCase] = useState<LoadApiKeyUseCase | null>(null);\n  const [getLabTestDataUseCase, setGetLabTestDataUseCase] = useState<GetLabTestDataUseCase | null>(null);"
);

// 3. Initialize the use case
appContent = appContent.replace(
  "const newDeleteAnalysisUseCase = new DeleteAnalysisUseCase(repository);",
  "const newDeleteAnalysisUseCase = new DeleteAnalysisUseCase(repository);\n        const newGetLabTestDataUseCase = new GetLabTestDataUseCase();"
);

// 4. Set the use case in state
appContent = appContent.replace(
  "setDeleteAnalysisUseCase(newDeleteAnalysisUseCase);",
  "setDeleteAnalysisUseCase(newDeleteAnalysisUseCase);\n        setGetLabTestDataUseCase(newGetLabTestDataUseCase);"
);

// 5. Pass the use case to ChartScreen
appContent = appContent.replace(
  "<ChartScreen {...props} getAnalysesUseCase={getAnalysesUseCase} />",
  "<ChartScreen {...props} getAnalysesUseCase={getAnalysesUseCase} getLabTestDataUseCase={getLabTestDataUseCase} />"
);

// Write the updated content back to the file
fs.writeFileSync(appFilePath, appContent);

console.log('App.tsx has been updated to include GetLabTestDataUseCase'); 