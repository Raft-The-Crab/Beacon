export default class OpusScript {
  constructor() {}
  encode() { return new Uint8Array(0); }
  decode() { return new Uint8Array(0); }
  delete() {}
  static get nativeMetadata() { return {}; }
}

// Add CJS compatibility just in case
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OpusScript;
}
