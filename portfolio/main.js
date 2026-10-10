// Client-side interactions

function triggerCopy(textToCopy, customMessage) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(customMessage || 'Copied to clipboard!');
        }).catch(() => {
          fallbackCopy(textToCopy, customMessage);
        });
      } else {
        fallbackCopy(textToCopy, customMessage);
      }
    }

    function fallbackCopy(text, customMessage) {
      const tempInput = document.createElement('input');
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      showToast(customMessage || 'Copied to clipboard!');
    }

    let toastTimeout;
    function showToast(message) {
      const toast = document.getElementById('toast-notification');
      const msg = document.getElementById('toast-message');
      if (!toast || !msg) return;

      msg.textContent = message;
      toast.classList.remove('translate-y-20', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');

      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 2600);
    }

    function handleFormSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById('submit-button');
      const text = document.getElementById('submit-text');
      
      if (text) text.textContent = 'Transmitting...';
      if (btn) btn.disabled = true;

      setTimeout(() => {
        if (text) text.textContent = 'Transmission Dispatched!';
        showToast('Payload dispatched successfully to STQRKVI × ZERO!');
        document.getElementById('contact-form').reset();
        
        setTimeout(() => {
          if (text) text.textContent = 'Transmit Transmission';
          if (btn) btn.disabled = false;
        }, 3000);
      }, 700);
    }

window.addEventListener('scroll',()=>{const winScroll=document.documentElement.scrollTop||document.body.scrollTop;const height=document.documentElement.scrollHeight-document.documentElement.clientHeight;const scrolled=(winScroll/height);const el=document.getElementById('scroll-progress');if(el)el.style.transform=`scaleX(${scrolled})`;});
