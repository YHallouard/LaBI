// Polyfills for React Native to support web APIs needed by AWS SDK and Mistral SDK
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { ReadableStream } from 'web-streams-polyfill';
import { Buffer as BufferPolyfill } from 'buffer';

// Apply ReadableStream polyfill
if (typeof global.ReadableStream === 'undefined') {
  console.log('Applying ReadableStream polyfill');
  global.ReadableStream = ReadableStream;
}

// Apply Buffer polyfill
if (typeof global.Buffer === 'undefined') {
  console.log('Applying Buffer polyfill');
  global.Buffer = BufferPolyfill;
}

console.log('Stream and Buffer polyfills applied successfully'); 