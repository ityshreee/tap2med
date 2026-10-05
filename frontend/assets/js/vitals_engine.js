class VitalsEngine {
  static calculateBMI(weight, height) {
    const weightKg = Number.parseFloat(weight);
    const heightCm = Number.parseFloat(height);
    if (
      !Number.isFinite(weightKg) ||
      !Number.isFinite(heightCm) ||
      weightKg <= 0 ||
      heightCm <= 0
    ) {
      return null;
    }
    const heightMeters = heightCm / 100;
    return weightKg / (heightMeters * heightMeters);
  }

  static updateBMIDisplay() {
    const bmiDisplay = document.getElementById("vital-bmi");
    if (!bmiDisplay) return;
    const bmi = VitalsEngine.calculateBMI(
      document.getElementById("vital-wt")?.value,
      document.getElementById("vital-ht")?.value,
    );
    bmiDisplay.textContent = bmi === null ? "--" : bmi.toFixed(1);
  }

  static async openVitalsModal() {
    document.getElementById("vitals-modal").style.display = "flex";
    [
      "bp-sys",
      "bp-dia",
      "pr",
      "wt",
      "ht",
      "temp",
      "spo2",
      "waist",
      "hip",
    ].forEach((id) => {
      document.getElementById(`vital-${id}`).value = "";
    });
    VitalsEngine.updateBMIDisplay();

    try {
      const data = await ApiClient.request(`/api/clinics/queue/${clinicId}`);
      const activePatient = data.queue.find(
        (p) => p.local_token === currentLocalToken,
      );

      if (activePatient && activePatient.vitals) {
        const v = activePatient.vitals;
        document.getElementById("vital-bp-sys").value = v.bp_sys || "";
        document.getElementById("vital-bp-dia").value = v.bp_dia || "";
        document.getElementById("vital-pr").value = v.pr || "";
        document.getElementById("vital-wt").value = v.wt || "";
        document.getElementById("vital-ht").value = v.ht || "";
        VitalsEngine.updateBMIDisplay();
        document.getElementById("vital-temp").value = v.temp || "";
        document.getElementById("vital-spo2").value = v.spo2 || "";
        document.getElementById("vital-waist").value = v.waist || "";
        document.getElementById("vital-hip").value = v.hip || "";
      }
    } catch (e) {
        console.error(e);
    }
  }

  static closeVitalsModal() {
    document.getElementById("vitals-modal").style.display = "none";
  }

  static async submitVitals() {
    const payload = {
      bp_sys: document.getElementById("vital-bp-sys").value.trim() || null,
      bp_dia: document.getElementById("vital-bp-dia").value.trim() || null,
      pr: document.getElementById("vital-pr").value.trim() || null,
      wt: document.getElementById("vital-wt").value.trim() || null,
      ht: document.getElementById("vital-ht").value.trim() || null,
      temp: document.getElementById("vital-temp").value.trim() || null,
      spo2: document.getElementById("vital-spo2").value.trim() || null,
      waist: document.getElementById("vital-waist").value.trim() || null,
      hip: document.getElementById("vital-hip").value.trim() || null,
    };

    try {
      const data = await ApiClient.request(`/api/clinics/queue/${clinicId}`);
      const activePatient = data.queue.find(
        (p) => p.local_token === currentLocalToken,
      );
      payload.is_paid =
        activePatient && activePatient.vitals && activePatient.vitals.is_paid
          ? true
          : false;

      await ApiClient.request("/api/events/vitals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinicId,
          local_token: currentLocalToken,
          vitals: payload,
        }),
      });

      VitalsEngine.closeVitalsModal();
      if (window.QueueManager) {
        QueueManager.fetchActiveVitals();
      }
      if (window.ToastUI) {
        ToastUI.showSuccess("Vitals saved successfully");
      }
    } catch (e) {
      if (window.ToastUI) {
          ToastUI.showError("Failed to save vitals.");
      }
      console.error(e);
    }
  }

  static async fetchActiveVitals() {
    if (!currentLocalToken) return;
    try {
      const data = await ApiClient.request(`/api/clinics/queue/${clinicId}`);
      const activePatient = data.queue.find(
        (p) => p.local_token === currentLocalToken,
      );
      const display = document.getElementById("doctor-vitals-display");
      if(!display) return;

      if (activePatient && activePatient.vitals) {
        const v = activePatient.vitals;
        let compiled = [];
        if (v.bp_sys && v.bp_dia) compiled.push(`BP: ${v.bp_sys}/${v.bp_dia}`);
        if (v.pr) compiled.push(`PR: ${v.pr} bpm`);
        if (v.wt) compiled.push(`Wt: ${v.wt} kg`);
        if (v.ht) compiled.push(`Ht: ${v.ht} cm`);
        const bmi = window.VitalsEngine ? VitalsEngine.calculateBMI(v.wt, v.ht) : null;
        if (bmi !== null) compiled.push(`BMI: ${bmi.toFixed(1)}`);
        if (v.temp) compiled.push(`T: ${v.temp} °F`);
        if (v.spo2) compiled.push(`SpO2: ${v.spo2}%`);

        const displayWeight = compiled.join(" | ");
        if (displayWeight) {
          display.style.display = "block";
          display.innerHTML = `<strong style="color: #475569;">Recorded Vitals:</strong> <span style="color: var(--primary-color); font-weight: 600;">${displayWeight}</span>`;
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

}
window.VitalsEngine = VitalsEngine;
window.calculateBMI = VitalsEngine.calculateBMI;
window.updateBMIDisplay = VitalsEngine.updateBMIDisplay;
window.openVitalsModal = VitalsEngine.openVitalsModal;
window.closeVitalsModal = VitalsEngine.closeVitalsModal;
window.submitVitals = VitalsEngine.submitVitals;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("vital-wt")?.addEventListener("input", VitalsEngine.updateBMIDisplay);
    document.getElementById("vital-ht")?.addEventListener("input", VitalsEngine.updateBMIDisplay);
});

window.fetchActiveVitals = VitalsEngine.fetchActiveVitals;