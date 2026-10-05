class PrescriptionPad {
  static getDraftStorageKey(localToken) {
    return `tap2med_consultation_draft_${localToken}`;
  }

  static savePrescriptionDraft() {
    if (!currentLocalToken) return;

    const prescriptionList = document.getElementById("rx-container");
    if (!prescriptionList) return;

    const medicines = [
      ...prescriptionList.querySelectorAll(".prescription-row"),
    ].map((row) => ({
      name: row.querySelector(".rx-med")?.value || "",
      dosage: row.querySelector(".rx-dosage")?.value || "",
      duration: row.querySelector(".rx-days")?.value || "",
      remarks: row.querySelector(".rx-remarks")?.value || "",
      instructions: row.querySelector(".rx-freq")?.value || "",
    }));

    const draft = {
      complaints: document.getElementById("patient-complaints")?.value || "",
      diagnosis: document.getElementById("patient-diagnosis")?.value || "",
      testsSuggested: document.getElementById("patient-tests")?.value || "",
      advice: document.getElementById("patient-advice")?.value || "",
      followup: document.getElementById("patient-followup")?.value || "3",
      medicines,
    };

    const activePatientStorageKey = "tap2med_active_patient_token";
    sessionStorage.setItem(
      PrescriptionPad.getDraftStorageKey(currentLocalToken),
      JSON.stringify(draft),
    );
    sessionStorage.setItem(activePatientStorageKey, currentLocalToken);
  }

  static restorePrescriptionDraft(localToken) {
    if (!localToken) return false;

    try {
      const storedDraft = sessionStorage.getItem(PrescriptionPad.getDraftStorageKey(localToken));
      if (!storedDraft) return false;
      const draft = JSON.parse(storedDraft);

      const complaints = document.getElementById("patient-complaints");
      const diagnosis = document.getElementById("patient-diagnosis");
      const tests = document.getElementById("patient-tests");
      const advice = document.getElementById("patient-advice");
      const followup = document.getElementById("patient-followup");

      if (complaints) complaints.value = draft.complaints || "";
      if (diagnosis) diagnosis.value = draft.diagnosis || "";
      if (tests) tests.value = draft.testsSuggested || "";
      if (window.syncTestChips) window.syncTestChips();
      if (advice) advice.value = draft.advice || "";
      if (followup) followup.value = draft.followup || "3";
      if (window.updateFollowupUI) window.updateFollowupUI(draft.followup || 3);

      PrescriptionPad.populatePrescriptionPad(draft.medicines);
      return true;
    } catch (error) {
      sessionStorage.removeItem(PrescriptionPad.getDraftStorageKey(localToken));
      return false;
    }
  }

  static removePrescriptionRow(btn) {
    const row = btn.closest(".prescription-row");
    if (row) {
      row.remove();
      PrescriptionPad.updateRowNumbers();
      PrescriptionPad.savePrescriptionDraft();
    }
  }

  static updateRowNumbers() {
    const container = document.getElementById("rx-container");
    if (!container) return;
    const rows = container.querySelectorAll(".prescription-row");
    rows.forEach((row, index) => {
      const idxEl = row.querySelector(".rx-index");
      if (idxEl) idxEl.textContent = index + 1;
    });
  }

  static handleOtherToggle(selectEl) {
    if (selectEl.value === "__OTHER__") {
      const wrapper = selectEl.closest(".rx-dropdown-wrap");
      if (wrapper) {
        const customContainer = wrapper.querySelector(".rx-custom-container");
        const customInput = wrapper.querySelector(".rx-custom-input");
        selectEl.style.display = "none";
        if (customContainer) customContainer.style.display = "block";
        if (customInput) {
          customInput.value = "";
          customInput.focus();
        }
      }
    }
    PrescriptionPad.updateFreq(selectEl);
  }

  static revertToSelect(btn) {
    const wrapper = btn.closest(".rx-dropdown-wrap");
    if (wrapper) {
      const selectEl = wrapper.querySelector("select");
      const customContainer = wrapper.querySelector(".rx-custom-container");
      const customInput = wrapper.querySelector(".rx-custom-input");
      if (customInput) customInput.value = "";
      if (customContainer) customContainer.style.display = "none";
      if (selectEl) {
        selectEl.style.display = "block";
        selectEl.value = "";
        PrescriptionPad.updateFreq(selectEl);
      }
    }
  }

  static updateFreq(el) {
    const row = el.closest(".prescription-row");
    if (!row) return;

    const dose = row.querySelector(".rx-dose")?.value.trim() || "";

    let when = "";
    const whenSelect = row.querySelector(".rx-when");
    const whenCustom = row.querySelector(".rx-when-custom");
    if (
      whenSelect &&
      whenSelect.value === "__OTHER__" &&
      whenCustom &&
      whenCustom.value.trim()
    ) {
      when = whenCustom.value.trim();
    } else if (whenSelect && whenSelect.value !== "__OTHER__") {
      when = whenSelect.value;
    }

    let freq = "";
    const freqSelect = row.querySelector(".rx-freq-select");
    const freqCustom = row.querySelector(".rx-freq-custom");
    if (
      freqSelect &&
      freqSelect.value === "__OTHER__" &&
      freqCustom &&
      freqCustom.value.trim()
    ) {
      freq = freqCustom.value.trim();
    } else if (freqSelect && freqSelect.value !== "__OTHER__") {
      freq = freqSelect.value;
    }

    const days = row.querySelector(".rx-days")?.value.trim() || "";
    const remarks = row.querySelector(".rx-remarks")?.value.trim() || "";

    let dosageParts = [];
    if (dose) dosageParts.push(dose);
    if (freq) dosageParts.push(freq);
    if (when) dosageParts.push(`(${when})`);

    let dosageStr = dosageParts.join(" ");
    if (days) {
      dosageStr += (dosageStr ? " for " : "") + days;
    }

    const dosageHidden = row.querySelector(".rx-dosage");
    if (dosageHidden) dosageHidden.value = dosageStr;

    let fullInstructions = dosageStr;
    if (remarks) {
      fullInstructions += (fullInstructions ? " | " : "") + remarks;
    }

    const freqHidden = row.querySelector(".rx-freq");
    if (freqHidden) freqHidden.value = fullInstructions;
  }

  static addPrescriptionRow() {
    const container = document.getElementById("rx-container");
    if (!container) return;
    const count = container.querySelectorAll(".prescription-row").length + 1;

    const row = document.createElement("div");
    row.className = "prescription-row";
    row.style.display = "grid";
    row.style.gridTemplateColumns =
      "22px 64px minmax(100px, 2fr) 44px 86px 82px 60px minmax(80px, 1.2fr) 26px";
    row.style.gap = "5px";
    row.style.padding = "5px 6px";
    row.style.borderBottom = "1px solid #f1f5f9";
    row.style.alignItems = "center";
    row.style.width = "100%";
    row.style.minWidth = "0";
    row.style.boxSizing = "border-box";

    row.innerHTML = `
      <div class="rx-index" style="min-width: 0; font-size: 11px; font-weight: 700; color: #64748b; text-align: center;">${count}</div>
      <div class="rx-dropdown-wrap" style="min-width: 0; position: relative;">
        <select class="input rx-type" onchange="window.handleOtherToggle(this)" style="min-width: 0; height: 32px; padding: 4px 2px 4px 4px; font-size: 11.5px; font-weight: 600; background: white; width: 100%; box-sizing: border-box;">
          <option value="" selected></option>
          <option value="TAB">TAB</option>
          <option value="CAP">CAP</option>
          <option value="SYP">SYP</option>
          <option value="INJ">INJ</option>
          <option value="OINT">OINT</option>
          <option value="GEL">GEL</option>
          <option value="CRM">CRM</option>
          <option value="DROPS">DROPS</option>
          <option value="SUSP">SUSP</option>
          <option value="INH">INH</option>
          <option value="RESP">RESP</option>
          <option value="POW">POW</option>
          <option value="LOT">LOT</option>
          <option value="SACH">SACH</option>
          <option value="__OTHER__">+ Other</option>
        </select>
        <div class="rx-custom-container" style="display: none; width: 100%; position: relative;">
          <input type="text" class="input rx-custom-input rx-type-custom" placeholder="Type" style="min-width: 0; height: 32px; padding: 4px 18px 4px 4px; font-size: 11.5px; font-weight: 600; width: 100%; box-sizing: border-box;" oninput="window.updateFreq(this)" />
          <span onclick="window.revertToSelect(this)" title="Back to dropdown" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #94a3b8; font-size: 11px; font-weight: bold;">✕</span>
        </div>
      </div>
      <div style="min-width: 0;">
        <input type="text" class="input rx-med" placeholder="Medicine Name" autocomplete="off" oninput="window.updateFreq(this)" style="min-width: 0; height: 32px; padding: 4px 6px; font-size: 12px; font-weight: 600; width: 100%; box-sizing: border-box;" />
      </div>
      <div style="min-width: 0;">
        <input type="text" class="input rx-dose" placeholder="1" autocomplete="off" oninput="window.updateFreq(this)" style="min-width: 0; height: 32px; padding: 4px 2px; font-size: 12px; text-align: center; width: 100%; box-sizing: border-box;" />
      </div>
      <div class="rx-dropdown-wrap" style="min-width: 0; position: relative;">
        <select class="input rx-when" onchange="window.handleOtherToggle(this)" style="min-width: 0; height: 32px; padding: 4px 2px 4px 4px; font-size: 11.5px; background: white; width: 100%; box-sizing: border-box;">
          <option value="" selected></option>
          <option value="After Food">After Food</option>
          <option value="Before Food">Before Food</option>
          <option value="With Food">With Food</option>
          <option value="Empty Stomach">Empty Stomach</option>
          <option value="At Bedtime">At Bedtime</option>
          <option value="Anytime">Anytime</option>
          <option value="__OTHER__">+ Other</option>
        </select>
        <div class="rx-custom-container" style="display: none; width: 100%; position: relative;">
          <input type="text" class="input rx-custom-input rx-when-custom" placeholder="e.g. 4h" style="min-width: 0; height: 32px; padding: 4px 18px 4px 4px; font-size: 11.5px; width: 100%; box-sizing: border-box;" oninput="window.updateFreq(this)" />
          <span onclick="window.revertToSelect(this)" title="Back to dropdown" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #94a3b8; font-size: 11px; font-weight: bold;">✕</span>
        </div>
      </div>
      <div class="rx-dropdown-wrap" style="min-width: 0; position: relative;">
        <select class="input rx-freq-select" onchange="window.handleOtherToggle(this)" style="min-width: 0; height: 32px; padding: 4px 2px 4px 4px; font-size: 11.5px; background: white; width: 100%; box-sizing: border-box;">
          <option value="" selected></option>
          <option value="1-0-1">1-0-1</option>
          <option value="1-1-1">1-1-1</option>
          <option value="1-0-0">1-0-0</option>
          <option value="0-0-1">0-0-1</option>
          <option value="0-1-0">0-1-0</option>
          <option value="1-0-1-0">1-0-1-0</option>
          <option value="Once Daily">Once Daily</option>
          <option value="Twice Daily">Twice Daily</option>
          <option value="Thrice Daily">Thrice Daily</option>
          <option value="SOS">SOS</option>
          <option value="Alternate Days">Alternate Days</option>
          <option value="Weekly">Weekly</option>
          <option value="__OTHER__">+ Other</option>
        </select>
        <div class="rx-custom-container" style="display: none; width: 100%; position: relative;">
          <input type="text" class="input rx-custom-input rx-freq-custom" placeholder="e.g. 1-0-1-1" style="min-width: 0; height: 32px; padding: 4px 18px 4px 4px; font-size: 11.5px; width: 100%; box-sizing: border-box;" oninput="window.updateFreq(this)" />
          <span onclick="window.revertToSelect(this)" title="Back to dropdown" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #94a3b8; font-size: 11px; font-weight: bold;">✕</span>
        </div>
      </div>
      <div style="min-width: 0;">
        <input type="text" class="input rx-days" placeholder="5 Days" autocomplete="off" oninput="window.updateFreq(this)" style="min-width: 0; height: 32px; padding: 4px 2px; font-size: 12px; text-align: center; width: 100%; box-sizing: border-box;" />
      </div>
      <div style="min-width: 0;">
        <input type="text" class="input rx-remarks" placeholder="Notes (optional)" autocomplete="off" oninput="window.updateFreq(this)" style="min-width: 0; height: 32px; padding: 4px 6px; font-size: 12px; width: 100%; box-sizing: border-box;" />
      </div>
      <div style="min-width: 0; text-align: center;">
        <button type="button" class="btn btn-ghost" onclick="window.removePrescriptionRow(this)" style="color: #ef4444; padding: 0; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 12px;" title="Remove row">✕</button>
      </div>
      <input type="hidden" class="rx-freq" />
      <input type="hidden" class="rx-dosage" />
    `;
    
    row.setAttribute("draggable", "true");
    row.addEventListener("dragstart", (e) => {
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingRow = container.querySelector(".dragging");
      if (!draggingRow || draggingRow === row) return;
      const bounding = row.getBoundingClientRect();
      const offset = e.clientY - bounding.top;
      if (offset > bounding.height / 2) {
        row.after(draggingRow);
      } else {
        row.before(draggingRow);
      }
    });
    row.addEventListener("drop", (e) => {
      e.preventDefault();
    });
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      PrescriptionPad.updateRowNumbers();
      PrescriptionPad.savePrescriptionDraft();
    });

    container.appendChild(row);
    PrescriptionPad.updateFreq(row.querySelector(".rx-med"));
  }

  static populatePrescriptionPad(prescriptions) {
    const container = document.getElementById("rx-container");
    if (!container) return;

    container.innerHTML = "";
    if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
      PrescriptionPad.addPrescriptionRow();
      return;
    }

    const typesList = [
      "TAB", "CAP", "SYP", "INJ", "OINT", "GEL", "CRM", "DROPS",
      "SUSP", "INH", "RESP", "POW", "LOT", "SACH",
    ];

    prescriptions.forEach((med) => {
      PrescriptionPad.addPrescriptionRow();
      const row = container.lastElementChild;
      let name = (med.name || "").trim();

      let detectedType = null;
      for (const t of typesList) {
        const regex = new RegExp(`^${t}\\.?\\s*`, "i");
        if (regex.test(name)) {
          detectedType = t;
          name = name.replace(regex, "");
          break;
        }
      }

      const typeSelect = row.querySelector(".rx-type");
      const typeWrap = typeSelect?.closest(".rx-dropdown-wrap");
      const typeCustom = typeWrap?.querySelector(".rx-type-custom");
      const typeCustomCont = typeWrap?.querySelector(".rx-custom-container");

      if (detectedType) {
        if (typeSelect) typeSelect.value = detectedType;
      } else {
        const prefixMatch = name.match(/^([A-Za-z0-9]+)\.\s*(.*)/);
        if (prefixMatch) {
          if (typeSelect) {
            typeSelect.value = "__OTHER__";
            typeSelect.style.display = "none";
          }
          if (typeCustomCont) typeCustomCont.style.display = "block";
          if (typeCustom) typeCustom.value = prefixMatch[1].toUpperCase();
          name = prefixMatch[2];
        } else {
          if (typeSelect) typeSelect.value = "";
        }
      }

      if (row.querySelector(".rx-med")) row.querySelector(".rx-med").value = name;

      let fullInstructions = med.instructions || "";
      let remarks = "";
      let dosage = med.dosage || "";
      let days = med.duration || "";

      if (fullInstructions.includes(" | ")) {
        const parts = fullInstructions.split(" | ");
        dosage = parts[0].trim();
        remarks = parts.slice(1).join(" | ").trim();
      } else {
        dosage = fullInstructions.trim();
      }

      if (dosage.includes(" for ")) {
        const dParts = dosage.split(" for ");
        dosage = dParts[0].trim();
        days = dParts[1].trim();
      }

      const whenOptions = [
        "After Food", "Before Food", "With Food", "Empty Stomach", "At Bedtime", "Anytime",
      ];
      let detectedWhen = "";
      for (const w of whenOptions) {
        if (dosage.includes(w)) {
          detectedWhen = w;
          dosage = dosage.replace(`(${w})`, "").replace(w, "").trim();
          break;
        }
      }
      if (!detectedWhen) {
        const parenMatch = dosage.match(/\((.*?)\)/);
        if (parenMatch) {
          detectedWhen = parenMatch[1].trim();
          dosage = dosage.replace(parenMatch[0], "").trim();
        }
      }

      const freqOptions = [
        "1-0-1-0", "1-0-1", "1-1-1", "1-0-0", "0-0-1", "0-1-0",
        "Once Daily", "Twice Daily", "Thrice Daily", "SOS / As needed",
        "SOS", "Alternate Days", "Weekly",
      ];
      let detectedFreq = "";
      for (const f of freqOptions) {
        if (dosage.includes(f)) {
          detectedFreq = f === "SOS / As needed" ? "SOS" : f;
          dosage = dosage.replace(f, "").trim();
          break;
        }
      }

      if (row.querySelector(".rx-dose"))
        row.querySelector(".rx-dose").value = dosage.trim();

      const whenSelect = row.querySelector(".rx-when");
      const whenWrap = whenSelect?.closest(".rx-dropdown-wrap");
      const whenCustom = whenWrap?.querySelector(".rx-when-custom");
      const whenCustomCont = whenWrap?.querySelector(".rx-custom-container");

      if (detectedWhen) {
        if (whenOptions.includes(detectedWhen)) {
          if (whenSelect) whenSelect.value = detectedWhen;
        } else {
          if (whenSelect) {
            whenSelect.value = "__OTHER__";
            whenSelect.style.display = "none";
          }
          if (whenCustomCont) whenCustomCont.style.display = "block";
          if (whenCustom) whenCustom.value = detectedWhen;
        }
      } else {
        if (whenSelect) whenSelect.value = "";
      }

      const freqSelect = row.querySelector(".rx-freq-select");
      const freqWrap = freqSelect?.closest(".rx-dropdown-wrap");
      const freqCustom = freqWrap?.querySelector(".rx-freq-custom");
      const freqCustomCont = freqWrap?.querySelector(".rx-custom-container");

      if (detectedFreq) {
        if (freqSelect) freqSelect.value = detectedFreq;
      } else {
        if (freqSelect) freqSelect.value = "";
      }

      if (row.querySelector(".rx-days"))
        row.querySelector(".rx-days").value = days;
      if (row.querySelector(".rx-remarks"))
        row.querySelector(".rx-remarks").value = remarks;

      PrescriptionPad.updateFreq(row.querySelector(".rx-med"));
    });
    PrescriptionPad.updateRowNumbers();
  }

  static clearPrescription() {
    const prescriptionList = document.getElementById("rx-container");
    if (prescriptionList) prescriptionList.innerHTML = "";
    PrescriptionPad.addPrescriptionRow();
    
    const cEl = document.getElementById("patient-complaints");
    const dEl = document.getElementById("patient-diagnosis");
    const tEl = document.getElementById("patient-tests");
    const aEl = document.getElementById("patient-advice");
    const fEl = document.getElementById("patient-followup");
    
    if (cEl) cEl.value = "";
    if (dEl) dEl.value = "";
    if (tEl) tEl.value = "";
    if (aEl) aEl.value = "";
    if (fEl) fEl.value = "3";
    
    PrescriptionPad.updateRowNumbers();
    if (typeof setPrescriptionStatus === "function") {
      setPrescriptionStatus("Waiting...", "warning");
    }
    if (window.syncTestChips) window.syncTestChips();
  }
}

window.PrescriptionPad = PrescriptionPad;

// Bind methods to the window object so inline HTML onclick handlers still work
window.addPrescriptionRow = PrescriptionPad.addPrescriptionRow;
window.removePrescriptionRow = PrescriptionPad.removePrescriptionRow;
window.handleOtherToggle = PrescriptionPad.handleOtherToggle;
window.revertToSelect = PrescriptionPad.revertToSelect;
window.updateFreq = PrescriptionPad.updateFreq;
window.savePrescriptionDraft = PrescriptionPad.savePrescriptionDraft;
window.restorePrescriptionDraft = PrescriptionPad.restorePrescriptionDraft;
window.populatePrescriptionPad = PrescriptionPad.populatePrescriptionPad;
window.clearPrescription = PrescriptionPad.clearPrescription;
window.updateRowNumbers = PrescriptionPad.updateRowNumbers;
