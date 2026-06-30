import { runSecurityTests } from './security.test.js';
import { runStaticSecurityScan } from './static-security-scan.js';

await runSecurityTests();
const findings = runStaticSecurityScan({ failOnCritical: true });
console.log(`Security tests passed. Static scan warnings: ${findings.length}.`);
