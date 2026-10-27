# 🅿 SmartPark — Intelligent Parking Slot Manager
### Micro Project 03 · Smart Cities · CO1 & CO5

---

## 📁 Project Files

| File | Size | Purpose |
|------|------|---------|
| [index.html](file:///c:/Users/DELL/OneDrive/Documents/Smart_Parking_Slot_Managerr/index.html) | 23 KB | HTML structure — all sections, modals, layout |
| [styles.css](file:///c:/Users/DELL/OneDrive/Documents/Smart_Parking_Slot_Managerr/styles.css) | 35 KB | Full design system — dark mode, animations, glassmorphism |
| [app.js](file:///c:/Users/DELL/OneDrive/Documents/Smart_Parking_Slot_Managerr/app.js) | 47 KB | All algorithms, data structures, UI logic |

> **To Run:** Double-click `index.html` to open in any browser — no server required!

---

## 🏗️ System Architecture

### Linear Data Structure

```js
// PRIMARY DATA STRUCTURE: JavaScript Array (Linear List)
State.slots = Array.from({ length: n }, (_, i) => createSlot(i + 1));

// Each element is a Slot Object
slots[i] = {
  id:          number,   // Slot number (1-indexed)
  index:       number,   // Position in array (0-indexed)
  status:      'free' | 'occupied' | 'reserved',
  plate:       string | null,
  vehicleType: '🚗' | '🏍️' | '🚐' | '🚛' | null,
  parkedAt:    timestamp | null,
}
```

---

## 🔍 Search Algorithms (CO1)

### 1. Linear Search — O(n)
- Traverses every element from index 0 to n-1
- Best case: O(1) — target at first position
- Worst case: O(n) — target at last position or absent
- **Used for:** Search by ID, find first free slot, search by vehicle plate

### 2. Binary Search — O(log n)
- Requires sorted array (auto-sorts by ID internally)
- Halves the search space at each step: `mid = (low + high) / 2`
- Best case: O(1) — target is the midpoint
- Worst/Average: O(log n)
- **Used for:** Search by Slot ID when fastest lookup needed

### 3. Jump Search — O(√n)
- Jumps in blocks of size `√n`, then linear scans backward
- Hybrid approach: fewer comparisons than Linear, no sort needed
- Block size for 20 slots = √20 ≈ 4
- **Used for:** Mid-performance option between Linear and Binary

---

## ⚙️ Sort Algorithms (CO5)

| Algorithm | Best | Average | Worst | Space | Strategy |
|-----------|------|---------|-------|-------|----------|
| **Bubble Sort** | O(n) | O(n²) | O(n²) | O(1) | Adjacent swaps, early exit |
| **Selection Sort** | O(n²) | O(n²) | O(n²) | O(1) | Find min, place at front |
| **Insertion Sort** | O(n) | O(n²) | O(n²) | O(1) | Build sorted subarray |
| **Quick Sort** | O(n log n) | O(n log n) | O(n²) | O(log n) | Partition around pivot |
| **Merge Sort** | O(n log n) | O(n log n) | O(n log n) | O(n) | Divide & conquer merge |

**Sort keys available:** Slot ID · Status (Free first) · Vehicle Plate (alphabetical)

---

## 📊 Performance Evaluation

The **Benchmark Mode** runs all 8 algorithms on the same dataset simultaneously and renders a **bar chart** comparing:
- Number of comparisons made
- Execution time in microseconds

**Operation History Table** logs every search and sort with:
`#` · Operation type · Algorithm · Target · Comparisons · Result · Time (µs)

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🎨 **Visual Grid** | 10–50 slot parking lot with color-coded status cards |
| 📦 **Array Display** | Visual representation of the underlying linear array with indices |
| 🔍 **Search Lab** | Run Linear / Binary / Jump search with step-by-step trace |
| ⚙️ **Sort Lab** | Run all 5 sort algorithms with comparison & swap counters |
| ⚡ **Trace Log** | Color-coded step-by-step algorithm execution log |
| 📊 **Benchmark** | Side-by-side performance comparison chart |
| 🚗 **Park/Release** | Full CRUD for vehicle parking with auto-assignment |
| 🎲 **Random Fill** | Generate realistic parking scenarios for testing |
| 🔔 **Toasts** | Real-time status notifications |
| ⌨️ **Shortcuts** | `Ctrl+Enter` → Run Search · `Esc` → Close modal |

---

## 🎓 Course Outcomes

| CO | Statement | Implementation |
|----|-----------|----------------|
| **CO1** | Apply linear data structures to real-world problems | All slots stored in a JavaScript array (linear list). Push/search/index operations demonstrated. |
| **CO5** | Analyze algorithm efficiency using Big-O notation | 5 sort + 3 search algorithms implemented from scratch with comparison counters and live Big-O complexity tables. |
