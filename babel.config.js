module.exports = (api) => {
  const babelEnv = api.env();
  const plugins = [];
  if (babelEnv !== 'development') {
    plugins.push(['transform-remove-console']);
  }
  plugins.push('react-native-reanimated/plugin');
  
  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
}; 