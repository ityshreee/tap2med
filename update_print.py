import re
import os

# 1. Update print_engine.js
file_path = 'frontend/assets/js/print_engine.js'
with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace medsHtml colors and padding
# We can use regex to replace all color: #[a-f0-9]+ to color: #000000 inside the medsHtml template string
# But it's safer to just do a precise replace for the medsHtml block.

# First, replace the table padding "8px 8px" to "6px 4px" and "8px 6px" to "6px 4px"
medsHtml_regex = r'(medsHtml \+= `\s*<tr[\s\S]*?</tr>\s*`;)'

def update_meds_html(match):
    block = match.group(1)
    # Replace padding
    block = block.replace('padding: 8px 8px;', 'padding: 6px 4px;')
    block = block.replace('padding: 8px 6px;', 'padding: 6px 4px;')
    # Replace colors
    block = re.sub(r'color:\s*#[a-fA-F0-9]{6};', 'color: #000000;', block)
    # Replace font size of medicine name
    block = block.replace('font-size: 13px;', 'font-size: 12px;')
    return block

js = re.sub(medsHtml_regex, update_meds_html, js)

# Replace table font-size
js = js.replace('font-size: 12.5px;', 'font-size: 11px;')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(js)


# 2. Update version bump in HTML files
html_files = [
    'frontend/clinic/dashboard.html',
    'frontend/clinic/directory.html',
    'frontend/clinic/staff_dashboard.html'
]

for html_file in html_files:
    if os.path.exists(html_file):
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        
        html = re.sub(r'print_engine\.js\?v=[a-zA-Z0-9_]*', 'print_engine.js?v=8', html)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html)

print("Done")
