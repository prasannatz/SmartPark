# SmartPark — Intelligent Parking Slot Manager

A web-based parking management application that demonstrates parking slot allocation, availability tracking, searching and sorting algorithms, and algorithm performance benchmarking.

## Overview

SmartPark is a Smart City–focused project designed to make parking slot management easier to understand and operate. It combines an interactive parking dashboard with fundamental data structures and algorithms to demonstrate how parking information can be organized, searched, sorted, and analyzed.

## Features

- **Parking Slot Management:** View parking slots and their current states.
- **Slot Allocation and Release:** Manage parking occupancy through interactive controls.
- **Parking Status Visualization:** Distinguish between available, occupied, and reserved slots.
- **Random Fill:** Populate the parking layout with simulated parking data.
- **Search Algorithm Lab:** Explore Linear Search, Binary Search, and Jump Search.
- **Sorting Algorithm Lab:** Compare Bubble Sort, Selection Sort, Insertion Sort, Quick Sort, and Merge Sort.
- **Performance Benchmarking:** Run algorithm comparisons and examine execution performance.
- **Analytics Dashboard:** View parking statistics and visual summaries.
- **Complexity Reference:** Review the time complexity of the implemented algorithms.
- **Reset Functionality:** Restore the parking layout for another demonstration.

## Technology Stack

- **HTML5** — Page structure
- **CSS3** — Styling and responsive interface
- **JavaScript** — Application logic, parking interactions, searching, sorting, and benchmarking

## Algorithms Demonstrated

### Searching

| Algorithm | Typical Time Complexity |
|---|---|
| Linear Search | O(n) |
| Binary Search | O(log n) |
| Jump Search | O(√n) |

Binary Search and Jump Search require data to be sorted according to the search implementation's requirements.

### Sorting

| Algorithm | Average Time Complexity |
|---|---|
| Bubble Sort | O(n²) |
| Selection Sort | O(n²) |
| Insertion Sort | O(n²) |
| Quick Sort | O(n log n) |
| Merge Sort | O(n log n) |

*These are typical theoretical complexities; actual performance depends on the input data and implementation.*

## Getting Started

### Prerequisites

- A modern web browser
- No package installation is required for the basic static website

### Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/prasannatz/SmartPark.git
   ```

2. Open the project folder.
3. Open `index.html` in your web browser.

Alternatively, open the folder in an editor such as Visual Studio Code or Antigravity and use a local development server if preferred.


## Project Structure

```text
SmartPark/
├── index.html           # Main web page
├── styles.css           # Application styling
├── app.js               # Parking and algorithm logic
├── project_overview.md  # Project overview and documentation
├── test_jump_search.js  # Jump Search test script
└── README.md            # Project documentation
```

## Testing

The project includes `test_jump_search.js` for testing Jump Search functionality. Run tests according to the setup and execution instructions in the test file.

Parking interactions and algorithm features can also be explored through the browser interface.

## Project Objective

The objective of SmartPark is to demonstrate how linear data structures, searching algorithms, sorting algorithms, and performance evaluation can be applied to a practical parking management scenario.

## Future Enhancements

- Real-time parking occupancy using sensors
- Database integration for persistent parking records
- User authentication and role-based access
- Reservation and booking management
- Integration with live parking availability systems

## License

No license has been specified yet. Add a license if you decide to publish the project for reuse by others.

---

**SmartPark — Intelligent Parking Slot Manager**  
*An educational project exploring smart parking management and algorithms.*
