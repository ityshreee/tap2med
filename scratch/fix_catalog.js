const fs = require('fs');
let c = fs.readFileSync('frontend/assets/js/prescription_pad.js', 'utf8');

const match = c.match(/const LAB_TEST_CATALOG = \[[^;]+;/);
if (match) {
    c = c.replace(match[0], '');
}

c = c.replace(/LAB_TEST_CATALOG/g, 'window.Tap2MedLabs.ALL_TESTS');

fs.writeFileSync('frontend/assets/js/prescription_pad.js', c);
console.log('Removed duplicate catalog');
