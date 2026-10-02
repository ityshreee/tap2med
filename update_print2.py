import re
import os

file_path = 'frontend/assets/js/print_engine.js'
with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Reduce table base font and padding
js = js.replace('font-size: 11px;', 'font-size: 10px;')
js = js.replace('padding: 8px 6px;', 'padding: 4px 3px;')
js = js.replace('padding: 8px 8px;', 'padding: 4px 3px;')
js = js.replace('padding: 6px 4px;', 'padding: 4px 3px;')

# 2. Reduce medicine name font size
js = js.replace('font-size: 12px;', 'font-size: 10px;')

# 3. Optimize column widths
headers_old = """          <tr style="border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; background-color: #f8fafc;">
           <th style="padding: 4px 3px; font-weight: 700; width: 26px; text-align: center; color: #1e293b;">#</th>
           <th style="padding: 4px 3px; font-weight: 700; color: #1e293b;">Medicine</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 12%; text-align: center; color: #1e293b;">Dosage</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 15%; color: #1e293b;">When</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 13%; text-align: center; color: #1e293b;">Frequency</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 12%; text-align: center; color: #1e293b;">Duration</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 18%; color: #1e293b;">Instructions</th>
          </tr>"""

headers_new = """          <tr style="border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; background-color: #f8fafc;">
           <th style="padding: 4px 3px; font-weight: 700; width: 3%; text-align: center; color: #1e293b;">#</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 30%; color: #1e293b;">Medicine</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 10%; text-align: center; color: #1e293b;">Dosage</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 12%; color: #1e293b;">When</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 11%; text-align: center; color: #1e293b;">Frequency</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 10%; text-align: center; color: #1e293b;">Duration</th>
           <th style="padding: 4px 3px; font-weight: 700; width: 24%; color: #1e293b;">Instructions</th>
          </tr>"""

if headers_old in js:
    js = js.replace(headers_old, headers_new)
else:
    print("Warning: headers_old not found in JS.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(js)

# 4. Version Bump
html_files = [
    'frontend/clinic/dashboard.html',
    'frontend/clinic/directory.html',
    'frontend/clinic/staff_dashboard.html'
]

for html_file in html_files:
    if os.path.exists(html_file):
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        
        html = re.sub(r'print_engine\.js\?v=[a-zA-Z0-9_]*', 'print_engine.js?v=9', html)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html)

print("Done")
