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

# Insert after closeSearchDropdown
js = re.sub(
    r'(function closeSearchDropdown\(\) \{[\s\S]*?  \})',
    r'\1\n' + clear_helper,
    js
)

# Export clearSearchAndClose in Tap2MedLabs object
js = re.sub(
    r'(const Tap2MedLabs = \{[\s\S]*?)(\s*onInput,)',
    r'\1\n    clearSearchAndClose,\2',
    js
)

# Also expose it on window.Tap2MedLabs if it isn't directly the object
# It's exposed via window.Tap2MedLabs = Tap2MedLabs;

# 2. Apply Auto-Clear to All Add Actions
# Remove the blocks I added previously and replace closeSearchDropdown with window.Tap2MedLabs.clearSearchAndClose()
old_clear_block = r"""\n\s*const searchInput = document\.getElementById\("lab-search-input"\);\s*if \(searchInput\) searchInput\.value = "";\s*closeSearchDropdown\(\);\s*filterLabFields\(""\);"""

# addCatalogTest
js = re.sub(old_clear_block, '', js) # first remove all my old clear blocks
js = js.replace('closeSearchDropdown();\n\n    if (btnEl)', 'window.Tap2MedLabs.clearSearchAndClose();\n\n    if (btnEl)')

# addAllCategoryTests
js = re.sub(r'renderSearchDropdown\(input \? input\.value : "", catName\);\s*\}', 'renderSearchDropdown(input ? input.value : "", catName);\n    window.Tap2MedLabs.clearSearchAndClose();\n  }', js)

# submitInlineCustomTest
js = re.sub(r'closeSearchDropdown\(\);\s*\}', 'window.Tap2MedLabs.clearSearchAndClose();\n  }', js)


# 3. Replace all badges with inline inputs
input_html = """`<input 
  type="text" 
  placeholder="Enter value" 
  class="input"
  style="width: 100px; height: 28px; font-size: 12px; padding: 2px 6px; border: 1.5px solid #38bdf8; border-radius: 4px;"
  value="${escapeHtml(document.getElementById('lab-' + t.key) ? document.getElementById('lab-' + t.key).value : '')}"
  oninput="const target = document.getElementById('lab-${escapeHtml(t.key)}'); if(target) { target.value = this.value; window.Tap2MedLabs.onInput(target); }"
  onchange="window.Tap2MedLabs.clearSearchAndClose()"
/>`"""

# We'll use regex to find the badges.
# Badge structure: `<span ...>...In ...</span>` or the `<input .../>` we already put.
badge_pattern1 = r'`<span style="font-size: 11px; font-weight: 700; color: #[0-9a-fA-F]{6}; background: #[0-9a-fA-F]{6}; padding: 3px 8px; border-radius: 4px; border: 1px solid #[0-9a-fA-F]{6};">\s*[^<]*\s*</span>`'
js = re.sub(badge_pattern1, input_html, js)

badge_pattern2 = r'`<input\s+type="text"\s+placeholder="Enter value\.\.\."\s+class="input"\s+style="width: 110px; height: 28px; font-size: 11\.5px; padding: 2px 6px; border-color: #38bdf8;"\s+oninput="const target = document\.getElementById\(\'lab-\$\{escapeHtml\(t\.key\)\}\'\); if\(target\) \{ target\.value = this\.value; window\.Tap2MedLabs\.onInput\(target\); \}"\s*/>`'
js = re.sub(badge_pattern2, input_html, js)

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

print("Done")
