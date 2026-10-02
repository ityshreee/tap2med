import re

# 1. Update dashboard.css
with open('frontend/assets/css/pages/dashboard.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Check if .prescription-row already has cursor: grab
if 'cursor: grab;' not in css:
    css = css.replace('.prescription-row {', '.prescription-row {\n  cursor: grab;')

if '.dragging' not in css:
    css += "\n.dragging {\n  opacity: 0.5;\n  cursor: grabbing !important;\n}\n"

with open('frontend/assets/css/pages/dashboard.css', 'w', encoding='utf-8') as f:
    f.write(css)

# 2. Update dashboard.js
with open('frontend/assets/js/pages/dashboard.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Ensure we don't duplicate drag logic
if 'draggable="true"' not in js or 'row.addEventListener("dragstart"' not in js:
    # Find container.appendChild(row); in addPrescriptionRow
    
    drag_logic = """
  // Drag and Drop Logic
  row.setAttribute("draggable", "true");
  row.addEventListener("dragstart", (e) => {
    row.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });
  row.addEventListener("dragover", (e) => {
    e.preventDefault();
    const draggingRow = container.querySelector(".dragging");
    if (!draggingRow || draggingRow === row) return;
    const bounding = row.getBoundingClientRect();
    const offset = e.clientY - bounding.top;
    if (offset > bounding.height / 2) {
      row.after(draggingRow);
    } else {
      row.before(draggingRow);
    }
  });
  row.addEventListener("drop", (e) => {
    e.preventDefault();
  });
  row.addEventListener("dragend", () => {
    row.classList.remove("dragging");
    updateRowNumbers();
    if (typeof savePrescriptionDraft === "function") {
      savePrescriptionDraft();
    }
  });

  container.appendChild(row);"""
    
    js = js.replace('container.appendChild(row);', drag_logic, 1)

with open('frontend/assets/js/pages/dashboard.js', 'w', encoding='utf-8') as f:
    f.write(js)

# 3. Update dashboard.html
with open('frontend/clinic/dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'dashboard\.css\?v=[a-zA-Z0-9_]*', 'dashboard.css?v=6', html)
html = re.sub(r'dashboard\.js\?v=[a-zA-Z0-9_]*', 'dashboard.js?v=6', html)

with open('frontend/clinic/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
