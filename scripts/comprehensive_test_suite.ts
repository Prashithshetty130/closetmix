import 'dotenv/config';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];
const BASE_URL = 'http://localhost:3000';

let sessionCookie = '';

async function api(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Extract vestiq_session cookie
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/vestiq_session=[^;]+/);
    if (match) {
      sessionCookie = match[0];
    }
  }
  // Also check getSetCookie if available
  if (!sessionCookie && typeof (res.headers as any).getSetCookie === 'function') {
    const cookiesList = (res.headers as any).getSetCookie();
    for (const c of cookiesList) {
      const match = c.match(/vestiq_session=[^;]+/);
      if (match) {
        sessionCookie = match[0];
        break;
      }
    }
  }

  let body: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json().catch(() => null);
  } else {
    body = await res.text().catch(() => null);
  }

  return { status: res.status, ok: res.ok, body, headers: res.headers };
}

async function runTest(suite: string, name: string, fn: () => Promise<void>) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ suite, name, passed: true, durationMs: Date.now() - t0 });
    console.log(`  ✓ [${suite}] ${name} (${Date.now() - t0}ms)`);
  } catch (err: any) {
    results.push({ suite, name, passed: false, durationMs: Date.now() - t0, error: err.message || String(err) });
    console.error(`  ✗ [${suite}] ${name} (${Date.now() - t0}ms):`, err.message || err);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('   VESTIQ SUITE: COMPREHENSIVE END-TO-END AUDIT       ');
  console.log('======================================================\n');

  // 1. Health & Core
  await runTest('System', 'Health Check API', async () => {
    const res = await api('/api/health');
    if (res.status !== 200 || !res.body?.status) {
      throw new Error(`Health check returned ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 2. Auth Flow (Guest Session)
  await runTest('Auth', 'Create Guest Session', async () => {
    const res = await api('/api/auth/guest', { method: 'POST' });
    if (res.status !== 200 || !res.body?.user?.id) {
      throw new Error(`Guest session creation failed: ${JSON.stringify(res.body)}`);
    }
    if (!sessionCookie) {
      throw new Error('No session cookie returned from guest endpoint');
    }
  });

  await runTest('Auth', 'Verify Current Session (/api/auth/me)', async () => {
    const res = await api('/api/auth/me');
    if (res.status !== 200 || !res.body?.authenticated || !res.body?.user?.id) {
      throw new Error(`Session verify failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 3. User Preferences & Gender Styling Toggle
  await runTest('Preferences', 'Get User Preferences', async () => {
    const res = await api('/api/user/preferences');
    if (res.status !== 200 || !res.body?.success) {
      throw new Error(`Preferences GET failed: ${JSON.stringify(res.body)}`);
    }
  });

  await runTest('Preferences', 'Set Gender Preference to Female (Womenswear)', async () => {
    const res = await api('/api/user/preferences', {
      method: 'POST',
      body: JSON.stringify({ gender: 'female' }),
    });
    if (res.status !== 200 || res.body?.preferences?.gender !== 'female') {
      throw new Error(`Preferences set female failed: ${JSON.stringify(res.body)}`);
    }
  });

  await runTest('Preferences', 'Set Gender Preference to Male (Menswear)', async () => {
    const res = await api('/api/user/preferences', {
      method: 'POST',
      body: JSON.stringify({ gender: 'male' }),
    });
    if (res.status !== 200 || res.body?.preferences?.gender !== 'male') {
      throw new Error(`Preferences set male failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 4. AI Key Management
  await runTest('AI Key', 'Check Configured AI Key', async () => {
    const res = await api('/api/user/ai-key');
    if (res.status !== 200 || !res.body?.success) {
      throw new Error(`AI Key check failed: ${JSON.stringify(res.body)}`);
    }
    if (!res.body.hasKey) {
      throw new Error('No AI key detected (OpenRouter or Gemini key expected in environment)');
    }
  });

  // 5. Weather API
  await runTest('Weather', 'Fetch Live Weather & Styling Notes', async () => {
    const res = await api('/api/weather?city=Tokyo');
    if (res.status !== 200 || !res.body?.success || !res.body?.weather?.condition) {
      throw new Error(`Weather API failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 6. Wardrobe CRUD
  let createdItemIds: string[] = [];

  await runTest('Wardrobe', 'Fetch Wardrobe Items', async () => {
    const res = await api('/api/wardrobe/items');
    if (res.status !== 200 || !res.body?.success || !Array.isArray(res.body?.items)) {
      throw new Error(`Wardrobe fetch failed: ${JSON.stringify(res.body)}`);
    }
  });

  await runTest('Wardrobe', 'Create a Test Item (White Oxford Shirt)', async () => {
    const res = await api('/api/wardrobe/items', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Crisp White Oxford Shirt',
        category: 'TOP',
        subcategory: 'Button-Down Shirt',
        primaryColor: 'White',
        primaryColorHex: '#ffffff',
        pattern: 'Solid',
        material: 'Cotton',
        fit: 'Regular',
        season: 'All-Season',
        formality: 'Smart Casual',
        originalImageUrl: '/uploads/sample/shirt.webp',
        processedImageUrl: '/uploads/sample/shirt_cutout.png',
        thumbnailUrl: '/uploads/sample/shirt_thumb.webp',
      }),
    });
    const id = res.body?.items?.[0]?.id || res.body?.item?.id;
    if (res.status !== 200 || !id) {
      throw new Error(`Item creation failed: ${JSON.stringify(res.body)}`);
    }
    createdItemIds.push(id);
  });

  await runTest('Wardrobe', 'Create Bottom & Shoes for Complete Capsule', async () => {
    // Bottom
    const bottomRes = await api('/api/wardrobe/items', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Navy Slim Chinos',
        category: 'BOTTOM',
        subcategory: 'Chino Pants',
        primaryColor: 'Navy',
        primaryColorHex: '#1e293b',
        pattern: 'Solid',
        material: 'Cotton Twill',
        fit: 'Slim',
        season: 'All-Season',
        formality: 'Smart Casual',
        originalImageUrl: '/uploads/sample/chinos.webp',
        processedImageUrl: '/uploads/sample/chinos_cutout.png',
        thumbnailUrl: '/uploads/sample/chinos_thumb.webp',
      }),
    });
    const bId = bottomRes.body?.items?.[0]?.id || bottomRes.body?.item?.id;
    if (bId) createdItemIds.push(bId);

    // Shoes
    const shoeRes = await api('/api/wardrobe/items', {
      method: 'POST',
      body: JSON.stringify({
        name: 'White Leather Minimalist Sneakers',
        category: 'SHOES',
        subcategory: 'Sneakers',
        primaryColor: 'White',
        primaryColorHex: '#ffffff',
        pattern: 'Solid',
        material: 'Leather',
        fit: 'Regular',
        season: 'All-Season',
        formality: 'Smart Casual',
        originalImageUrl: '/uploads/sample/sneakers.webp',
        processedImageUrl: '/uploads/sample/sneakers_cutout.png',
        thumbnailUrl: '/uploads/sample/sneakers_thumb.webp',
      }),
    });
    const sId = shoeRes.body?.items?.[0]?.id || shoeRes.body?.item?.id;
    if (sId) createdItemIds.push(sId);
  });

  await runTest('Wardrobe', 'Fetch Single Item by ID', async () => {
    if (createdItemIds.length === 0) throw new Error('No item to fetch');
    const firstId = createdItemIds[0];
    const res = await api(`/api/wardrobe/items/${firstId}`);
    if (res.status !== 200 || res.body?.item?.id !== firstId) {
      throw new Error(`Single item fetch failed: ${JSON.stringify(res.body)}`);
    }
  });

  await runTest('Wardrobe', 'Update Item (Patch wear count & favorite)', async () => {
    if (createdItemIds.length === 0) throw new Error('No item to update');
    const firstId = createdItemIds[0];
    const res = await api(`/api/wardrobe/items/${firstId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        isFavorite: true,
        wearCount: 3,
        notes: 'Premium pima cotton test shirt',
      }),
    });
    if (res.status !== 200 || !res.body?.item?.isFavorite || res.body?.item?.wearCount !== 3) {
      throw new Error(`Item update failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 7. Outfit Generation & AI Stylist
  let generatedOutfitId = '';
  let generatedOutfitObj: any = null;

  await runTest('Outfits', 'Generate Outfits with Menswear Aesthetic', async () => {
    const res = await api('/api/outfits/generate', {
      method: 'POST',
      body: JSON.stringify({
        occasion: 'Smart Casual',
        mood: 'Minimalist Clean',
        gender: 'male',
        city: 'London',
      }),
    });
    if (res.status !== 200 || !res.body?.success || !Array.isArray(res.body?.outfits) || res.body.outfits.length === 0) {
      throw new Error(`Outfit generation failed: ${JSON.stringify(res.body)}`);
    }

    generatedOutfitObj = res.body.outfits[0];
    // Verify no "Effortless Layered Composition" when no outerwear is in outfit
    for (const o of res.body.outfits) {
      const hasOuterwear = o.items.some((i: any) => i.slot === 'OUTERWEAR');
      if (!hasOuterwear && o.name.toLowerCase().includes('layered')) {
        throw new Error(`Outfit "${o.name}" mentions layered without outerwear!`);
      }
    }
  });

  await runTest('Outfits', 'Generate Outfits with Womenswear Aesthetic', async () => {
    const res = await api('/api/outfits/generate', {
      method: 'POST',
      body: JSON.stringify({
        occasion: 'Date Night',
        mood: 'Parisian Chic',
        gender: 'female',
        city: 'Paris',
      }),
    });
    if (res.status !== 200 || !res.body?.success || !Array.isArray(res.body?.outfits) || res.body.outfits.length === 0) {
      throw new Error(`Womenswear outfit generation failed: ${JSON.stringify(res.body)}`);
    }
  });

  await runTest('Outfits', 'Save Generated Outfit', async () => {
    if (!generatedOutfitObj) throw new Error('No generated outfit to save');
    const slotMap: Record<string, string> = {};
    generatedOutfitObj.items.forEach((s: any) => {
      slotMap[s.item.id] = s.slot;
    });

    const res = await api('/api/outfits', {
      method: 'POST',
      body: JSON.stringify({
        name: generatedOutfitObj.name,
        occasion: generatedOutfitObj.occasion,
        weatherSuitability: generatedOutfitObj.weatherSuitability,
        confidenceScore: generatedOutfitObj.confidenceScore,
        stylingExplanation: generatedOutfitObj.stylingExplanation,
        itemIds: generatedOutfitObj.items.map((s: any) => s.item.id),
        slotMapping: slotMap,
      }),
    });

    if (res.status !== 200 || !res.body?.outfit?.id) {
      throw new Error(`Save outfit failed: ${JSON.stringify(res.body)}`);
    }
    generatedOutfitId = res.body.outfit.id;
  });

  await runTest('Outfits', 'Fetch Saved Outfits', async () => {
    const res = await api('/api/outfits');
    if (res.status !== 200 || !res.body?.success || !Array.isArray(res.body?.outfits)) {
      throw new Error(`Fetch saved outfits failed: ${JSON.stringify(res.body)}`);
    }
  });

  await runTest('Outfits', 'Submit Stylist Feedback (Rating)', async () => {
    if (!generatedOutfitId) throw new Error('No outfit for feedback');
    const res = await api('/api/outfits/feedback', {
      method: 'POST',
      body: JSON.stringify({
        outfitId: generatedOutfitId,
        liked: true,
      }),
    });
    if (res.status !== 200 || !res.body?.success) {
      throw new Error(`Outfit feedback failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 8. Planner / Calendar Entries
  let calendarEntryId = '';

  await runTest('Planner', 'Schedule Outfit on Calendar', async () => {
    if (!generatedOutfitId) throw new Error('No outfit to schedule');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await api('/api/planner', {
      method: 'POST',
      body: JSON.stringify({
        date: tomorrow.toISOString().split('T')[0],
        outfitId: generatedOutfitId,
        occasion: 'Office Meeting',
        notes: 'Important client sync',
      }),
    });
    if (res.status !== 200 || !res.body?.entry?.id) {
      throw new Error(`Schedule outfit failed: ${JSON.stringify(res.body)}`);
    }
    calendarEntryId = res.body.entry.id;
  });

  await runTest('Planner', 'Fetch Calendar Entries', async () => {
    const res = await api('/api/planner');
    if (res.status !== 200 || !res.body?.success || !Array.isArray(res.body?.entries)) {
      throw new Error(`Planner fetch failed: ${JSON.stringify(res.body)}`);
    }
  });

  await runTest('Planner', 'Delete Scheduled Calendar Entry', async () => {
    if (!calendarEntryId) throw new Error('No entry to delete');
    const res = await api(`/api/planner/${calendarEntryId}`, { method: 'DELETE' });
    if (res.status !== 200 || !res.body?.success) {
      throw new Error(`Planner delete failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 9. Analytics & Wardrobe Insights
  await runTest('Insights', 'Fetch Wardrobe Analytics & CPW Metrics', async () => {
    const res = await api('/api/insights');
    if (res.status !== 200 || !res.body?.success || typeof res.body.totalGarments !== 'number') {
      throw new Error(`Insights API failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 10. Clean up test outfit and item
  await runTest('Cleanup', 'Delete Test Saved Outfit', async () => {
    if (!generatedOutfitId) return;
    const res = await api(`/api/outfits/${generatedOutfitId}`, { method: 'DELETE' });
    if (res.status !== 200 || !res.body?.success) {
      throw new Error(`Delete outfit failed: ${JSON.stringify(res.body)}`);
    }
  });

  await runTest('Wardrobe', 'Delete Test Garment Items', async () => {
    for (const itemId of createdItemIds) {
      const res = await api(`/api/wardrobe/items/${itemId}`, { method: 'DELETE' });
      if (res.status !== 200 || !res.body?.success) {
        throw new Error(`Delete item ${itemId} failed: ${JSON.stringify(res.body)}`);
      }
    }
  });

  // 11. UI Page Rendering HTTP Status Checks
  const pages = [
    '/',
    '/wardrobe',
    '/wardrobe/upload',
    '/outfits',
    '/planner',
    '/insights',
    '/settings',
    '/privacy',
  ];

  for (const page of pages) {
    await runTest('UI Pages', `Render ${page}`, async () => {
      const res = await api(page, { headers: { Accept: 'text/html' } });
      if (res.status !== 200) {
        throw new Error(`Page ${page} returned status ${res.status}`);
      }
    });
  }

  // Summary
  console.log('\n======================================================');
  console.log('                  AUDIT SUMMARY                       ');
  console.log('======================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed:      ${passed}`);
  console.log(`Failed:      ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    for (const f of results.filter((r) => !r.passed)) {
      console.log(`  - [${f.suite}] ${f.name}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\nALL 20+ FEATURE AUDIT SUITES PASSED FLAWLESSLY! 🚀\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
