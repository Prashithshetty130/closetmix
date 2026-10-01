import { runUnitTests } from "./phase7-unit-rules.test";
import { runSecurityTests } from "./phase7-security.test";
import { runThirtyImageTestSuite } from "./phase7-sample-30-images.test";

async function runAllPhase7Tests() {
  console.log("================================================================================");
  console.log("🚀 PHASE 7 COMPREHENSIVE AUTOMATED TEST RUNNER");
  console.log("================================================================================\n");

  const startTime = Date.now();

  try {
    const unitResult = await runUnitTests();
    const securityResult = await runSecurityTests();
    const thirtyResult = await runThirtyImageTestSuite();

    const elapsedMs = Date.now() - startTime;
    const totalPassed = unitResult.pass + securityResult.pass + thirtyResult.pass;
    const totalAssertions = unitResult.total + securityResult.total + thirtyResult.total;

    console.log("================================================================================");
    console.log("📊 PHASE 7 EXECUTION SUMMARY REPORT");
    console.log("================================================================================");
    console.log(`• Unit Tests (Fashion Rules & JSON Schema): ${unitResult.pass}/${unitResult.total} PASSED`);
    console.log(`• Security & Privacy Tests (IDOR, EXIF, Purge): ${securityResult.pass}/${securityResult.total} PASSED`);
    console.log(`• 30-Image Stress Test Suite: ${thirtyResult.pass}/${thirtyResult.total} PASSED (${thirtyResult.testedCount} garments tested)`);
    console.log(`\n✨ OVERALL RESULT: ${totalPassed}/${totalAssertions} PASSED (${(elapsedMs / 1000).toFixed(2)}s)`);
    console.log("================================================================================\n");
  } catch (error) {
    console.error("\n❌ PHASE 7 RUNNER HALTED DUE TO TEST FAILURE:", error);
    process.exit(1);
  }
}

runAllPhase7Tests().then(() => process.exit(0));
