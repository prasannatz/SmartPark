/* ═══════════════════════════════════════════════════════════
   SmartPark — Intelligent Parking Slot Manager
   app.js  |  Complete Application Logic
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────
   1. DATA MODEL — Linear Array of Slot Objects
   ─────────────────────────────────────────────────────────
   slots[] is the primary data structure:
   a standard JavaScript array (linear list) where each
   element is a slot object. Index === physical position.
   ───────────────────────────────────────────────────────── */
const STATUSES = { FREE: 'free', OCCUPIED: 'occupied', RESERVED: 'reserved' };

const VEHICLE_ICONS = {
  '🚗': 'Car',
  '🏍️': 'Bike',
  '🚐': 'Van',
  '🚛': 'Truck',
  '🅿': 'Empty',
};

/**
 * Creates a fresh slot object.
 * @param {number} id - Slot number (1-indexed)
 * @returns {Object} Slot object
 */
function createSlot(id) {
  return {
    id,          // unique identifier
    status: STATUSES.FREE,
    plate: null,
    vehicleType: null,
    parkedAt: null,
    index: id - 1,  // 0-indexed position in array
  };
}

/* ─────────────────────────────────────────────────────────
   2. APPLICATION STATE
   ───────────────────────────────────────────────────────── */
const State = {
  slots: [],          // <-- PRIMARY LINEAR DATA STRUCTURE
  totalSlots: 20,
  history: [],        // operation log
  highlightedSlots: new Set(),
  benchmarkData: null,
  historyCounter: 0,
};

/* ─────────────────────────────────────────────────────────
   3. INIT — Build the linear array
   ───────────────────────────────────────────────────────── */
function initSlots(n = 20) {
  State.totalSlots = n;
  State.slots = Array.from({ length: n }, (_, i) => createSlot(i + 1));
  State.highlightedSlots.clear();
}

/* ─────────────────────────────────────────────────────────
   4. SEARCH ALGORITHMS
   Each returns: { found, index, comparisons, steps, log[] }
   ───────────────────────────────────────────────────────── */

/** LINEAR SEARCH — O(n)
 *  Sequentially checks every element from left to right.
 */
function linearSearch(arr, targetId) {
  const log = [];
  let comparisons = 0;
  log.push(`[Linear Search] Target: Slot #${targetId}, Array size: ${arr.length}`);

  for (let i = 0; i < arr.length; i++) {
    comparisons++;
    log.push(`  Step ${comparisons}: Checking index [${i}] → Slot #${arr[i].id} — compare ${arr[i].id} == ${targetId}?`);
    if (arr[i].id === targetId) {
      log.push(`  ✅ FOUND at index [${i}] after ${comparisons} comparison(s)`);
      return { found: true, index: i, slot: arr[i], comparisons, steps: comparisons, log };
    }
    log.push(`  ✗ No match at [${i}]`);
  }
  log.push(`  ❌ NOT FOUND after ${comparisons} comparison(s)`);
  return { found: false, index: -1, slot: null, comparisons, steps: comparisons, log };
}

/** BINARY SEARCH — O(log n)
 *  Requires sorted array. Halves search space each step.
 */
function binarySearch(arr, targetId) {
  const sorted = [...arr].sort((a, b) => a.id - b.id);
  const log = [];
  let comparisons = 0;
  let steps = 0;
  log.push(`[Binary Search] Target: Slot #${targetId}, Array size: ${sorted.length} (sorted by ID)`);

  let low = 0, high = sorted.length - 1;
  while (low <= high) {
    steps++;
    const mid = Math.floor((low + high) / 2);
    comparisons += 2;
    log.push(`  Step ${steps}: low=${low}, high=${high}, mid=${mid} → Slot #${sorted[mid].id}`);
    if (sorted[mid].id === targetId) {
      log.push(`  ✅ FOUND at sorted index [${mid}] (original index: ${sorted[mid].index}) after ${comparisons} comparison(s)`);
      // Find original index
      const origIdx = arr.findIndex(s => s.id === targetId);
      return { found: true, index: origIdx, slot: arr[origIdx], comparisons, steps, log };
    } else if (sorted[mid].id < targetId) {
      log.push(`  ${sorted[mid].id} < ${targetId} → search RIGHT half`);
      low = mid + 1;
    } else {
      log.push(`  ${sorted[mid].id} > ${targetId} → search LEFT half`);
      high = mid - 1;
    }
  }
  log.push(`  ❌ NOT FOUND after ${steps} step(s), ${comparisons} comparison(s)`);
  return { found: false, index: -1, slot: null, comparisons, steps, log };
}

/** JUMP SEARCH — O(√n)
 *  Jumps in blocks of √n, then linear scans backward.
 *
 *  Fixes applied:
 *  1. Empty-array guard: avoids sorted[0] crash when arr is empty.
 *  2. Initial curr clamped to (n-1) so a single-element array works.
 *  3. Jump phase: instead of clamping next to (n-1) — which caused an
 *     infinite loop when sorted[n-1].id <= targetId — we now set curr = n
 *     and break immediately when the next jump would go out of bounds.
 *     This correctly handles: target == last slot, target > last slot.
 *  4. Post-loop log guarded: sorted[curr] is only accessed when curr < n.
 *  5. Original-index lookup: arr.findIndex by .id is preserved (correct
 *     even after the array was re-sorted internally).
 */
