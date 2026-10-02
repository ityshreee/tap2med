import re
import os

file_path = 'frontend/assets/js/print_engine.js'
with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace Vitals, Complaints, Diagnosis
vitals_old = r'const vitalsHtml = data\.vitals\s*\?\s*`<div style="font-size: 13px; color: #334155; margin-bottom: 6px;"><strong>Vitals:</strong> \$\{data\.vitals\}</div>`\s*:\s*"";'
vitals_new = r'const vitalsHtml = data.vitals\n      ? `<div style="font-size: 11px; color: #000000; margin-bottom: 6px; text-transform: uppercase;"><strong>VITALS:</strong> ${data.vitals}</div>`\n      : "";'
js = re.sub(vitals_old, vitals_new, js)

complaints_old = r'const complaintsHtml = data\.complaints\s*\?\s*`<div style="font-size: 13px; color: #334155; margin-bottom: 6px;"><strong>Complaints:</strong> \$\{data\.complaints\}</div>`\s*:\s*"";'
complaints_new = r'const complaintsHtml = data.complaints\n      ? `<div style="font-size: 11px; color: #000000; margin-bottom: 6px; text-transform: uppercase;"><strong>COMPLAINTS:</strong> ${data.complaints}</div>`\n      : "";'
js = re.sub(complaints_old, complaints_new, js)

diagnosis_old = r'const diagnosisHtml = data\.diagnosis\s*\?\s*`<div style="font-size: 14px; color: #0f172a; margin-bottom: 8px;"><strong>Diagnosis:</strong> <span style="font-weight: 700; text-transform: uppercase;">\$\{data\.diagnosis\}</span></div>`\s*:\s*"";'
diagnosis_new = r'const diagnosisHtml = data.diagnosis\n      ? `<div style="font-size: 11px; color: #000000; margin-bottom: 8px; text-transform: uppercase;"><strong>DIAGNOSIS:</strong> <span style="font-weight: 700;">${data.diagnosis}</span></div>`\n      : "";'
js = re.sub(diagnosis_old, diagnosis_new, js)

# Replace Tests Suggested
tests_old = r'\$\{data\.tests \? `<div style="font-size: 13\.5px; color: #0f172a; margin-bottom: 20px; padding: 10px 14px; background: #f8fafc; border-left: 3px solid #0284c7; border-radius: 4px;"><strong>Tests Suggested:</strong> \$\{data\.tests\}</div>` : ""\}'
tests_new = r'${data.tests ? `<div style="font-size: 11px; color: #000000; margin-bottom: 20px; padding: 10px 14px; background: #f8fafc; border-left: 3px solid #000000; border-radius: 4px; text-transform: uppercase;"><strong>TESTS SUGGESTED:</strong> ${data.tests}</div>` : ""}'
js = re.sub(tests_old, tests_new, js)


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
        
        html = re.sub(r'print_engine\.js\?v=[a-zA-Z0-9_]*', 'print_engine.js?v=10', html)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html)

print("Done")
