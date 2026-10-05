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


const LAB_TEST_CATALOG = [
  {
    category: "Haematology",
    icon: "🩸",
    aliases: [
      "hematology",
      "haem",
      "hem",
      "blood",
      "cbc",
      "cell",
      "rbc",
      "wbc",
      "platelet",
      "esr",
    ],
    tests: [
      "Complete Blood Count (CBC)",
      "Haemoglobin (Hb)",
      "Total WBC Count (TLC)",
      "Differential Leucocyte Count (DLC)",
      "Platelet Count",
      "ESR (Erythrocyte Sedimentation Rate)",
      "Packed Cell Volume (PCV / Hematocrit)",
      "Peripheral Blood Smear (PBS)",
      "Blood Group & Rh Type",
      "Reticulocyte Count",
      "Absolute Eosinophil Count (AEC)",
      "Bleeding Time & Clotting Time (BT/CT)",
      "PT / INR (Prothrombin Time)",
      "APTT (Activated Partial Thromboplastin Time)",
      "Red Blood Cell (RBC) Count",
      "MCV / MCH / MCHC",
    ],
  },
  {
    category: "Diabetes & Glucose",
    icon: "🍬",
    aliases: [
      "diabetes",
      "sugar",
      "glucose",
      "diab",
      "fbs",
      "ppbs",
      "rbs",
      "hba1c",
    ],
    tests: [
      "Fasting Blood Sugar (FBS)",
      "Post Prandial Blood Sugar (PPBS)",
      "Random Blood Sugar (RBS)",
      "HbA1c (Glycated Hemoglobin)",
      "Glucose Tolerance Test (GTT)",
      "Average Blood Glucose (MBG)",
      "Serum Insulin (Fasting)",
      "C-Peptide",
    ],
  },
  {
    category: "Lipid Profile",
    icon: "🫀",
    aliases: [
      "lipid",
      "cholesterol",
      "triglyceride",
      "heart",
      "cardiac",
      "hdl",
      "ldl",
    ],
    tests: [
      "Lipid Profile (Complete)",
      "Total Cholesterol",
      "Serum Triglycerides",
      "HDL Cholesterol",
      "LDL Cholesterol",
      "VLDL Cholesterol",
      "Total Cholesterol / HDL Ratio",
    ],
  },
  {
    category: "Liver Function Test (LFT)",
    icon: "🫁",
    aliases: [
      "lft",
      "liver",
      "bilirubin",
      "sgpt",
      "sgot",
      "jaundice",
      "alt",
      "ast",
    ],
    tests: [
      "Liver Function Test (LFT Profile)",
      "Serum Bilirubin (Total, Direct, Indirect)",
      "SGPT / ALT",
      "SGOT / AST",
      "Serum Alkaline Phosphatase (ALP)",
      "Total Protein, Albumin & Globulin (A/G Ratio)",
      "Gamma GT (GGT)",
      "Serum Amylase",
      "Serum Lipase",
    ],
  },
  {
    category: "Kidney Function Test (KFT / RFT)",
    icon: "🧪",
    aliases: [
      "kft",
      "rft",
      "kidney",
      "renal",
      "creatinine",
      "urea",
      "bun",
      "electrolytes",
    ],
    tests: [
      "Kidney Function Test (KFT / RFT Profile)",
      "Serum Creatinine",
      "Blood Urea",
      "Blood Urea Nitrogen (BUN)",
      "Serum Uric Acid",
      "Serum Electrolytes (Sodium, Potassium, Chloride)",
      "Serum Calcium",
      "Serum Phosphorus",
      "Estimated GFR (eGFR)",
      "Urine Albumin to Creatinine Ratio (UACR)",
    ],
  },
  {
    category: "Thyroid Profile",
    icon: "🦋",
    aliases: ["thyroid", "tsh", "t3", "t4", "hypothyroid", "hyperthyroid"],
    tests: [
      "Thyroid Profile (Total T3, T4, TSH)",
      "TSH (Ultrasensitive)",
      "Free T3 (FT3)",
      "Free T4 (FT4)",
      "Anti-TPO Antibodies",
    ],
  },
  {
    category: "Urine & Stool Examination",
    icon: "🧴",
    aliases: ["urine", "stool", "urinalysis", "pus", "uti"],
    tests: [
      "Urine Routine & Microscopy (Urine R/M)",
      "Urine Culture & Sensitivity (Urine C/S)",
      "Urine Microalbumin",
      "Urine Pregnancy Test (UPT)",
      "Urine Bile Salts & Bile Pigments",
      "Stool Routine & Microscopy",
      "Stool Occult Blood",
    ],
  },
  {
    category: "Fever & Infectious Serology",
    icon: "🌡️",
    aliases: [
      "fever",
      "infection",
      "dengue",
      "malaria",
      "typhoid",
      "widal",
      "crp",
    ],
    tests: [
      "Widal Test (Typhoid)",
      "Typhidot (IgM & IgG)",
      "Dengue NS1 Antigen",
      "Dengue Serology (IgM & IgG)",
      "Malaria Antigen (Pv / Pf)",
      "Chikungunya IgM",
      "CRP (C-Reactive Protein - Quantitative)",
      "High Sensitivity CRP (hs-CRP)",
      "Procalcitonin",
      "Blood Culture & Sensitivity",
    ],
  },
  {
    category: "Viral Markers & Immunology",
    icon: "🔬",
    aliases: [
      "viral",
      "hiv",
      "hepatitis",
      "hbsag",
      "hcv",
      "immunology",
      "autoimmune",
      "ra",
      "ana",
    ],
    tests: [
      "HIV I & II (Card / ELISA)",
      "HBsAg (Hepatitis B Surface Antigen)",
      "HCV (Hepatitis C Antibody)",
      "VDRL / RPR (Syphilis)",
      "RA Factor (Rheumatoid Arthritis)",
      "ANA (Antinuclear Antibodies)",
      "ASO Titre",
    ],
  },
  {
    category: "Vitamins & Minerals",
    icon: "💊",
    aliases: [
      "vitamins",
      "minerals",
      "iron",
      "deficiency",
      "b12",
      "d3",
      "ferritin",
    ],
    tests: [
      "Vitamin D3 (25-Hydroxy)",
      "Vitamin B12",
      "Serum Ferritin",
      "Serum Iron & TIBC Profile",
      "Serum Magnesium",
      "Serum Zinc",
    ],
  },
  {
    category: "Cardiac & Hormones",
    icon: "❤️",
    aliases: [
      "cardiac",
      "heart",
      "hormones",
      "pcos",
      "troponin",
      "testosterone",
    ],
    tests: [
      "Troponin-I (High Sensitivity)",
      "CPK / CK-MB",
      "NT-proBNP",
      "Serum Prolactin",
      "Serum Testosterone (Total)",
      "FSH & LH",
      "Serum Cortisol",
    ],
  },
  {
    category: "Imaging & Diagnostics",
    icon: "📷",
    aliases: [
      "imaging",
      "radiology",
      "xray",
      "x-ray",
      "scan",
      "usg",
      "ecg",
      "echo",
    ],
    tests: [
      "ECG (12-Lead)",
      "Chest X-Ray (PA View)",
      "USG Whole Abdomen & Pelvis",
      "USG KUB (Kidney, Ureter, Bladder)",
      "2D Echocardiography",
      "TMT (Treadmill Test)",
    ],
  },
];

