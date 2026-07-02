import { runSecurityTests } from './security.test.js';
import { runStaticSecurityScan } from './static-security-scan.js';
import { runCatalogRelevanceTests } from './catalogRelevance.test.js';
import { runAutoEstimateEligibilityTests } from './autoEstimateEligibility.test.js';
import { runSupplierFirstSelectionTests } from './supplierFirstSelection.test.js';
import { runMinimalLogicUxHotfixTests } from './minimalLogicUxHotfix.test.js';
import { runStage13RoleScoringValidationUxTests } from './stage13RoleScoringValidationUx.test.js';

await runSecurityTests();
runCatalogRelevanceTests();
runAutoEstimateEligibilityTests();
runSupplierFirstSelectionTests();
runMinimalLogicUxHotfixTests();
runStage13RoleScoringValidationUxTests();
const findings = runStaticSecurityScan({ failOnCritical: true });
console.log(`Security tests passed. Static scan warnings: ${findings.length}.`);
