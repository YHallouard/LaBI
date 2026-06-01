import packageJson from "../../package.json";

export const APP_VERSION = packageJson.version;
export const APP_NAME = packageJson.name;

const expoPackageVersion = packageJson.dependencies.expo;
const reactNativePackageVersion = packageJson.dependencies["react-native"];

export const EXPO_SDK_LABEL = `Expo SDK ${expoPackageVersion.split(".")[0]}`;
export const REACT_NATIVE_LABEL = `React Native ${reactNativePackageVersion}`;
