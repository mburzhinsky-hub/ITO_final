const tests = [
  './pricing.test.js',
  './currency.test.js',
  './estimate.test.js',
  './budget.test.js',
  './validation.test.js',
  './avValidation.test.js',
  './proposalBuilder.test.js',
  './storage.test.js',
  './export.test.js',
  './catalogValidation.test.js'
];

let passed = 0;
let failed = 0;
for (const file of tests) {
  try {
    const mod = await import(file);
    await mod.run();
    console.log(`PASS ${file}`);
    passed += 1;
  } catch (error) {
    console.error(`FAIL ${file}`);
    console.error(error?.stack || error);
    failed += 1;
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
