export const Readable = class {
  static from() { return new Readable(); }
  on() { return this; }
  once() { return this; }
  emit() { return true; }
  removeListener() { return this; }
  off() { return this; }
};

export default { Readable };
