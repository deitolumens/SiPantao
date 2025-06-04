// src/polyfills.js
import { Buffer } from 'buffer';
import * as url from 'url';

window.Buffer = Buffer;
window.url = url;

if (!window.process) {
  window.process = {
    env: {},
    versions: {},
    platform: '',
    nextTick: (callback) => setTimeout(callback, 0)
  };
}
