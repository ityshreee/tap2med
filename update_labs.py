import re
import os

file_path = 'frontend/assets/js/labs.js'
with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

clear_code = """
    const searchInput = document.getElementById("lab-search-input");
    if (searchInput) searchInput.value = "";
    closeSearchDropdown();
    filterLabFields("");
"""

# For addCatalogTest
js = re.sub(
    r'(function addCatalogTest[^}]*\}\s*)(\n\n  function addAllCategoryTests)',
    r'\1' + clear_code + r'\2',
    js
)
# Wait, addCatalogTest is at 3492, ends at 3514. 3517 is addAllCategoryTests.
# Let's use string replace.

def replace_before(target, to_insert, original):
    if target in original:
        return original.replace(target, to_insert + target)
    return original

# 1. End of addCatalogTest
# The end of addCatalogTest is:
#     if (btnEl) {
#       btnEl.outerHTML = `<input ... />`;
#     }
#   }
# Wait, in original it was `span`. So it's:
#     if (btnEl) {
#       btnEl.outerHTML = `
#         <span style="font-size: 11px; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 4px; border: 1px solid #bae6fd;">
#           ✓ In Profile
#         </span>
#       `;
#     }
#   }
# I will append `clear_code` right before the `}` that closes `addCatalogTest`.

js = js.replace("""    if (btnEl) {
      btnEl.outerHTML = `
        <span style="font-size: 11px; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 4px; border: 1px solid #bae6fd;">
          ✓ In Profile
        </span>
      `;
    }
  }""", """    if (btnEl) {
      btnEl.outerHTML = `
        <span style="font-size: 11px; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 4px; border: 1px solid #bae6fd;">
          ✓ In Profile
        </span>
      `;
    }
""" + clear_code + """  }""")

# 2. End of addAllCategoryTests
#   const input = document.getElementById("lab-search-input");
#   renderSearchDropdown(input ? input.value : "", catName);
# }
js = js.replace("""    const input = document.getElementById("lab-search-input");
    renderSearchDropdown(input ? input.value : "", catName);
  }""", """    const input = document.getElementById("lab-search-input");
    renderSearchDropdown(input ? input.value : "", catName);
""" + clear_code + """  }""")

# 3. End of submitInlineCustomTest
#     persistPatientTest(
#       ...
#     );
#
#     closeSearchDropdown();
#   }
js = js.replace("""    persistPatientTest(
      {
        key: key,
        name: name,
        category: category,
        unit: unit,
        min: min,
        max: max,
        isCustom: true,
      },
      initVal,
    );

    closeSearchDropdown();
  }""", """    persistPatientTest(
      {
        key: key,
        name: name,
        category: category,
        unit: unit,
        min: min,
        max: max,
        isCustom: true,
      },
      initVal,
    );
""" + clear_code + """  }""")

input_html = """`<input 
  type="text" 
  placeholder="Enter value..." 
  class="input"
  style="width: 110px; height: 28px; font-size: 11.5px; padding: 2px 6px; border-color: #38bdf8;"
  oninput="const target = document.getElementById('lab-${escapeHtml(t.key)}'); if(target) { target.value = this.value; window.Tap2MedLabs.onInput(target); }"
/>`"""

# Replace badge HTML in renderSearchDropdown.
badge_pattern = r'`\s*<span style="font-size: 11px; font-weight: 700; color: #[a-fA-F0-9]{6}; background: #[a-fA-F0-9]{6}; padding: 3px 8px; border-radius: 4px; border: 1px solid #[a-fA-F0-9]{6};">\s*.*?In (?:Flowsheet|Profile|Added).*?\s*</span>\s*`'
js = re.sub(badge_pattern, input_html, js, flags=re.IGNORECASE)

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
        
        html = re.sub(r'labs\.js\?v=[a-zA-Z0-9_]*', 'labs.js?v=11', html)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html)

print("Done")
