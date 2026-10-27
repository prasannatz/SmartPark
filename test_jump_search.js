'use strict';

// ── Minimal slot factory ──────────────────────────────────────────────────
function createSlot(id) {
  return { id, status: 'free', plate: null, vehicleType: null, parkedAt: null, index: id - 1 };
}

// ── Copy of the fixed jumpSearch (extracted from app.js) ─────────────────
/** JUMP SEARCH — O(√n) — FIXED VERSION */
function jumpSearch(arr, targetId) {
  const log = [];
  if (arr.length === 0) {
    log.push('[Jump Search] Empty array — nothing to search.');
    return { found: false, index: -1, slot: null, comparisons: 0, steps: 0, log };
  }

  const sorted = [...arr].sort((a, b) => a.id - b.id);
  const n    = sorted.length;
  const step = Math.max(1, Math.floor(Math.sqrt(n)));
  let comparisons = 0;
  let steps       = 0;
  log.push(`[Jump Search] Target: Slot #${targetId}, n=${n}, block size=√${n}≈${step}`);

  let prev = 0;
  let curr = Math.min(step, n - 1);

  while (sorted[curr].id <= targetId) {
    comparisons++;
    steps++;
    log.push(`  Jump [${curr}] → Slot #${sorted[curr].id} ≤ ${targetId} ✓ advance`);
    prev = curr;
    const next = curr + step;
    if (next >= n) {
      curr = n;
      log.push(`  Next jump (${next}) ≥ n (${n}) — reached end of array, stop jumping`);
      break;
    }
    curr = next;
  }

  if (curr < n) {
    comparisons++;
    log.push(`  Jump stopped at [${curr}] → Slot #${sorted[curr].id} > ${targetId}. Linear scan [${prev}..${curr}]`);
  } else {
    log.push(`  Jump advanced past end. Linear scan [${prev}..${n - 1}]`);
  }

  const scanEnd = Math.min(curr, n - 1);
  for (let i = prev; i <= scanEnd; i++) {
    comparisons++;
    steps++;
    log.push(`  Linear [${i}] → Slot #${sorted[i].id} == ${targetId}?`);
    if (sorted[i].id === targetId) {
      const origIdx = arr.findIndex(s => s.id === targetId);
      log.push(`  ✅ FOUND at sorted[${i}] → original index [${origIdx}] after ${comparisons} comparison(s)`);
      return { found: true, index: origIdx, slot: arr[origIdx], comparisons, steps, log };
    }
  }
  log.push(`  ❌ NOT FOUND after ${comparisons} comparison(s), ${steps} step(s)`);
  return { found: false, index: -1, slot: null, comparisons, steps, log };
}

// ── Test harness ─────────────────────────────────────────────────────────
// 20 slots, IDs 1..20, stored in shuffled order to verify origIdx mapping
const slots = Array.from({ length: 20 }, (_, i) => createSlot(i + 1));
// Shuffle the original array to make the original-index test realistic
slots.sort(() => Math.random() - 0.5);

let passed = 0, failed = 0;

function test(label, targetId, expectFound, expectId) {
  const r = jumpSearch(slots, targetId);
  const ok = r.found === expectFound && (!expectFound || r.slot.id === expectId);
  const tag = ok ? '✅ PASS' : '❌ FAIL';
  if (ok) passed++; else failed++;

  console.log(`\n${tag}  ${label}`);
  console.log(`       target=${targetId}  found=${r.found}  ` +
              (r.found ? `slot=#${r.slot.id}  origIdx=${r.index}` : 'not found') +
              `  comps=${r.comparisons}  steps=${r.steps}`);

  if (!ok) {
    console.log('       EXPECTED: found=' + expectFound + (expectFound ? ' id=' + expectId : ''));
    // Print full trace on failure
    r.log.forEach(l => console.log('         ' + l));
  } else {
    // Show last 2 trace lines as proof
    r.log.slice(-2).forEach(l => console.log('       ' + l));
  }
}

// Extra: empty array
const emptyR = jumpSearch([], 5);
const emptyOk = !emptyR.found && emptyR.comparisons === 0;
console.log('\n' + (emptyOk ? '✅ PASS' : '❌ FAIL') + '  Empty array guard');
if (emptyOk) passed++; else failed++;

// Test 1 — first slot
test('Test 1 — First slot  (ID 1)', 1, true, 1);

// Test 2 — middle slot
test('Test 2 — Middle slot (ID 10)', 10, true, 10);

// Test 3 — last slot  ← was infinite loop in original code
test('Test 3 — Last slot   (ID 20)', 20, true, 20);

// Test 4 — beyond last  ← was infinite loop in original code
test('Test 4 — Beyond last (ID 21)', 21, false, null);

// Test 5 — absent ID that sits between two present IDs
// Remove slot #15 from a fresh array and search for it
const slotsWithGap = Array.from({ length: 20 }, (_, i) => createSlot(i + 1))
                          .filter(s => s.id !== 15);  // ID 15 absent
const r5 = jumpSearch(slotsWithGap, 15);
const ok5 = !r5.found;
console.log('\n' + (ok5 ? '✅ PASS' : '❌ FAIL') + '  Test 5 — Non-existent ID (15 absent from array)');
console.log(`       found=${r5.found}  comps=${r5.comparisons}  steps=${r5.steps}`);
r5.log.slice(-2).forEach(l => console.log('       ' + l));
if (ok5) passed++; else failed++;

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) console.log('All tests passed ✅');
