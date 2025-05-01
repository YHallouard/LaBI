// Polyfill for crypto.getRandomValues() which is needed by UUID
import 'react-native-get-random-values';

// This import auto-patches the global.crypto object with getRandomValues
console.log('Crypto polyfill applied for UUID generation'); 