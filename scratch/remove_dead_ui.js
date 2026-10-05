const fs = require('fs');

function removeFunc(name, c) {
    const rx1 = new RegExp(`^window\\.${name} = (?:async )?function[\\s\\S]*?\\n};\\r?\\n?`, 'gm');
    const rx2 = new RegExp(`^(?:async )?function ${name}[\\s\\S]*?\\n}\\r?\\n?`, 'gm');
    const rx3 = new RegExp(`window\\.${name} = (?:async )?function[\\s\\S]*?\\n};`, 'g');
    const rx4 = new RegExp(`(?:async )?function ${name}[\\s\\S]*?\\n}`, 'g');
    
    let res = c.replace(rx1, '').replace(rx2, '').replace(rx3, '').replace(rx4, '');
    return res;
}

let c = fs.readFileSync('frontend/assets/js/prescription_pad.js', 'utf8');

c = removeFunc('syncTestChips', c);
c = removeFunc('addTestToPrescription', c);
c = removeFunc('removeTestFromPrescription', c);
c = removeFunc('addAllCategoryTests', c);
c = removeFunc('toggleCategoryExpand', c);
c = removeFunc('clearTestSearch', c);
c = removeFunc('toggleTestCategoriesDropdown', c);
c = removeFunc('renderTestsDropdown', c);
c = removeFunc('initTestsDropdownEvents', c);

c = c.replace(/let selectedTests = new Set\(\);\n/, '');
c = c.replace(/let expandedCategoryNames = new Set\(\);\n/, '');

const testListeners = /if \(document\.readyState === "loading"\) \{[\s\S]*?initTestsDropdownEvents\(\);\n\}/;
const tlMatch = c.match(testListeners);
if (tlMatch) c = c.replace(tlMatch[0], '');

fs.writeFileSync('frontend/assets/js/prescription_pad.js', c);
console.log('Removed dead UI functions from prescription_pad.js');
