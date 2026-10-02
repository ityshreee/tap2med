import re

# 1. Update dashboard.html
with open('frontend/clinic/dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

replacement_html = """              <div style="display: flex; align-items: center; gap: 8px">
                <input type="hidden" id="patient-followup" value="3" />
                <input
                  type="number"
                  id="followup-months-input"
                  class="input"
                  placeholder="0"
                  min="0"
                  style="
                    width: 60px;
                    font-size: 14px;
                    background: white;
                    text-align: center;
                  "
                />
                <span style="font-size: 14px; color: var(--text-muted); font-weight: 600;">Months</span>
                
                <input
                  type="number"
                  id="followup-days-input"
                  class="input"
                  placeholder="3"
                  min="0"
                  style="
                    width: 60px;
                    font-size: 14px;
                    background: white;
                    text-align: center;
                  "
                />
                <span style="font-size: 14px; color: var(--text-muted); font-weight: 600;">Days</span>
              </div>"""

# Find the block to replace
html = re.sub(r'<div style="display: flex; align-items: center; gap: 10px">\s*<input\s*type="number"\s*id="patient-followup"[\s\S]*?</div>', replacement_html, html)

# Bump version
html = re.sub(r'dashboard\.css\?v=[a-zA-Z0-9_]*', 'dashboard.css?v=7', html)
html = re.sub(r'dashboard\.js\?v=[a-zA-Z0-9_]*', 'dashboard.js?v=7', html)

with open('frontend/clinic/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update dashboard.js
with open('frontend/assets/js/pages/dashboard.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add conversion logic
conversion_logic = """
// Follow-up conversion logic
document.addEventListener("DOMContentLoaded", () => {
  const monthsInput = document.getElementById("followup-months-input");
  const daysInput = document.getElementById("followup-days-input");
  const hiddenFollowup = document.getElementById("patient-followup");

  function updateHiddenFollowup() {
    if (!monthsInput || !daysInput || !hiddenFollowup) return;
    const months = parseInt(monthsInput.value) || 0;
    const days = parseInt(daysInput.value) || 0;
    hiddenFollowup.value = (months * 30) + days;
    if (typeof savePrescriptionDraft === "function") savePrescriptionDraft();
  }

  if (monthsInput) monthsInput.addEventListener("input", updateHiddenFollowup);
  if (daysInput) daysInput.addEventListener("input", updateHiddenFollowup);
});

window.updateFollowupUI = function(totalDays) {
  const monthsInput = document.getElementById("followup-months-input");
  const daysInput = document.getElementById("followup-days-input");
  if (!monthsInput || !daysInput) return;
  
  totalDays = parseInt(totalDays);
  if (isNaN(totalDays)) totalDays = 3;

  if (totalDays === 0) {
    monthsInput.value = "";
    daysInput.value = "0";
  } else {
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;
    monthsInput.value = months > 0 ? months : "";
    daysInput.value = days > 0 ? days : (months > 0 ? "0" : "3");
  }
};
"""

if 'window.updateFollowupUI' not in js:
    js += conversion_logic

# Update restorePrescriptionDraft
restore_regex = r'(if\s*\(followup\)\s*followup\.value\s*=\s*draft\.followup\s*\|\|\s*"3";)'
restore_replacement = r'\1\n    if (window.updateFollowupUI) window.updateFollowupUI(draft.followup || 3);'
js = re.sub(restore_regex, restore_replacement, js)

# Update editRx
edit_regex = r'(if\s*\(followup\)\s*followup\.value\s*=\s*visit\.follow_up_days\s*\|\|\s*"3";)'
edit_replacement = r'\1\n    if (window.updateFollowupUI) window.updateFollowupUI(visit.follow_up_days || 3);'
js = re.sub(edit_regex, edit_replacement, js)

with open('frontend/assets/js/pages/dashboard.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Done")