function jumpSearch(arr, targetId) {
  const log = [];
  // ── Guard: empty array ──────────────────────────────────────────────
  if (arr.length === 0) {
    log.push('[Jump Search] Empty array — nothing to search.');
    return { found: false, index: -1, slot: null, comparisons: 0, steps: 0, log };
  }

  const sorted = [...arr].sort((a, b) => a.id - b.id);
  const n    = sorted.length;
  const step = Math.max(1, Math.floor(Math.sqrt(n)));   // step >= 1 always
  let comparisons = 0;
  let steps       = 0;
  log.push(`[Jump Search] Target: Slot #${targetId}, n=${n}, block size=√${n}≈${step}`);

  // ── Jump phase ───────────────────────────────────────────────────────
  // curr is the right edge of the current block being inspected.
  // We advance curr by step until sorted[curr].id > targetId or we
  // would step past the end of the array.
  let prev = 0;
  let curr = Math.min(step, n - 1);   // start at first block boundary, clamped

  while (sorted[curr].id <= targetId) {
    comparisons++;
    steps++;
    log.push(`  Jump [${curr}] → Slot #${sorted[curr].id} ≤ ${targetId} ✓ advance`);
    prev = curr;
    const next = curr + step;
    if (next >= n) {
      // Next jump would leave the array — mark curr as "past end" and stop.
      curr = n;
      log.push(`  Next jump (${next}) ≥ n (${n}) — reached end of array, stop jumping`);
      break;
    }
    curr = next;
  }

  // ── Post-jump log (safe: only access sorted[curr] when in bounds) ───
  if (curr < n) {
    comparisons++;   // the comparison that stopped the loop
    log.push(`  Jump stopped at [${curr}] → Slot #${sorted[curr].id} > ${targetId}. Linear scan [${prev}..${curr}]`);
  } else {
    log.push(`  Jump advanced past end. Linear scan [${prev}..${n - 1}]`);
  }

  // ── Linear scan backward through the last block ──────────────────────
  const scanEnd = Math.min(curr, n - 1);
  for (let i = prev; i <= scanEnd; i++) {
    comparisons++;
    steps++;
    log.push(`  Linear [${i}] → Slot #${sorted[i].id} == ${targetId}?`);
    if (sorted[i].id === targetId) {
      // Map back to original (unsorted) array index by slot ID
      const origIdx = arr.findIndex(s => s.id === targetId);
      log.push(`  ✅ FOUND at sorted[${i}] → original index [${origIdx}] after ${comparisons} comparison(s)`);
      return { found: true, index: origIdx, slot: arr[origIdx], comparisons, steps, log };
    }
  }
  log.push(`  ❌ NOT FOUND after ${comparisons} comparison(s), ${steps} step(s)`);
  return { found: false, index: -1, slot: null, comparisons, steps, log };
}

/** SEARCH FOR FIRST FREE SLOT — Linear search variant */
function searchFirstFree(arr) {
  const log = [];
  let comparisons = 0;
  log.push(`[Linear Search — First Free] Scanning ${arr.length} slots for first available…`);
  for (let i = 0; i < arr.length; i++) {
    comparisons++;
    log.push(`  [${i}] Slot #${arr[i].id} → ${arr[i].status}`);
    if (arr[i].status === STATUSES.FREE) {
      log.push(`  ✅ First free slot found at index [${i}]`);
      return { found: true, index: i, slot: arr[i], comparisons, steps: comparisons, log };
    }
  }
  log.push(`  ❌ No free slots available`);
  return { found: false, index: -1, slot: null, comparisons, steps: comparisons, log };
}

/** SEARCH BY VEHICLE PLATE — Linear search */
function searchByPlate(arr, plate) {
  const log = [];
  let comparisons = 0;
  const target = plate.trim().toUpperCase();
  log.push(`[Linear Search — Plate] Searching for "${target}" in ${arr.length} slots`);
  for (let i = 0; i < arr.length; i++) {
    comparisons++;
    const slotPlate = (arr[i].plate || '').toUpperCase();
    log.push(`  [${i}] Slot #${arr[i].id} → plate: "${slotPlate}" compare == "${target}"?`);
    if (slotPlate === target) {
      log.push(`  ✅ FOUND at index [${i}]`);
      return { found: true, index: i, slot: arr[i], comparisons, steps: comparisons, log };
    }
  }
  log.push(`  ❌ Vehicle "${target}" not found after ${comparisons} comparison(s)`);
  return { found: false, index: -1, slot: null, comparisons, steps: comparisons, log };
}

/* ─────────────────────────────────────────────────────────
   5. SORT ALGORITHMS
   Each returns: { sortedArr, comparisons, swaps, log[] }
   ───────────────────────────────────────────────────────── */

function getKey(slot, by) {
  if (by === 'id')     return slot.id;
  if (by === 'status') return slot.status === STATUSES.FREE ? 0 : slot.status === STATUSES.OCCUPIED ? 1 : 2;
  if (by === 'plate')  return (slot.plate || '').toUpperCase();
  return slot.id;
}

function cmp(a, b, by, order) {
  const ka = getKey(a, by), kb = getKey(b, by);
  if (ka < kb) return order === 'asc' ? -1 : 1;
  if (ka > kb) return order === 'asc' ? 1 : -1;
  return 0;
}

/** BUBBLE SORT — O(n²)
 *  Repeatedly swaps adjacent out-of-order elements.
 */