let expandedCategoryNames = new Set();

function getSelectedTestsList() {
  const el = document.getElementById("patient-tests");
  if (!el || !el.value) return [];
  return el.value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.syncTestChips = function () {
  const chipsContainer = document.getElementById("rx-selected-tests-chips");
  if (!chipsContainer) return;

  const currentTests = getSelectedTestsList();
  if (currentTests.length === 0) {
    chipsContainer.innerHTML = "";
    return;
  }

  chipsContainer.innerHTML = currentTests
    .map((test) => {
      const escaped = escapeHtml(test);
      const encoded = encodeURIComponent(test);
      return `
        <span style="display: inline-flex; align-items: center; gap: 5px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 3px 8px; border-radius: 12px; font-size: 11.5px; font-weight: 600;">
          <span>${escaped}</span>
          <span onclick="window.removeTestFromPrescription(decodeURIComponent('${encoded}'))" style="cursor: pointer; color: #0284c7; font-weight: 800; font-size: 11px; margin-left: 2px;" title="Remove">✕</span>
        </span>
      `;
    })
    .join("");
};

window.addTestToPrescription = function (testName) {
  if (!testName) return;
  const textarea = document.getElementById("patient-tests");
  if (!textarea) return;

  const list = getSelectedTestsList();
  const lowerTest = testName.trim().toLowerCase();
  const alreadyExists = list.some((t) => t.toLowerCase() === lowerTest);

  if (!alreadyExists) {
    list.push(testName.trim());
    textarea.value = list.join(", ");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  window.syncTestChips();
  const searchInput = document.getElementById("rx-tests-search");
  window.renderTestsDropdown(searchInput?.value || "");
};

window.removeTestFromPrescription = function (testName) {
  if (!testName) return;
  const textarea = document.getElementById("patient-tests");
  if (!textarea) return;

  const lowerTest = testName.trim().toLowerCase();
  const list = getSelectedTestsList().filter(
    (t) => t.toLowerCase() !== lowerTest,
  );

  textarea.value = list.join(", ");
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  window.syncTestChips();

  const searchInput = document.getElementById("rx-tests-search");
  window.renderTestsDropdown(searchInput?.value || "");
};

window.addAllCategoryTests = function (categoryName) {
  const cat = LAB_TEST_CATALOG.find((c) => c.category === categoryName);
  if (!cat) return;

  const textarea = document.getElementById("patient-tests");
  if (!textarea) return;

  const currentList = getSelectedTestsList();
  const currentLower = new Set(currentList.map((t) => t.toLowerCase()));

  cat.tests.forEach((test) => {
    if (!currentLower.has(test.toLowerCase())) {
      currentList.push(test);
      currentLower.add(test.toLowerCase());
    }
  });

  textarea.value = currentList.join(", ");
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  window.syncTestChips();

  const searchInput = document.getElementById("rx-tests-search");
  window.renderTestsDropdown(searchInput?.value || "");
};

window.toggleCategoryExpand = function (categoryName, event) {
  if (event) event.stopPropagation();
  if (expandedCategoryNames.has(categoryName)) {
    expandedCategoryNames.delete(categoryName);
  } else {
    expandedCategoryNames.add(categoryName);
  }
  const searchInput = document.getElementById("rx-tests-search");
  window.renderTestsDropdown(searchInput?.value || "");
};

window.clearTestSearch = function () {
  const input = document.getElementById("rx-tests-search");
  if (input) {
    input.value = "";
    input.focus();
  }
  window.renderTestsDropdown("");
};

window.toggleTestCategoriesDropdown = function () {
  const dropdown = document.getElementById("rx-tests-dropdown");
  const input = document.getElementById("rx-tests-search");
  if (!dropdown) return;

  if (dropdown.style.display === "block" && (!input || !input.value.trim())) {
    dropdown.style.display = "none";
  } else {
    if (input) {
      input.value = "";
      input.focus();
    }
    window.renderTestsDropdown("", true);
  }
};

window.renderTestsDropdown = function (query, forceCategoryMode) {
  const dropdown = document.getElementById("rx-tests-dropdown");
  const clearBtn = document.getElementById("rx-tests-search-clear");
  if (!dropdown) return;

  const q = (query || "").trim().toLowerCase();
  if (clearBtn) clearBtn.style.display = q ? "block" : "none";

  const selectedTests = new Set(
    getSelectedTestsList().map((t) => t.toLowerCase()),
  );
  let html = "";

  if (q) {
    // 1. Check for matching categories
    const matchingCategories = LAB_TEST_CATALOG.filter((cat) => {
      if (cat.category.toLowerCase().includes(q)) return true;
      return cat.aliases.some(
        (alias) => alias.includes(q) || q.includes(alias),
      );
    });

    // Auto-expand strongly matched categories so user sees tests immediately
    matchingCategories.forEach((cat) => {
      expandedCategoryNames.add(cat.category);
    });

    if (matchingCategories.length > 0) {
      html += `
        <div style="padding: 4px 10px 2px; font-size: 10.5px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em;">
          Matching Headings / Categories (Click to open list):
        </div>
      `;

      matchingCategories.forEach((cat) => {
        const isExpanded = expandedCategoryNames.has(cat.category);
        html += `
          <div class="rx-cat-block" style="background: #f8fafc; border: 1.5px solid #bae6fd; border-radius: 8px; margin: 6px 8px; overflow: hidden;">
            <div
              onclick="window.toggleCategoryExpand('${escapeHtml(cat.category)}', event)"
              style="padding: 9px 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: #f0f9ff; user-select: none;"
            >
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 15px;">${cat.icon}</span>
                <strong style="font-size: 13px; color: #0369a1;">${escapeHtml(cat.category)}</strong>
                <span style="font-size: 11px; font-weight: 700; background: #ffffff; color: #0284c7; padding: 2px 7px; border-radius: 10px; border: 1px solid #bae6fd;">
                  ${cat.tests.length} Tests
                </span>
              </div>
              <span style="font-size: 11.5px; font-weight: 700; color: #0284c7;">
                ${isExpanded ? "▲ Hide Tests" : "▼ Open List of Tests"}
              </span>
            </div>
            ${
              isExpanded
                ? `
              <div style="padding: 6px 10px 10px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0 8px; border-bottom: 1px dashed #e2e8f0; margin-bottom: 6px;">
                  <span style="font-size: 11px; color: #64748b; font-weight: 600;">Click test name to add/remove:</span>
                  <button type="button" onclick="window.addAllCategoryTests('${escapeHtml(cat.category)}')" class="btn btn-ghost" style="padding: 2px 8px; font-size: 11px; font-weight: 700; color: #0284c7; height: auto;">
                    + Select All (${cat.tests.length})
                  </button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 5px;">
                  ${cat.tests
                    .map((test) => {
                      const isSelected = selectedTests.has(test.toLowerCase());
                      const encoded = encodeURIComponent(test);
                      return `
                      <div
                        onclick="window.${isSelected ? "removeTestFromPrescription" : "addTestToPrescription"}(decodeURIComponent('${encoded}'))"
                        style="padding: 6px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border: 1px solid ${isSelected ? "#38bdf8" : "#f1f5f9"}; background: ${isSelected ? "#f0f9ff" : "#ffffff"};"
                        onmouseover="if(!${isSelected}) this.style.background='#f8fafc'"
                        onmouseout="if(!${isSelected}) this.style.background='#ffffff'"
                      >
                        <span style="font-weight: ${isSelected ? "700" : "500"}; color: ${isSelected ? "#0369a1" : "#334155"};">${escapeHtml(test)}</span>
                        <span style="font-size: 11px; font-weight: 800; color: ${isSelected ? "#059669" : "#0284c7"};">${isSelected ? "✓ Added" : "+ Add"}</span>
                      </div>
                    `;
                    })
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
          </div>
        `;
      });
    }

    // 2. Check for matching individual tests
    const matchingTests = [];
    const seenTestNames = new Set();

    LAB_TEST_CATALOG.forEach((cat) => {
      cat.tests.forEach((test) => {
        if (
          test.toLowerCase().includes(q) &&
          !seenTestNames.has(test.toLowerCase())
        ) {
          seenTestNames.add(test.toLowerCase());
          matchingTests.push({ test, category: cat.category, icon: cat.icon });
        }
      });
    });

    // Also search comprehensive medical test database
    if (window.searchMedicalTestCatalog) {
      const dbMatches = window.searchMedicalTestCatalog(q);
      dbMatches.forEach((item) => {
        if (!seenTestNames.has(item.name.toLowerCase())) {
          seenTestNames.add(item.name.toLowerCase());
          matchingTests.push({
            test: item.name,
            category: item.category,
            icon: "🔬",
          });
        }
      });
    }

    if (matchingTests.length > 0) {
      html += `
        <div style="padding: 6px 10px 2px; font-size: 10.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;">
          Individual Tests matching "${escapeHtml(query)}":
        </div>
        <div style="padding: 2px 6px;">
      `;

      matchingTests.forEach((item) => {
        const isSelected = selectedTests.has(item.test.toLowerCase());
        const encoded = encodeURIComponent(item.test);
        html += `
          <div
            onclick="window.${isSelected ? "removeTestFromPrescription" : "addTestToPrescription"}(decodeURIComponent('${encoded}'))"
            style="padding: 8px 10px; border-radius: 6px; font-size: 12.5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc; background: ${isSelected ? "#f0f9ff" : "white"};"
            onmouseover="if(!${isSelected}) this.style.background='#f8fafc'"
            onmouseout="if(!${isSelected}) this.style.background='white'"
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>${item.icon}</span>
              <strong style="color: ${isSelected ? "#0369a1" : "#1e293b"}; font-weight: ${isSelected ? "700" : "600"};">${escapeHtml(item.test)}</strong>
              <span style="font-size: 10.5px; color: #64748b; background: #f1f5f9; padding: 1px 6px; border-radius: 4px;">${escapeHtml(item.category)}</span>
            </div>
            <span style="font-size: 11px; font-weight: 800; color: ${isSelected ? "#059669" : "#0284c7"};">${isSelected ? "✓ Added" : "+ Add"}</span>
          </div>
        `;
      });
      html += `</div>`;
    }

    // 3. Option to add custom test if query doesn't exactly match
    const exactMatch = matchingTests.some((t) => t.test.toLowerCase() === q);
    if (!exactMatch && q.length > 1) {
      const encodedQ = encodeURIComponent(query.trim());
      html += `
        <div
          onclick="window.addTestToPrescription(decodeURIComponent('${encodedQ}'))"
          style="padding: 10px 14px; margin: 6px 8px; border-radius: 6px; background: #faf5ff; border: 1px dashed #c084fc; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
          onmouseover="this.style.background='#f3e8ff'"
          onmouseout="this.style.background='#faf5ff'"
        >
          <span style="font-size: 12.5px; font-weight: 600; color: #7e22ce;">
            + Add custom test: <strong>"${escapeHtml(query)}"</strong>
          </span>
          <span style="font-size: 11.5px; font-weight: 800; color: #7e22ce;">Add</span>
        </div>
      `;
    }

    if (
      matchingCategories.length === 0 &&
      matchingTests.length === 0 &&
      q.length > 0
    ) {
      html += `
        <div style="padding: 14px; text-align: center; color: #64748b; font-size: 12px;">
          No standard test matching "${escapeHtml(query)}". Click the button above to add it as a custom test.
        </div>
      `;
    }
  } else {
    // Empty query or force category mode: show all categories organized
    html += `
      <div style="padding: 6px 12px 4px; font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; align-items: center;">
        <span>Select Category to View All Tests:</span>
        <span style="color: #64748b; font-weight: 500; font-size: 10.5px;">${LAB_TEST_CATALOG.length} Categories</span>
      </div>
      <div style="padding: 2px 6px;">
    `;

    LAB_TEST_CATALOG.forEach((cat) => {
      const isExpanded = expandedCategoryNames.has(cat.category);
      html += `
        <div style="border-bottom: 1px solid #f1f5f9; margin-bottom: 2px;">
          <div
            onclick="window.toggleCategoryExpand('${escapeHtml(cat.category)}', event)"
            style="padding: 9px 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-radius: 6px; background: ${isExpanded ? "#f0f9ff" : "white"};"
            onmouseover="if(!${isExpanded}) this.style.background='#f8fafc'"
            onmouseout="if(!${isExpanded}) this.style.background='${isExpanded ? "#f0f9ff" : "white"}'"
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 15px;">${cat.icon}</span>
              <strong style="font-size: 12.5px; color: ${isExpanded ? "#0369a1" : "#1e293b"};">${escapeHtml(cat.category)}</strong>
              <span style="font-size: 10.5px; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 1px 6px; border-radius: 10px;">
                ${cat.tests.length} Tests
              </span>
            </div>
            <span style="font-size: 11px; font-weight: 700; color: #0284c7;">
              ${isExpanded ? "▲ Close" : "▼ View Tests"}
            </span>
          </div>
          ${
            isExpanded
              ? `
            <div style="padding: 6px 8px 10px; background: #ffffff; border-left: 2px solid #38bdf8; margin: 2px 6px 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 2px 6px; border-bottom: 1px dashed #e2e8f0; margin-bottom: 4px;">
                <span style="font-size: 11px; color: #64748b; font-weight: 600;">Select tests to add to prescription:</span>
                <button type="button" onclick="window.addAllCategoryTests('${escapeHtml(cat.category)}')" class="btn btn-ghost" style="padding: 2px 8px; font-size: 11px; font-weight: 700; color: #0284c7; height: auto;">
                  + Select All (${cat.tests.length})
                </button>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 4px;">
                ${cat.tests
                  .map((test) => {
                    const isSelected = selectedTests.has(test.toLowerCase());
                    const encoded = encodeURIComponent(test);
                    return `
                    <div
                      onclick="window.${isSelected ? "removeTestFromPrescription" : "addTestToPrescription"}(decodeURIComponent('${encoded}'))"
                      style="padding: 5px 8px; border-radius: 5px; font-size: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border: 1px solid ${isSelected ? "#38bdf8" : "#f1f5f9"}; background: ${isSelected ? "#f0f9ff" : "#ffffff"};"
                      onmouseover="if(!${isSelected}) this.style.background='#f8fafc'"
                      onmouseout="if(!${isSelected}) this.style.background='#ffffff'"
                    >
                      <span style="font-weight: ${isSelected ? "700" : "500"}; color: ${isSelected ? "#0369a1" : "#334155"};">${escapeHtml(test)}</span>
                      <span style="font-size: 11px; font-weight: 800; color: ${isSelected ? "#059669" : "#0284c7"};">${isSelected ? "✓ Added" : "+ Add"}</span>
                    </div>
                  `;
                  })
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
        </div>
      `;
    });
    html += `</div>`;
  }

  dropdown.innerHTML = html;
  dropdown.style.display = "block";
};

// Initialize interactive listeners for tests input and dropdown
function initTestsDropdownEvents() {
  const searchInput = document.getElementById("rx-tests-search");
  const dropdown = document.getElementById("rx-tests-dropdown");
  const textarea = document.getElementById("patient-tests");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      window.renderTestsDropdown(e.target.value);
    });

    searchInput.addEventListener("focus", (e) => {
      window.renderTestsDropdown(e.target.value);
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dropdown) {
        dropdown.style.display = "none";
      }
    });
  }

  if (textarea) {
    textarea.addEventListener("input", () => {
      window.syncTestChips();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!dropdown || dropdown.style.display === "none") return;
    const isInsideSearch = e.target.closest(".rx-tests-search-wrap");
    if (!isInsideSearch) {
      dropdown.style.display = "none";
    }
  });

  window.syncTestChips();
}

window.updateFollowupUI = function(totalDays) {
  const monthsInput = document.getElementById("followup-months-input");
  const daysInput = document.getElementById("followup-days-input");
  if (!monthsInput || !daysInput) return;
  
  totalDays = parseInt(totalDays);
  if (isNaN(totalDays)) totalDays = 3;

  if (totalDays === 0) {
    monthsInput.value = "";
    daysInput.value = "0";
  } else {
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;
    monthsInput.value = months > 0 ? months : "";
    daysInput.value = days > 0 ? days : (months > 0 ? "0" : "3");
  }
};