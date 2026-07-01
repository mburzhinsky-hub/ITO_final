import { runSecurityTests } from './security.test.js';
import { runStaticSecurityScan } from './static-security-scan.js';
import { runCatalogRelevanceTests } from './catalogRelevance.test.js';
import { runAutoEstimateEligibilityTests } from './autoEstimateEligibility.test.js';

await runSecurityTests();
runCatalogRelevanceTests();
runAutoEstimateEligibilityTests();
const findings = runStaticSecurityScan({ failOnCritical: true });
console.log(`Security tests passed. Static scan warnings: ${findings.length}.`);
