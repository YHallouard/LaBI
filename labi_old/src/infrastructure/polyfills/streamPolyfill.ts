import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { ReadableStream } from "web-streams-polyfill";
import { Buffer as BufferPolyfill } from "buffer";

if (typeof global.ReadableStream === "undefined") {
  console.log("Applying ReadableStream polyfill");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  global.ReadableStream = ReadableStream as any;
}

if (typeof global.Buffer === "undefined") {
  console.log("Applying Buffer polyfill");
  global.Buffer = BufferPolyfill;
}

console.log("Stream and Buffer polyfills applied successfully");
