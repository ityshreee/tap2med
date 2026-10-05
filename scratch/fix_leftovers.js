const fs = require('fs');
let c = fs.readFileSync('frontend/assets/js/pages/dashboard.js', 'utf8');

const fetchStart = c.indexOf('// Intercept fetch');
if (fetchStart !== -1) {
    const fetchEnd = c.indexOf('return response;\r\n};') + 'return response;\r\n};'.length;
    if (fetchEnd > fetchStart) {
        c = c.substring(0, fetchStart) + c.substring(fetchEnd);
    } else {
        const altEnd = c.indexOf('return response;\n};') + 'return response;\n};'.length;
        if (altEnd > fetchStart) c = c.substring(0, fetchStart) + c.substring(altEnd);
    }
}

// Remove the event listeners calling savePrescriptionDraft and updateBMIDisplay
c = c.replace(/document\r?\n\s*\.getElementById\("vital-wt"\)\r?\n\s*\?\.[^;]+;/g, '');
c = c.replace(/document\r?\n\s*\.getElementById\("vital-ht"\)\r?\n\s*\?\.[^;]+;/g, '');

c = c.replace(/if \(typeof savePrescriptionDraft === "function"\) savePrescriptionDraft\(\);/g, '');
c = c.replace(/savePrescriptionDraft\(\);/g, '');

fs.writeFileSync('frontend/assets/js/pages/dashboard.js', c);
console.log('Fixed');
