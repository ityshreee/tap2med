import re

file_path = 'frontend/assets/js/labs.js'
with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

target = """      initVal,
    );
  }"""
replacement = """      initVal,
    );
    window.Tap2MedLabs.clearSearchAndClose();
  }"""

js = js.replace(target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(js)