function bubbleSort(arr, by, order) {
  const a = [...arr];
  const n = a.length;
  let comparisons = 0, swaps = 0;
  const log = [];
  log.push(`[Bubble Sort] n=${n}, key="${by}", order="${order}"`);

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    log.push(`  Pass ${i + 1}:`);
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      if (cmp(a[j], a[j + 1], by, order) > 0) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        swapped = true;
        log.push(`    Swap [${j}]↔[${j+1}]: Slot#${a[j].id} ↔ Slot#${a[j+1].id}  (swap #${swaps})`);
      }
    }
    if (!swapped) {
      log.push(`  ✅ Array sorted after ${i + 1} pass(es) — early exit`);
      break;
    }
  }
  log.push(`  Total: ${comparisons} comparisons, ${swaps} swaps`);
  return { sortedArr: a, comparisons, swaps, log };
}

/** SELECTION SORT — O(n²)
 *  Selects minimum and places it at front each pass.
 */
function selectionSort(arr, by, order) {
  const a = [...arr];
  const n = a.length;
  let comparisons = 0, swaps = 0;
  const log = [];
  log.push(`[Selection Sort] n=${n}, key="${by}", order="${order}"`);

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      if (cmp(a[j], a[minIdx], by, order) < 0) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      swaps++;
      log.push(`  Pass ${i+1}: Selected min at [${minIdx}] (Slot#${a[i].id}), swapped with [${i}]  (swap #${swaps})`);
    } else {
      log.push(`  Pass ${i+1}: Min already at [${i}] (Slot#${a[i].id}), no swap`);
    }
  }
  log.push(`  Total: ${comparisons} comparisons, ${swaps} swaps`);
  return { sortedArr: a, comparisons, swaps, log };
}

/** INSERTION SORT — O(n²)
 *  Builds sorted subarray by inserting elements one by one.
 */
function insertionSort(arr, by, order) {
  const a = [...arr];
  const n = a.length;
  let comparisons = 0, swaps = 0;
  const log = [];
  log.push(`[Insertion Sort] n=${n}, key="${by}", order="${order}"`);

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    log.push(`  Insert Slot#${key.id} (i=${i}) into sorted portion [0..${i-1}]`);
    while (j >= 0 && cmp(a[j], key, by, order) > 0) {
      comparisons++;
      a[j + 1] = a[j];
      swaps++;
      j--;
    }
    comparisons++;
    a[j + 1] = key;
    log.push(`    Placed Slot#${key.id} at position ${j+1}  (${swaps} total shifts)`);
  }
  log.push(`  Total: ${comparisons} comparisons, ${swaps} shifts`);
  return { sortedArr: a, comparisons, swaps, log };
}

/** QUICK SORT — O(n log n) average
 *  Partitions around a pivot recursively.
 */
function quickSort(arr, by, order) {
  const a = [...arr];
  let comparisons = 0, swaps = 0;
  const log = [];
  log.push(`[Quick Sort] n=${a.length}, key="${by}", order="${order}"`);

  function partition(lo, hi) {
    const pivot = a[hi];
    log.push(`  Partition [${lo}..${hi}] pivot=Slot#${pivot.id}`);
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      comparisons++;
      if (cmp(a[j], pivot, by, order) <= 0) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        swaps++;
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    swaps++;
    log.push(`    Pivot placed at ${i + 1}`);
    return i + 1;
  }

  function qs(lo, hi) {
    if (lo < hi) {
      const p = partition(lo, hi);
      qs(lo, p - 1);
      qs(p + 1, hi);
    }
  }

  qs(0, a.length - 1);
  log.push(`  Total: ${comparisons} comparisons, ${swaps} swaps`);
  return { sortedArr: a, comparisons, swaps, log };
}

/** MERGE SORT — O(n log n)
 *  Divides into halves, sorts each, then merges.
 */
function mergeSort(arr, by, order) {
  let comparisons = 0, swaps = 0;
  const log = [];
  log.push(`[Merge Sort] n=${arr.length}, key="${by}", order="${order}"`);
  let mergeCount = 0;

  function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    mergeCount++;
    log.push(`  Merge #${mergeCount}: [${left.map(s=>s.id)}] + [${right.map(s=>s.id)}]`);
    while (i < left.length && j < right.length) {
      comparisons++;
      if (cmp(left[i], right[j], by, order) <= 0) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
        swaps++;
      }
    }
    const merged = [...result, ...left.slice(i), ...right.slice(j)];
    log.push(`    → [${merged.map(s=>s.id)}]`);
    return merged;
  }

  function ms(a) {
    if (a.length <= 1) return a;
    const mid = Math.floor(a.length / 2);
    return merge(ms(a.slice(0, mid)), ms(a.slice(mid)));
  }

  const sorted = ms([...arr]);
  log.push(`  Total: ${comparisons} comparisons, ${swaps} out-of-order merges`);
  return { sortedArr: sorted, comparisons, swaps, log };
}

/* ─────────────────────────────────────────────────────────
   6. PARKING OPERATIONS
   ───────────────────────────────────────────────────────── */
function parkVehicle(slotIndex, plate, vehicleType) {
  if (slotIndex < 0 || slotIndex >= State.slots.length) return false;
  const slot = State.slots[slotIndex];
  if (slot.status !== STATUSES.FREE) return false;
  slot.status = STATUSES.OCCUPIED;
  slot.plate = plate.trim().toUpperCase();
  slot.vehicleType = vehicleType;
  slot.parkedAt = Date.now();
  return true;
}

