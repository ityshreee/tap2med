const fs = require('fs');
let c = fs.readFileSync('frontend/assets/js/vitals_engine.js', 'utf8');
const func = `
  static async fetchActiveVitals() {
    if (!currentLocalToken) return;
    try {
      const data = await ApiClient.request(\`/api/clinics/queue/\${clinicId}\`);
      const activePatient = data.queue.find(
        (p) => p.local_token === currentLocalToken,
      );
      const display = document.getElementById("doctor-vitals-display");
      if(!display) return;

      if (activePatient && activePatient.vitals) {
        const v = activePatient.vitals;
        let compiled = [];
        if (v.bp_sys && v.bp_dia) compiled.push(\`BP: \${v.bp_sys}/\${v.bp_dia}\`);
        if (v.pr) compiled.push(\`PR: \${v.pr} bpm\`);
        if (v.wt) compiled.push(\`Wt: \${v.wt} kg\`);
        if (v.ht) compiled.push(\`Ht: \${v.ht} cm\`);
        const bmi = window.VitalsEngine ? VitalsEngine.calculateBMI(v.wt, v.ht) : null;
        if (bmi !== null) compiled.push(\`BMI: \${bmi.toFixed(1)}\`);
        if (v.temp) compiled.push(\`T: \${v.temp} °F\`);
        if (v.spo2) compiled.push(\`SpO2: \${v.spo2}%\`);

        const displayWeight = compiled.join(" | ");
        if (displayWeight) {
          display.style.display = "block";
          display.innerHTML = \`<strong style="color: #475569;">Recorded Vitals:</strong> <span style="color: var(--primary-color); font-weight: 600;">\${displayWeight}</span>\`;
        } else {
          display.style.display = "none";
        }
      } else {
        display.style.display = "none";
      }
    } catch (e) {
        console.error("Failed to fetch vitals", e);
    }
  }
`;
c = c.replace(/}\s*window\.VitalsEngine/, func + '\n}\nwindow.VitalsEngine');
c += '\nwindow.fetchActiveVitals = VitalsEngine.fetchActiveVitals;';
fs.writeFileSync('frontend/assets/js/vitals_engine.js', c);
