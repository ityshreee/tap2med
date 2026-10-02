import re

file_path = 'frontend/assets/js/labs.js'
with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

target = """  function closeSearchDropdown() {
    const dropdown = document.getElementById("lab-search-dropdown");
    if (dropdown) {
      dropdown.style.display = "none";
      dropdown.innerHTML = "";
    }

  function clearSearchAndClose() {
    const searchInput = document.getElementById("lab-search-input");
    if (searchInput) searchInput.value = "";
    closeSearchDropdown();
    if (typeof filterLabFields === "function") filterLabFields("");
  }

    searchDropdownOpen = false;
  }"""

replacement = """  function closeSearchDropdown() {
    const dropdown = document.getElementById("lab-search-dropdown");
    if (dropdown) {
      dropdown.style.display = "none";
      dropdown.innerHTML = "";
    }
    searchDropdownOpen = false;
  }

  function clearSearchAndClose() {
    const searchInput = document.getElementById("lab-search-input");
    if (searchInput) searchInput.value = "";
    closeSearchDropdown();
    if (typeof filterLabFields === "function") filterLabFields("");
  }"""

js = js.replace(target, replacement)

# Now, we also need to change the references inside addCatalogTest, addAllCategoryTests, submitInlineCustomTest to just call `clearSearchAndClose();` as requested by user.
# "Make sure any calls to this function inside addCatalogTest, addAllCategoryTests, and submitInlineCustomTest are simply called as clearSearchAndClose(); since they are within the same lexical scope."
js = js.replace("window.Tap2MedLabs.clearSearchAndClose();", "clearSearchAndClose();")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(js)

# Version Bump
html_files = [
    'frontend/clinic/dashboard.html',
    'frontend/clinic/directory.html',
    'frontend/clinic/staff_dashboard.html'
]

import os
for html_file in html_files:
    if os.path.exists(html_file):
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        
        html = re.sub(r'labs\.js\?v=[a-zA-Z0-9_]*', 'labs.js?v=13', html)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html)

print("Done fixing reference error")
