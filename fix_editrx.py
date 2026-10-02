import re

with open('frontend/assets/js/pages/dashboard.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Update editRx
edit_regex = r'(if\s*\(fEl\)\s*fEl\.value\s*=\s*visit\.follow_up_days\s*!==\s*null\s*&&\s*visit\.follow_up_days\s*!==\s*undefined\s*\?\s*visit\.follow_up_days\s*:\s*"3";)'
edit_replacement = r'\1\n    if (window.updateFollowupUI) window.updateFollowupUI(visit.follow_up_days !== null && visit.follow_up_days !== undefined ? visit.follow_up_days : 3);'
js = re.sub(edit_regex, edit_replacement, js)

with open('frontend/assets/js/pages/dashboard.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Done")