function releaseSlot(slotIndex) {
  if (slotIndex < 0 || slotIndex >= State.slots.length) return false;
  const slot = State.slots[slotIndex];
  if (slot.status === STATUSES.FREE) return false;
  slot.status = STATUSES.FREE;
  slot.plate = null;
  slot.vehicleType = null;
  slot.parkedAt = null;
  return true;
}

function getStats() {
  const total = State.slots.length;
  const occupied = State.slots.filter(s => s.status === STATUSES.OCCUPIED).length;
  const reserved = State.slots.filter(s => s.status === STATUSES.RESERVED).length;
  const free = total - occupied - reserved;
  const rate = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;
  return { total, occupied, reserved, free, rate };
}

/* ─────────────────────────────────────────────────────────
   7. RANDOM DATA GENERATION
   ───────────────────────────────────────────────────────── */
const SAMPLE_PLATES = [
  'MH12AB3456','DL8CAF7890','KA01MX2233','TN09ZZ1122','GJ05CD4567',
  'UP32AA9900','WB22GH5432','RJ14JK7788','HR26LM3344','PB65QR1199',
  'AP09ST5566','BR05UV7788','MP07WX2211','OD11YZ8899','CG04AB1234',
  'MH14CD5678','DL4CAB3333','KA03PQ6677','TN11MN4455','GJ01RS9911',
];

function randomFill(percentage = 0.6) {
  const n = State.slots.length;
  // Reset all first
  State.slots.forEach(s => {
    s.status = STATUSES.FREE;
    s.plate = null; s.vehicleType = null; s.parkedAt = null;
  });

  // Randomly occupy
  const toOccupy = Math.floor(n * percentage);
  const indices = [...Array(n).keys()].sort(() => Math.random() - 0.5).slice(0, toOccupy);
  const vtypes = Object.keys(VEHICLE_ICONS).filter(k => k !== '🅿');

  indices.forEach((i, j) => {
    const plateIdx = j % SAMPLE_PLATES.length;
    State.slots[i].status = Math.random() < 0.1 ? STATUSES.RESERVED : STATUSES.OCCUPIED;
    State.slots[i].plate = SAMPLE_PLATES[plateIdx];
    State.slots[i].vehicleType = vtypes[Math.floor(Math.random() * vtypes.length)];
    State.slots[i].parkedAt = Date.now() - Math.random() * 3600000 * 5;
  });
}

/* ─────────────────────────────────────────────────────────
   8. RENDER FUNCTIONS
   ───────────────────────────────────────────────────────── */
function renderParkingGrid() {
  const grid = document.getElementById('parking-grid');
  grid.innerHTML = '';
  State.slots.forEach((slot, i) => {
    const card = document.createElement('div');
    card.className = `slot-card ${slot.status}${State.highlightedSlots.has(i) ? ' highlighted' : ''}`;
    card.dataset.index = i;
    card.id = `slot-card-${i}`;

    const icon = slot.status === STATUSES.FREE ? '🅿'
                : slot.status === STATUSES.RESERVED ? '🚧'
                : (slot.vehicleType || '🚗');

    card.innerHTML = `
      <div class="slot-number">SLOT #${String(slot.id).padStart(2,'0')}</div>
      <span class="slot-icon">${icon}</span>
      <span class="slot-status-badge">${slot.status}</span>
      ${slot.plate ? `<div class="slot-plate">${slot.plate}</div>` : ''}
    `;
    card.addEventListener('click', () => openSlotDetail(i));
    grid.appendChild(card);
  });
  renderArrayDisplay();
  updateStats();
}

function renderArrayDisplay() {
  const display = document.getElementById('ds-array-display');
  display.innerHTML = '';
  State.slots.forEach((slot, i) => {
    const cell = document.createElement('div');
    cell.className = 'ds-cell';
    const valClass = State.highlightedSlots.has(i)
      ? 'highlight'
      : slot.status;
    cell.innerHTML = `
      <span class="ds-cell-idx">[${i}]</span>
      <span class="ds-cell-val ${valClass}" title="Slot #${slot.id} — ${slot.status}">S${slot.id}</span>
    `;
    display.appendChild(cell);
  });
}

function updateStats() {
  const { total, free, occupied, rate } = getStats();
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-free').textContent = free;
  document.getElementById('stat-occupied').textContent = occupied;
  document.getElementById('stat-rate').textContent = rate + '%';
}

