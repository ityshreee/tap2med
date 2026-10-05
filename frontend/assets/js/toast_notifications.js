class ToastUI {
  static showSuccess(message) {
    this._show(message, 'success');
  }

  static showError(message, details = null) {
    let msg = message;
    if (details) {
      msg += `: ${details}`;
    }
    this._show(msg, 'error');
  }

  static _show(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.fontWeight = 'bold';
    toast.style.zIndex = '9999';
    toast.style.transition = 'opacity 0.5s ease-out';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    toast.style.fontFamily = '"Inter", sans-serif';

    if (type === 'success') {
      toast.style.backgroundColor = '#10b981';
    } else {
      toast.style.backgroundColor = '#ef4444';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 4000);
  }
}

window.ToastUI = ToastUI;
