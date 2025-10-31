/**
 * Polyfills for Node.js modules in the browser
 * This file should be imported at the very beginning of the app
 */

import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer and process available globally
window.Buffer = Buffer;
window.process = process;
window.global = window;

// Ensure process.env exists
if (!window.process.env) {
  window.process.env = {};
}

export { Buffer, process };