function updateNavLinks() {
  const sections = ['dashboard','algorithms','analytics','about'];
  const scrollY = window.scrollY + 80;
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const link = document.getElementById('nav-' + id);
    if (!link) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (scrollY >= top && scrollY < bottom) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

/* ─────────────────────────────────────────────────────────
   9. LIVE CLOCK
   ───────────────────────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  const t = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':');
  document.getElementById('live-time').textContent = t;
}

/* ─────────────────────────────────────────────────────────
   10. TRACE LOG
   ───────────────────────────────────────────────────────── */
const TRACE_TYPES = {
  '✅': 'found',
  '❌': 'error',
  '  Swap': 'swap',
  '  Step': 'step',
  '  Pass': 'step',
  '  Insert': 'step',
  '  Merge': 'step',
  '  Partition': 'step',
  '  [': 'miss',
  '  Jump': 'step',
  '  Linear': 'step',
};

function renderTrace(log) {
  const container = document.getElementById('trace-log');
  container.innerHTML = '';
  log.forEach(line => {
    const span = document.createElement('span');
    span.className = 'trace-entry';
    if (line.startsWith('[')) span.classList.add('info');
    else if (line.includes('✅')) span.classList.add('found');
    else if (line.includes('❌')) span.classList.add('error');
    else if (line.toLowerCase().includes('swap') || line.toLowerCase().includes('shift')) span.classList.add('swap');
    else if (line.trim().startsWith('Step') || line.trim().startsWith('Pass') || line.trim().startsWith('Insert') || line.includes('Merge') || line.includes('Partition') || line.includes('Jump') || line.includes('scan')) span.classList.add('step');
    else span.classList.add('miss');
    span.textContent = line;
    container.appendChild(span);
    container.appendChild(document.createTextNode('\n'));
  });
  container.scrollTop = container.scrollHeight;
}

/* ─────────────────────────────────────────────────────────
   11. SEARCH RUNNER
   ───────────────────────────────────────────────────────── */
function runSearch() {
  const algo    = document.getElementById('search-algo-select').value;
  const searchBy = document.getElementById('search-by-select').value;
  const target  = parseInt(document.getElementById('search-target').value);
  const plate   = document.getElementById('search-plate').value;

  let result;
  const t0 = performance.now();

  if (searchBy === 'free') {
    result = searchFirstFree(State.slots);
  } else if (searchBy === 'vehicle') {
    result = searchByPlate(State.slots, plate || '');
  } else {
    // Search by ID
    if (isNaN(target)) { showToast('Enter a valid slot ID', 'error'); return; }
    if (algo === 'linear') result = linearSearch(State.slots, target);
    else if (algo === 'binary') result = binarySearch(State.slots, target);
    else result = jumpSearch(State.slots, target);
  }

  const t1 = performance.now();
  const timeUs = ((t1 - t0) * 1000).toFixed(2);

  // Highlight found slot
  State.highlightedSlots.clear();
  if (result.found) {
    State.highlightedSlots.add(result.index);
    setTimeout(() => {
      document.getElementById(`slot-card-${result.index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  renderParkingGrid();
  renderTrace(result.log);

  // Update result panel
  const panel = document.getElementById('search-result');
  if (result.found) {
    const s = result.slot;
    panel.innerHTML = `
      <div class="result-found">✅ Slot #${s.id} Found!</div>
      <div class="result-details">
        <div class="result-detail-item"><span class="rdi-label">Array Index</span><span class="rdi-val">[${result.index}]</span></div>
        <div class="result-detail-item"><span class="rdi-label">Status</span><span class="rdi-val">${s.status.toUpperCase()}</span></div>
        <div class="result-detail-item"><span class="rdi-label">Comparisons</span><span class="rdi-val">${result.comparisons}</span></div>
        <div class="result-detail-item"><span class="rdi-label">Time</span><span class="rdi-val">${timeUs} µs</span></div>
        ${s.plate ? `<div class="result-detail-item"><span class="rdi-label">Plate</span><span class="rdi-val">${s.plate}</span></div>` : ''}
      </div>
    `;
    showToast(`Found Slot #${s.id} in ${result.comparisons} comparison(s)`, 'success');
  } else {
    panel.innerHTML = `
      <div class="result-not-found">❌ Not Found</div>
      <div class="result-details">
        <div class="result-detail-item"><span class="rdi-label">Comparisons</span><span class="rdi-val">${result.comparisons}</span></div>
        <div class="result-detail-item"><span class="rdi-label">Steps</span><span class="rdi-val">${result.steps}</span></div>
        <div class="result-detail-item"><span class="rdi-label">Time</span><span class="rdi-val">${timeUs} µs</span></div>
      </div>
    `;
    showToast('Slot not found', 'warn');
  }

  // Update metrics
  const algoName = { linear: 'Linear Search', binary: 'Binary Search', jump: 'Jump Search' };
  document.getElementById('m-search-algo').textContent  = algoName[algo] || algo;
  document.getElementById('m-search-comps').textContent = result.comparisons;
  document.getElementById('m-search-steps').textContent = result.steps;
  document.getElementById('m-search-idx').textContent   = result.found ? result.index : 'N/A';
  document.getElementById('m-search-time').textContent  = timeUs;

  addHistory('Search', algoName[algo] || algo, searchBy === 'id' ? `Slot #${target}` : searchBy, result.comparisons, result.found ? `Found [${result.index}]` : 'Not Found', timeUs);

  // Highlight active complexity row
  document.querySelectorAll('#search-card .complexity-table tr').forEach(r => r.classList.remove('active-row'));
  const rowMap = { linear: 'ct-linear', binary: 'ct-binary', jump: 'ct-jump' };
  const activeRow = document.getElementById(rowMap[algo]);
  if (activeRow) activeRow.classList.add('active-row');
}

/* ─────────────────────────────────────────────────────────
   12. SORT RUNNER
   ───────────────────────────────────────────────────────── */
function runSort() {
  const algo  = document.getElementById('sort-algo-select').value;
  const by    = document.getElementById('sort-by-select').value;
  const order = document.getElementById('sort-order-select').value;

  const t0 = performance.now();
  let result;
  if (algo === 'bubble')    result = bubbleSort(State.slots, by, order);
  else if (algo === 'selection') result = selectionSort(State.slots, by, order);
  else if (algo === 'insertion') result = insertionSort(State.slots, by, order);
  else if (algo === 'quick')    result = quickSort(State.slots, by, order);
  else                          result = mergeSort(State.slots, by, order);
  const t1 = performance.now();
  const timeUs = ((t1 - t0) * 1000).toFixed(2);

  // Apply sorted array
  State.slots = result.sortedArr;
  // Update indices
  State.slots.forEach((s, i) => { s.index = i; });
  State.highlightedSlots.clear();
  renderParkingGrid();
  renderTrace(result.log);

  // Result panel
  const panel = document.getElementById('sort-result');
  const algoLabels = {
    bubble: 'Bubble Sort', selection: 'Selection Sort', insertion: 'Insertion Sort',
    quick: 'Quick Sort', merge: 'Merge Sort',
  };
  panel.innerHTML = `
    <div class="result-sorted">⚙️ ${algoLabels[algo]} Complete</div>
    <div class="result-details">
      <div class="result-detail-item"><span class="rdi-label">Sorted By</span><span class="rdi-val">${by} (${order})</span></div>
      <div class="result-detail-item"><span class="rdi-label">Comparisons</span><span class="rdi-val">${result.comparisons}</span></div>
      <div class="result-detail-item"><span class="rdi-label">Swaps/Shifts</span><span class="rdi-val">${result.swaps}</span></div>
      <div class="result-detail-item"><span class="rdi-label">Array Size</span><span class="rdi-val">${State.slots.length}</span></div>
      <div class="result-detail-item"><span class="rdi-label">Time</span><span class="rdi-val">${timeUs} µs</span></div>
    </div>
  `;
  showToast(`${algoLabels[algo]}: ${result.comparisons} comparisons, ${result.swaps} swaps`, 'info');

  document.getElementById('m-sort-algo').textContent  = algoLabels[algo];
  document.getElementById('m-sort-comps').textContent = result.comparisons;
  document.getElementById('m-sort-swaps').textContent = result.swaps;
  document.getElementById('m-sort-size').textContent  = State.slots.length;
  document.getElementById('m-sort-time').textContent  = timeUs;

  addHistory('Sort', algoLabels[algo], `By ${by} ${order}`, result.comparisons, `Sorted (${result.swaps} swaps)`, timeUs);
}

/* ─────────────────────────────────────────────────────────
   13. BENCHMARK
   ───────────────────────────────────────────────────────── */
function runBenchmark() {
  const n = State.slots.length;
  const target = State.slots[Math.floor(n / 2)].id;

  const searchAlgos = [
    { name: 'Linear', fn: () => linearSearch(State.slots, target) },
    { name: 'Binary', fn: () => binarySearch(State.slots, target) },
    { name: 'Jump',   fn: () => jumpSearch(State.slots, target)   },
  ];
  const sortAlgos = [
    { name: 'Bubble',    fn: () => bubbleSort([...State.slots],    'id', 'asc') },
    { name: 'Selection', fn: () => selectionSort([...State.slots], 'id', 'asc') },
    { name: 'Insertion', fn: () => insertionSort([...State.slots], 'id', 'asc') },
    { name: 'Quick',     fn: () => quickSort([...State.slots],     'id', 'asc') },
    { name: 'Merge',     fn: () => mergeSort([...State.slots],     'id', 'asc') },
  ];

  const allAlgos = [...searchAlgos, ...sortAlgos];
  const results = allAlgos.map(a => {
    const t0 = performance.now();
    const r = a.fn();
    const t1 = performance.now();
    return { name: a.name, comparisons: r.comparisons, timeUs: ((t1-t0)*1000).toFixed(1) };
  });

  renderBenchmarkChart(results);
  showToast(`Benchmark complete: ${n} slots tested across ${allAlgos.length} algorithms`, 'success');
}

function renderBenchmarkChart(results) {
  const container = document.getElementById('benchmark-chart');
  container.innerHTML = '';
  const maxComps = Math.max(...results.map(r => r.comparisons), 1);

  const colors = [
    '#00d4ff','#00aacc','#0088aa',   // search — blues
    '#f59e0b','#ef4444','#10b981','#7c3aed','#ec4899', // sort — mixed
  ];

  results.forEach((r, i) => {
    const group = document.createElement('div');
    group.className = 'chart-bar-group';

    const barHeight = Math.max(4, Math.round((r.comparisons / maxComps) * 180));
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = barHeight + 'px';
    bar.style.background = colors[i % colors.length];
    bar.setAttribute('data-val', `${r.name}: ${r.comparisons} cmps, ${r.timeUs}µs`);

    const label = document.createElement('div');
    label.className = 'chart-bar-label';
    label.textContent = `${r.name} (${r.comparisons})`;

    group.appendChild(bar);
    group.appendChild(label);
    container.appendChild(group);
  });
}

/* ─────────────────────────────────────────────────────────
   14. HISTORY
   ───────────────────────────────────────────────────────── */
function addHistory(opType, algo, target, comparisons, resultText, timeUs) {
  State.historyCounter++;
  const entry = { num: State.historyCounter, opType, algo, target, comparisons, resultText, timeUs };
  State.history.unshift(entry);
  if (State.history.length > 50) State.history.pop();
  renderHistory();
}

function renderHistory() {
  const tbody = document.getElementById('history-body');
  if (State.history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No operations yet.</td></tr>';
    return;
  }
  tbody.innerHTML = State.history.map(h => {
    const opBadge = `<span class="op-badge ${h.opType.toLowerCase()}">${h.opType}</span>`;
    const resClass = h.resultText.includes('Found') ? 'res-found'
                   : h.resultText.includes('Not') ? 'res-notfound' : 'res-sorted';
    return `<tr>
      <td>${h.num}</td>
      <td>${opBadge}</td>
      <td>${h.algo}</td>
      <td>${h.target}</td>
      <td>${h.comparisons}</td>
      <td class="${resClass}">${h.resultText}</td>
      <td>${h.timeUs}</td>
    </tr>`;
  }).join('');
}

/* ─────────────────────────────────────────────────────────
   15. MODALS
   ───────────────────────────────────────────────────────── */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
}

function openParkModal() {
  // Populate slot dropdown with free slots
  const sel = document.getElementById('park-slot-select');
  sel.innerHTML = '<option value="auto">Auto-assign (First Free)</option>';
  State.slots.forEach((s, i) => {
    if (s.status === STATUSES.FREE) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Slot #${s.id} — Free`;
      sel.appendChild(opt);
    }
  });
  document.getElementById('park-plate-input').value = '';
  openModal('modal-park');
}

function confirmPark() {
  const plate = document.getElementById('park-plate-input').value.trim();
  if (!plate) { showToast('Please enter vehicle plate number', 'error'); return; }
  const vtEl = document.querySelector('input[name="vtype"]:checked');
  const vtype = vtEl ? vtEl.value : '🚗';
  const selVal = document.getElementById('park-slot-select').value;

  let slotIdx;
  if (selVal === 'auto') {
    const r = searchFirstFree(State.slots);
    if (!r.found) { showToast('No free slots available!', 'error'); return; }
    slotIdx = r.index;
  } else {
    slotIdx = parseInt(selVal);
  }

  if (parkVehicle(slotIdx, plate, vtype)) {
    closeModal('modal-park');
    renderParkingGrid();
    showToast(`${vtype} ${plate} parked in Slot #${State.slots[slotIdx].id}`, 'success');
  } else {
    showToast('Failed to park vehicle. Slot may be occupied.', 'error');
  }
}

function openReleaseModal() {
  const sel = document.getElementById('release-slot-select');
  sel.innerHTML = '<option value="">— Choose an occupied slot —</option>';
  State.slots.forEach((s, i) => {
    if (s.status !== STATUSES.FREE) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Slot #${s.id} — ${s.status.toUpperCase()} — ${s.plate || 'Reserved'}`;
      sel.appendChild(opt);
    }
  });
  document.getElementById('release-preview').style.display = 'none';
  openModal('modal-release');
}

function updateReleasePreview() {
  const idx = parseInt(document.getElementById('release-slot-select').value);
  const preview = document.getElementById('release-preview');
  if (isNaN(idx)) { preview.style.display = 'none'; return; }
  const s = State.slots[idx];
  if (!s) { preview.style.display = 'none'; return; }
  document.getElementById('rp-id').textContent = `#${s.id}`;
  document.getElementById('rp-plate').textContent = `${s.vehicleType || ''} ${s.plate || 'Reserved'}`;
  if (s.parkedAt) {
    const parkedDate = new Date(s.parkedAt);
    document.getElementById('rp-time').textContent = parkedDate.toLocaleTimeString();
    const durMs = Date.now() - s.parkedAt;
    const durMin = Math.floor(durMs / 60000);
    document.getElementById('rp-duration').textContent = durMin < 60 ? `${durMin} min` : `${Math.floor(durMin/60)}h ${durMin%60}m`;
  } else {
    document.getElementById('rp-time').textContent = 'N/A';
    document.getElementById('rp-duration').textContent = 'N/A';
  }
  preview.style.display = 'flex';
}

function confirmRelease() {
  const idx = parseInt(document.getElementById('release-slot-select').value);
  if (isNaN(idx)) { showToast('Please select a slot to release', 'warn'); return; }
  const plate = State.slots[idx]?.plate;
  if (releaseSlot(idx)) {
    closeModal('modal-release');
    renderParkingGrid();
    showToast(`Slot #${State.slots[idx].id} released ${plate ? '(' + plate + ')' : ''}`, 'success');
  } else {
    showToast('Could not release slot', 'error');
  }
}

function openSlotDetail(idx) {
  const s = State.slots[idx];
  const body = document.getElementById('slot-detail-body');
  const actionBtn = document.getElementById('modal-detail-action');
  const title = document.getElementById('modal-detail-title');
  title.textContent = `Slot #${s.id} — ${s.status.charAt(0).toUpperCase() + s.status.slice(1)}`;

  const parkedSince = s.parkedAt ? new Date(s.parkedAt).toLocaleString() : 'N/A';
  const durMs = s.parkedAt ? Date.now() - s.parkedAt : 0;
  const durMin = s.parkedAt ? Math.floor(durMs / 60000) : 0;
  const duration = s.parkedAt ? (durMin < 60 ? `${durMin} min` : `${Math.floor(durMin/60)}h ${durMin%60}m`) : 'N/A';

  body.innerHTML = `
    <div class="metric-list">
      <div class="metric-item"><span class="m-label">Slot ID</span><span class="m-val">#${s.id}</span></div>
      <div class="metric-item"><span class="m-label">Array Index</span><span class="m-val">[${idx}]</span></div>
      <div class="metric-item"><span class="m-label">Status</span><span class="m-val">${s.status.toUpperCase()}</span></div>
      ${s.plate ? `<div class="metric-item"><span class="m-label">Vehicle</span><span class="m-val">${s.vehicleType || ''} ${s.plate}</span></div>` : ''}
      ${s.parkedAt ? `<div class="metric-item"><span class="m-label">Parked At</span><span class="m-val">${parkedSince}</span></div>` : ''}
      ${s.parkedAt ? `<div class="metric-item"><span class="m-label">Duration</span><span class="m-val">${duration}</span></div>` : ''}
    </div>
  `;

  if (s.status === STATUSES.FREE) {
    actionBtn.textContent = '🚗 Park Here';
    actionBtn.className = 'btn btn-primary';
    actionBtn.onclick = () => {
      closeModal('modal-slot-detail');
      openParkModal();
      const sel = document.getElementById('park-slot-select');
      setTimeout(() => { sel.value = idx; }, 50);
    };
  } else {
    actionBtn.textContent = '🔓 Release Slot';
    actionBtn.className = 'btn btn-danger';
    actionBtn.onclick = () => {
      if (releaseSlot(idx)) {
        closeModal('modal-slot-detail');
        renderParkingGrid();
        showToast(`Slot #${s.id} released`, 'success');
      }
    };
  }
  openModal('modal-slot-detail');
}

/* ─────────────────────────────────────────────────────────
   16. TOAST NOTIFICATIONS
   ───────────────────────────────────────────────────────── */
const TOAST_ICONS = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };

