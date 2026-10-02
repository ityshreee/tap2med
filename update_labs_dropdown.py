import re
import os

file_path = 'frontend/assets/js/labs.js'
with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

input_html = """`<input 
  type="text" 
  placeholder="Enter value" 
  class="input"
  style="width: 100px; height: 28px; font-size: 12px; padding: 2px 6px; border: 1.5px solid #38bdf8; border-radius: 4px;"
  value="${escapeHtml(document.getElementById('lab-' + t.key) ? document.getElementById('lab-' + t.key).value : '')}"
  oninput="const target = document.getElementById('lab-${escapeHtml(t.key)}'); if(target) { target.value = this.value; window.Tap2MedLabs.onInput(target); }"
  onchange="window.Tap2MedLabs.clearSearchAndClose()"
/>`"""

# 1. Section 0 replacement
button_pattern = r'`\s*<button\s+type="button"\s+onclick="window\.Tap2MedLabs\.focusTestInput\(\'\$\{escapeHtml\(t\.key\)\}\'\)"\s+class="btn"\s+style="background: #[a-f0-9]{6}; color: white; border: none; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 5px; cursor: pointer;"\s*>\s*.*?View in Flowsheet\s*</button>\s*`'
js = re.sub(button_pattern, input_html, js, flags=re.IGNORECASE)

# 2. Section 1 and 2 replacement
# In Section 1 and 2, it is `isAdded || isStandard ? ... : ...`.
# My previous replacement already replaced the spans with `<input ... />`, but with a different HTML string.
old_input = r'`<input\s+type="text"\s+placeholder="Enter value\.\.\."\s+class="input"\s+style="width: 110px; height: 28px; font-size: 11\.5px; padding: 2px 6px; border-color: #38bdf8;"\s+oninput="const target = document\.getElementById\(\'lab-\$\{escapeHtml\(t\.key\)\}\'\); if\(target\) \{ target\.value = this\.value; window\.Tap2MedLabs\.onInput\(target\); \}"\s*/>`'
js = re.sub(old_input, input_html, js)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Done replacing Section 0 button and previous inputs.")
