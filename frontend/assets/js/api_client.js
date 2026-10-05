class ApiClient {
  static async request(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, options);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      if (!response.ok) {
        let errMsg = `Server returned HTTP ${response.status}`;
        if (data && data.detail) {
            errMsg = data.detail;
        } else if (data && data.error) {
            errMsg = data.error;
        }
        throw new Error(errMsg);
      }

      // Financial gatekeeper logic for queue requests
      if (
        endpoint &&
        typeof endpoint === "string" &&
        endpoint.includes("/api/clinics/queue/")
      ) {
        if (data && data.queue) {
          data.queue = data.queue.filter((p) => {
            if (p.status === "waiting") {
              return p.vitals && p.vitals.is_paid === true;
            }
            return true;
          });
        }
      }

      return data;
    } catch (error) {
      if (window.ToastUI) {
        ToastUI.showError(error.message);
      }
      throw error;
    }
  }
}

window.ApiClient = ApiClient;
