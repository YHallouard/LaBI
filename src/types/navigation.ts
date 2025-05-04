export type HomeStackParamList = {
  HomeScreen: undefined;
  AnalysisDetails: { analysisId: string };
  SettingsScreen: undefined;
  HelpCenterScreen: undefined;
  PrivacySecurityScreen: undefined;
  AboutScreen: undefined;
};

export type ChartStackParamList = {
  ChartScreen: undefined;
};

export type UploadStackParamList = {
  UploadScreen: undefined;
  Settings: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Upload: undefined;
  Charts: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  UploadPdf: undefined;
  AnalysisDetails: { analysisId: string };
};
