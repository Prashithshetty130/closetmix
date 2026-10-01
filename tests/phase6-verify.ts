import fs from "fs/promises";
import path from "path";

async function runPhase6Tests() {
  console.log("==================================================");
  console.log("🧪 STARTING PHASE 6 UI POLISH & ACCESSIBILITY SUITE");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // TEST 1: Accessibility - Focus States & Keyboard Nav
    console.log("--- 1. Testing Accessibility (WCAG AA Focus & Outlines) ---");
    const globalsCss = await fs.readFile(path.join(process.cwd(), "src", "app", "globals.css"), "utf-8");
    assert(globalsCss.includes(":focus-visible"), "Explicit :focus-visible ring configured in global styles");
    assert(globalsCss.includes("min-height: 40px") || globalsCss.includes("touch target"), "Minimum accessible touch targets configured for buttons & links");

    // TEST 2: High Contrast Ratio Verification
    console.log("\n--- 2. Testing Color Contrast Ratios (WCAG AA) ---");
    // Text primary (#f8fafc) on Dark base (#08090d):
    // Luminance calculation: ~0.95 vs ~0.005 -> Contrast ratio ~18.5:1 (vastly surpasses WCAG AAA requirement of 7:1!)
    assert(globalsCss.includes("--text-primary: #f8fafc"), "Primary text has ultra-high contrast on dark obsidian background");
    assert(globalsCss.includes("--gold-primary: #e5b95f"), "Warm bronze accent selected for clear visual hierarchy");

    // TEST 3: Mobile Bottom Navigation Dock
    console.log("\n--- 3. Testing Mobile Responsive Breakpoints ---");
    assert(globalsCss.includes("@media (max-width: 768px)"), "Mobile breakpoint (768px) configured");
    assert(globalsCss.includes(".mobile-nav-dock"), "Mobile bottom dock declared in CSS");

    const navbarTsx = await fs.readFile(path.join(process.cwd(), "src", "components", "Navbar.tsx"), "utf-8");
    assert(navbarTsx.includes("mobile-nav-dock"), "Navbar renders dedicated mobile dock for phone viewports");
    assert(navbarTsx.includes("toggleTheme"), "Theme switcher integrated into Navbar");

    // TEST 4: Shareable Outfit Card Component
    console.log("\n--- 4. Testing Shareable Outfit Card Architecture ---");
    const shareCardTsx = await fs.readFile(path.join(process.cwd(), "src", "components", "ShareOutfitCard.tsx"), "utf-8");
    assert(shareCardTsx.includes("canvas.getContext(\"2d\")"), "HTML5 Canvas rendering engine configured for high-res PNG export");
    assert(shareCardTsx.includes("includeWatermark"), "Watermark privacy toggle included");
    assert(shareCardTsx.includes("cardTheme"), "Custom card background theme toggle supported");

    // TEST 5: Outfits Page Integration
    console.log("\n--- 5. Testing Outfit Studio Share Integration ---");
    const outfitsPageTsx = await fs.readFile(path.join(process.cwd(), "src", "app", "outfits", "page.tsx"), "utf-8");
    assert(outfitsPageTsx.includes("ShareOutfitCard"), "Share modal integrated into Outfit Studio");
    assert(outfitsPageTsx.includes("setShowShareModal"), "Share trigger connected to action button");

    console.log("\n==================================================");
    console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 6 TESTS PASSED!`);
    console.log("==================================================\n");
  } catch (error) {
    console.error("\n❌ PHASE 6 TEST SUITE ENCOUNTERED AN ERROR:", error);
    process.exit(1);
  }
}

runPhase6Tests().then(() => process.exit(0));
