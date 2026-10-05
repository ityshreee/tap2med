class QueueManager {
  static async loadQueue() {
    if (!clinicId) return;

    try {
      const data = await ApiClient.request(`/api/clinics/queue/${encodeURIComponent(clinicId)}`);

      const doctorName = document.getElementById("doc-name");
      const clinicName = document.getElementById("clinic-name");
      if(doctorName) doctorName.textContent = data.doctor_name || "Doctor";
      if(clinicName) clinicName.textContent = data.clinic_name || "Clinic";

      const waitingQueue = data.queue
        ? data.queue.filter((p) => p.status === "waiting")
        : [];
      window.currentWaitingTokens = waitingQueue.map((p) => p.local_token);

      const queueCountBadge = document.getElementById("queue-count");
      if (queueCountBadge)
        queueCountBadge.textContent = `${waitingQueue.length} Waiting`;

      const queueList = document.getElementById("queue-list");
      if (queueList) queueList.innerHTML = "";

      const currentToken = document.getElementById("current-token");

      if (waitingQueue.length === 0 && queueList) {
        if (
          (!currentLocalToken ||
            !currentToken ||
            !currentToken.innerHTML.includes("EDITING")) &&
          currentToken
        ) {
          currentToken.textContent = "—";
          currentLocalToken = null;
        }
        if (typeof setPrescriptionStatus === 'function') setPrescriptionStatus("Waiting...", "warning");
        queueList.innerHTML =
          '<div class="queue-card text-muted" style="padding:16px;">No patients waiting</div>';
      } else if (queueList) {
        waitingQueue.forEach((patient) => {
          const shortCode = typeof getShortCode === 'function' ? getShortCode(patient.daily_token_number) : patient.daily_token_number;
          const card = document.createElement("div");
          card.dataset.token = patient.local_token;
          card.className = `queue-card ${currentLocalToken === patient.local_token ? "active" : ""}`;
          card.style.cursor = "pointer";

          let typeBadge = "";
          if (patient.visit_type === "followup")
            typeBadge = `<span style="font-size: 11px; background: #fef08a; color: #b45309; padding: 2px 6px; border-radius: 4px; margin-left: 8px; font-weight: 800; text-transform: uppercase;">Follow-up</span>`;
          else if (patient.visit_type === "appointment")
            typeBadge = `<span style="font-size: 11px; background: #e0e7ff; color: #0369a1; padding: 2px 6px; border-radius: 4px; margin-left: 8px; font-weight: 800; text-transform: uppercase;">Appointment</span>`;
          else
            typeBadge = `<span style="font-size: 11px; background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; margin-left: 8px; font-weight: 800; text-transform: uppercase;">Walk-in</span>`;

          let cityText = patient.city
            ? `<span style="font-size: 12px; color: var(--text-muted); font-weight: 500; margin-left: 6px;">(${patient.city})</span>`
            : "";

          card.innerHTML = `
            <div class="token-number">#${shortCode}</div>
            <div class="patient-details">
              <strong style="font-size: 16px;">${patient.patient_name || "Patient"} ${cityText} ${typeBadge}</strong>
              <span>ID: ${patient.display_id || "--"}</span>
            </div>
            <button onclick="QueueManager.removePatientFromQueue('${patient.local_token}', event)" title="Remove patient from queue" style="position:absolute; right:12px; bottom:12px; width:28px; height:28px; border:none; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; background:#fff1f2; color:#be123c; font-size:14px; cursor:pointer; box-shadow:0 6px 14px rgba(190,18,60,0.12); border:1px solid #fecdd3;">✕</button>
          `;

          card.onclick = async () => {
            let overlay = document.getElementById("consultation-overlay");
            if (!overlay) {
              overlay = document.createElement("div");
              overlay.id = "consultation-overlay";
              overlay.style.cssText =
                "position:absolute; inset:0; background:rgba(255,255,255,0.85); backdrop-filter:blur(4px); z-index:50; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:16px; font-size:20px; font-weight:800; color:var(--primary-color);";

              const consultCard = document.querySelector(".consultation-card");
              if (consultCard) {
                consultCard.style.position = "relative";
                consultCard.appendChild(overlay);
              }
            }
            overlay.innerHTML =
              '<span style="font-size:32px; margin-bottom:10px;"></span> Loading Patient Data...';
            overlay.style.display = "flex";

            document
              .querySelectorAll(".queue-card")
              .forEach((c) => c.classList.remove("active"));
            card.classList.add("active");
            card.parentNode.prepend(card);

            currentLocalToken = patient.local_token;
            const selectedToken = currentLocalToken;
            sessionStorage.setItem("tap2med_active_patient_token", currentLocalToken);
            window.currentPatientName = patient.patient_name || "Patient";
            window.currentDisplayId = patient.display_id || "--";
            if (typeof setPrescriptionStatus === 'function') setPrescriptionStatus("Loading...", "info");

            if (currentToken) currentToken.textContent = `#${shortCode}`;

            if (typeof renderActiveHeader === 'function') {
                renderActiveHeader({
                patientName: window.currentPatientName,
                displayId: window.currentDisplayId,
                cityText: patient.city || "",
                age: patient.age,
                });
            }

            if (window.PrescriptionPad) window.PrescriptionPad.clearPrescription();
            
            const historyContent = document.getElementById("history-content");
            if (historyContent) historyContent.innerHTML =
              '<p class="text-muted text-sm">Fetching secure records...</p>';

            try {
              await Promise.all([
                ApiClient.request("/api/events/queue/top", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    clinic_id: clinicId,
                    local_token: patient.local_token,
                  }),
                }),
                QueueManager.loadHistory(selectedToken).then(() => {
                    if (window.PrescriptionPad) window.PrescriptionPad.restorePrescriptionDraft(selectedToken);
                }),
                QueueManager.fetchActiveVitals(),
              ]);
            } catch (e) {
              console.error(e);
            }

            overlay.style.display = "none";
            window.scrollTo({ top: 0, behavior: "smooth" });
            const cEl = document.getElementById("patient-complaints");
            if (cEl) cEl.focus();
          };

          queueList.appendChild(card);
        });

        if (!currentLocalToken && waitingQueue.length > 0) {
          const savedToken = sessionStorage.getItem("tap2med_active_patient_token");
          const firstPatient =
            waitingQueue.find((patient) => patient.local_token === savedToken) ||
            waitingQueue[0];
          currentLocalToken = firstPatient.local_token;
          sessionStorage.setItem("tap2med_active_patient_token", currentLocalToken);
          if (typeof setPrescriptionStatus === 'function') setPrescriptionStatus("Waiting...", "warning");
          if (currentToken)
            currentToken.textContent = `#${typeof getShortCode === 'function' ? getShortCode(firstPatient.daily_token_number) : firstPatient.daily_token_number}`;
          window.currentPatientName = firstPatient.patient_name || "Patient";
          window.currentDisplayId = firstPatient.display_id || "--";

          if (typeof renderActiveHeader === 'function') {
            renderActiveHeader({
                patientName: window.currentPatientName,
                displayId: window.currentDisplayId,
                cityText: firstPatient.city || "",
                age: firstPatient.age,
            });
          }

          if (window.PrescriptionPad) window.PrescriptionPad.clearPrescription();
          QueueManager.loadHistory(currentLocalToken).then(() => {
              if (window.PrescriptionPad) window.PrescriptionPad.restorePrescriptionDraft(currentLocalToken);
          });
          const firstCard = queueList.firstChild;
          if (firstCard) firstCard.classList.add("active");
        }
      }

      const completedQueue = data.queue
        ? data.queue.filter((p) => p.status === "completed")
        : [];
      const completedList = document.getElementById("completed-list");
      if (completedList) {
        completedList.innerHTML = "";
        if (completedQueue.length === 0) {
          completedList.innerHTML =
            '<div class="queue-card text-muted" style="padding:16px; font-size:14px;">No completed patients</div>';
        } else {
          completedQueue.forEach((patient) => {
            const shortCode = typeof getShortCode === 'function' ? getShortCode(patient.daily_token_number) : patient.daily_token_number;
            const card = document.createElement("div");
            card.className = "queue-card";
            card.style.background = "#f8fafc";
            card.style.cursor = "default";
            card.innerHTML = `
              <div class="token-number" style="color: #64748b; font-size: 18px;">#${shortCode}</div>
              <div class="patient-details" style="flex: 1;">
                <strong style="font-size: 15px; color: #475569;">${patient.patient_name || "Patient"}</strong>
                <span style="color: var(--success-color); font-size: 12px;">Completed</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <button onclick="editRx('${patient.local_token}', ${patient.daily_token_number}, '${(patient.patient_name || "Patient").replace(/'/g, "\\'")}', '${patient.display_id || "--"}')" class="btn btn-ghost" style="padding: 4px 8px; font-size: 11px; color: #ef4444; border: 1px dashed #fca5a5;">Edit</button>
                <button onclick="openLabsModal('${patient.local_token}', '${(patient.patient_name || "Patient").replace(/'/g, "\\'")}')" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; background: white; border: 1px dashed #cbd5e1;">Labs</button>
                <button onclick="rePrintRx('${patient.local_token}', '${(patient.patient_name || "Patient").replace(/'/g, "\\'")}', '${patient.display_id || "--"}')" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; background: white;">Print</button>
              </div>
            `;
            completedList.appendChild(card);
          });
        }
      }
    } catch (error) {
      console.error("Queue error:", error);
    }
  }

  static async loadHistory(localToken) {
    const historyContent = document.getElementById("history-content");
    if (!historyContent) return;

    try {
      const data = await ApiClient.request(`/api/events/history/${encodeURIComponent(localToken)}?clinic_id=${clinicId}`);

      if (!data.history || data.history.length === 0) {
        historyContent.innerHTML =
          '<p class="text-muted text-sm">No previous visits recorded.</p>';
        return;
      }

      historyContent.innerHTML = "";
      data.history.forEach((visit) => {
        const date = new Date(visit.timestamp).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        let historyHTML = "";

        if (visit.complaints)
          historyHTML += `<div style="margin-bottom:8px; font-size:13px; color:#475569;"><strong>C/E:</strong> ${visit.complaints}</div>`;
        if (visit.diagnosis)
          historyHTML += `<div style="margin-bottom:12px; font-size:13px; color:#0f172a;"><strong>Dx:</strong> ${visit.diagnosis}</div>`;

        if (visit.prescriptions && visit.prescriptions.length > 0) {
          historyHTML += `<div style="margin-top:10px; font-size:13px; color:#0f172a;"><strong>Rx:</strong><ul style="margin:5px 0; padding-left:20px;">`;
          visit.prescriptions.forEach((rx) => {
            historyHTML += `<li style="margin-bottom: 4px;"><strong>${rx.name}</strong> <br><span class="text-muted" style="font-size:12px;">${rx.instructions || ""}</span></li>`;
          });
          historyHTML += "</ul></div>";
        }
        if (visit.tests_suggested)
          historyHTML += `<div style="margin-top:12px; font-size:13px; color:#0284c7;"><strong>Tests:</strong> ${visit.tests_suggested}</div>`;

        const card = document.createElement("details");
        card.style.background = "#fff";
        card.style.border = "1px solid #e2e8f0";
        card.style.borderRadius = "8px";
        card.style.padding = "12px";
        card.style.marginBottom = "10px";
        card.style.cursor = "pointer";

        card.innerHTML = `
          <summary style="font-weight: 600; color: var(--primary-color); outline: none; display: flex; align-items: center; justify-content: space-between; gap: 12px;">${date}<button type="button" class="btn btn-secondary copy-to-pad-btn" style="height: 30px; padding: 0 10px; font-size: 12px; color: var(--primary-color);">↻ Copy to Pad</button></summary>
          <div style="padding-top: 10px; border-top: 1px solid #e2e8f0; margin-top: 10px;">
            ${historyHTML || "<p class='text-muted text-sm'>No details recorded.</p>"}
          </div>
        `;
        const copyButton = card.querySelector(".copy-to-pad-btn");
        copyButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (typeof copyVisitToPad === 'function') {
            copyVisitToPad(visit.prescriptions);
          }
        });
        historyContent.appendChild(card);
      });
    } catch (error) {
      console.error("History error:", error);
    }
  }

  static async removePatientFromQueue(localToken, event) {
    if (event) event.stopPropagation();
    if (!confirm("Remove this patient from the queue?")) return;

    try {
      await ApiClient.request("/api/events/queue/remove", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinic_id: clinicId, local_token: localToken }),
      });
      await QueueManager.loadQueue();
      if (window.ToastUI) ToastUI.showSuccess("Patient removed from queue.");
    } catch (e) {
      console.error("Failed to remove patient from queue", e);
      if (window.ToastUI) ToastUI.showError("Failed to remove patient from queue.");
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

window.QueueManager = QueueManager;
window.loadQueue = QueueManager.loadQueue;
window.loadHistory = QueueManager.loadHistory;
window.removePatientFromQueue = QueueManager.removePatientFromQueue;
window.fetchActiveVitals = QueueManager.fetchActiveVitals;

setInterval(QueueManager.loadQueue, 5000);
setInterval(QueueManager.fetchActiveVitals, 2000);
