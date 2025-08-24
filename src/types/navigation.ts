export type HomeStackParamList = {
  HomeScreen: undefined;
  AllAnalysesScreen: undefined;
  AnalysisDetails: { analysisId: string };
  SettingsScreen: undefined;
  HelpCenterScreen: undefined;
  PrivacySecurityScreen: undefined;
  PrivacyPolicyWebView: undefined;
  MistralApiKeyTutorial: undefined;
  AboutScreen: undefined;
  ApiKeySettingsScreen: undefined;
  DatabaseSettingsScreen: undefined;
  ProfileScreen: undefined;
  SyncScreen: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Upload: undefined;
  Charts: undefined;
};

export type ChartStackParamList = {
  ChartScreen: undefined;
};

export type UploadStackParamList = {
  UploadScreen: undefined;
  Settings: undefined;
};