function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ─────────────────────────────────────────────────────────
   17. PARTICLES
   ───────────────────────────────────────────────────────── */
function createParticles() {
  const container = document.getElementById('hero-particles');
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      animation-duration:${Math.random()*8+6}s;
      animation-delay:${Math.random()*6}s;
    `;
    container.appendChild(p);
  }
}

/* ─────────────────────────────────────────────────────────
   18. GRID SIZE CHANGE
   ───────────────────────────────────────────────────────── */
function changeGridSize(n) {
  State.totalSlots = n;
  // Preserve existing slots, extend or trim
  const current = State.slots.length;
  if (n > current) {
    for (let i = current; i < n; i++) State.slots.push(createSlot(i + 1));
  } else if (n < current) {
    State.slots = State.slots.slice(0, n);
  }
  State.highlightedSlots.clear();
  renderParkingGrid();
  showToast(`Grid resized to ${n} slots`, 'info');
}

/* ─────────────────────────────────────────────────────────
   19. KEYBOARD SHORTCUTS
   ───────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['modal-park','modal-release','modal-slot-detail'].forEach(closeModal);
  }
  if (e.ctrlKey && e.key === 'Enter') {
    runSearch();
  }
});

/* ─────────────────────────────────────────────────────────
   20. BOOT & EVENT BINDING
   ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Init
  initSlots(20);
  randomFill(0.55);
  createParticles();
  renderParkingGrid();
  renderHistory();
  updateClock();

  // Clock
  setInterval(updateClock, 1000);

  // Navbar scroll
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
    updateNavLinks();
  });

  // ── Hero actions ──
  document.getElementById('btn-park-car').addEventListener('click', openParkModal);
  document.getElementById('btn-release').addEventListener('click', openReleaseModal);
  document.getElementById('btn-reset-lot').addEventListener('click', () => {
    initSlots(State.totalSlots);
    State.highlightedSlots.clear();
    renderParkingGrid();
    showToast('Parking lot reset', 'info');
  });

  // ── Grid controls ──
  document.getElementById('grid-size-select').addEventListener('change', e => {
    changeGridSize(parseInt(e.target.value));
  });
  document.getElementById('btn-random-fill').addEventListener('click', () => {
    randomFill(0.55);
    renderParkingGrid();
    showToast('Random fill applied', 'info');
  });

  // ── Algorithm buttons ──
  document.getElementById('btn-run-search').addEventListener('click', runSearch);
  document.getElementById('btn-run-sort').addEventListener('click', runSort);
  document.getElementById('btn-clear-trace').addEventListener('click', () => {
    document.getElementById('trace-log').innerHTML = '<span class="trace-empty">Cleared.</span>';
  });

  // ── Analytics ──
  document.getElementById('btn-run-benchmark').addEventListener('click', runBenchmark);
  document.getElementById('btn-clear-history').addEventListener('click', () => {
    State.history = [];
    State.historyCounter = 0;
    renderHistory();
  });

  // ── Park modal ──
  document.getElementById('modal-park-close').addEventListener('click', () => closeModal('modal-park'));
  document.getElementById('modal-park-cancel').addEventListener('click', () => closeModal('modal-park'));
  document.getElementById('modal-park-confirm').addEventListener('click', confirmPark);

  // ── Release modal ──
  document.getElementById('modal-release-close').addEventListener('click', () => closeModal('modal-release'));
  document.getElementById('modal-release-cancel').addEventListener('click', () => closeModal('modal-release'));
  document.getElementById('modal-release-confirm').addEventListener('click', confirmRelease);
  document.getElementById('release-slot-select').addEventListener('change', updateReleasePreview);

  // ── Slot detail modal ──
  document.getElementById('modal-detail-close').addEventListener('click', () => closeModal('modal-slot-detail'));
  document.getElementById('modal-detail-cancel').addEventListener('click', () => closeModal('modal-slot-detail'));

  // ── Close modal on overlay click ──
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // ── Search-by toggle: show/hide fields ──
  document.getElementById('search-by-select').addEventListener('change', e => {
    const byId = e.target.value === 'id';
    const byPlate = e.target.value === 'vehicle';
    document.getElementById('search-target').closest('.form-group').style.display = byId ? '' : 'none';
    document.getElementById('search-plate').closest('.form-group').style.display = byPlate ? '' : 'none';
  });

  // ── Update search target max on grid size change ──
  document.getElementById('grid-size-select').addEventListener('change', e => {
    document.getElementById('search-target').max = e.target.value;
  });

  showToast('SmartPark initialized — 20 slots loaded', 'success');
});
