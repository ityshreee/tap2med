const fs = require('fs');
let c = fs.readFileSync('frontend/assets/js/pages/dashboard.js', 'utf8');

c = c.replace(/await \r?\n\s*} catch/g, 'await window.QueueManager.loadQueue();\n  } catch');

fs.writeFileSync('frontend/assets/js/pages/dashboard.js', c);
console.log('Fixed await');
