const Scanner = {
  stream: null,
  detector: null,
  running: false,
  onDetect: null,

  async start(onDetect) {
    this.onDetect = onDetect;
    const video = document.getElementById("scanner-video");
    const msg = document.getElementById("scanner-msg");

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } }
      });
      video.srcObject = this.stream;
      await video.play();

      if ("BarcodeDetector" in window) {
        this.detector = new BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"]
        });
        this.running = true;
        this.loop(video, msg);
      } else {
        msg.textContent = "Bu brauzer BarcodeDetector dəstəkləmir. Chrome/Edge istifadə et.";
      }
    } catch (e) {
      msg.textContent = "Kamera açılmadı: " + e.message;
    }
  },

  async loop(video, msg) {
    if (!this.running) return;
    try {
      const codes = await this.detector.detect(video);
      if (codes.length > 0) {
        const code = codes[0].rawValue;
        this.beep();
        this.stop();
        if (this.onDetect) this.onDetect(code);
        return;
      }
    } catch (e) { /* ignore */ }
    requestAnimationFrame(() => this.loop(video, msg));
  },

  stop() {
    this.running = false;
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  },

  beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 1200;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }
};
