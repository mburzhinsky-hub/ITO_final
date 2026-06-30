export function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message);
}
export function equal(actual, expected, message = 'Values are not equal') {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}
export function approx(actual, expected, tolerance = 0.001, message = 'Values are not close') {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}
