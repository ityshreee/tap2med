import re

file_path = 'frontend/assets/js/labs.js'
with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Fix toggleCategoryInDropdown unintended replacement
to_remove = """
    const searchInput = document.getElementById("lab-search-input");
    if (searchInput) searchInput.value = "";
    closeSearchDropdown();
    filterLabFields("");"""

target = """    } else {
      expandedDropdownCategories.add(catName);
    }
    const input = document.getElementById("lab-search-input");
    renderSearchDropdown(input ? input.value : "", catName);
""" + to_remove + """
  }"""

replacement = """    } else {
      expandedDropdownCategories.add(catName);
    }
    const input = document.getElementById("lab-search-input");
    renderSearchDropdown(input ? input.value : "", catName);
  }"""

js = js.replace(target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Done")
