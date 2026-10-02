import re
import os

file_path = 'frontend/assets/js/labs.js'
with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Create global auto-clear helper
clear_helper = """
  function clearSearchAndClose() {
    const searchInput = document.getElementById("lab-search-input");
    if (searchInput) searchInput.value = "";
    closeSearchDropdown();
    if (typeof filterLabFields === "function") filterLabFields("");
  }
"""
if "function clearSearchAndClose()" not in js:
    js = re.sub(
        r'(function closeSearchDropdown\(\) \{[\s\S]*?  \})',
        r'\1\n' + clear_helper,
        js
    )

if "clearSearchAndClose," not in js:
    js = re.sub(
        r'(const Tap2MedLabs = \{[\s\S]*?)(\s*onInput,)',
        r'\1\n    clearSearchAndClose,\2',
        js
    )

# 2. Remove the inline clear blocks I added previously
old_clear_block = r"""\n\s*const searchInput = document\.getElementById\("lab-search-input"\);\s*if \(searchInput\) searchInput\.value = "";\s*closeSearchDropdown\(\);\s*filterLabFields\(""\);"""
js = re.sub(old_clear_block, '', js)

# 3. Replace closeSearchDropdown(); with window.Tap2MedLabs.clearSearchAndClose(); in addCatalogTest, addAllCategoryTests, submitInlineCustomTest
js = re.sub(
    r'(function addCatalogTest\([^)]*\)\s*\{[\s\S]*?)closeSearchDropdown\(\);',
    r'\1window.Tap2MedLabs.clearSearchAndClose();',
    js
)
js = re.sub(
    r'(function addAllCategoryTests\([^)]*\)\s*\{[\s\S]*?)renderSearchDropdown\(input \? input\.value : "", catName\);\n\s*\}',
    r'\1renderSearchDropdown(input ? input.value : "", catName);\n    window.Tap2MedLabs.clearSearchAndClose();\n  }',
    js
)
js = re.sub(
    r'(function submitInlineCustomTest\([^)]*\)\s*\{[\s\S]*?)closeSearchDropdown\(\);',
    r'\1window.Tap2MedLabs.clearSearchAndClose();',
    js
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(js)

# Version Bump
html_files = [
    'frontend/clinic/dashboard.html',
    'frontend/clinic/directory.html',
    'frontend/clinic/staff_dashboard.html'
]

for html_file in html_files:
    if os.path.exists(html_file):
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        
        html = re.sub(r'labs\.js\?v=[a-zA-Z0-9_]*', 'labs.js?v=12', html)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html)

print("Done logic replacements")
