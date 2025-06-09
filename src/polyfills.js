// src/polyfills.js
import { Buffer } from 'buffer';
import * as url from 'url';

window.Buffer = Buffer;
window.url = url;

// Add WebSocket polyfill for React
if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}

// Buffer polyfill
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

if (!window.process) {
  window.process = {
    env: {},
    versions: {},
    platform: '',
    nextTick: (callback) => setTimeout(callback, 0)
  };
}
