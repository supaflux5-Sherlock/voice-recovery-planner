(function () {
  "use strict";

  const canvas = document.getElementById("ecg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ecgColor = "#1b63d6"; // blue, matching the site's accent

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
  window.addEventListener("resize", resize);
  resize();

  // ECG cycle keyframes: [fraction of cycle, amplitude -1..1]
  const keyframes = [
    [0.0, 0], [0.08, 0.08], [0.12, 0], [0.18, -0.05],
    [0.2, 1.0], [0.22, -0.35], [0.26, 0], [0.35, 0.15],
    [0.42, 0], [1.0, 0],
  ];

  function ecgValue(frac) {
    for (let i = 0; i < keyframes.length - 1; i++) {
      const [f0, v0] = keyframes[i];
      const [f1, v1] = keyframes[i + 1];
      if (frac >= f0 && frac <= f1) {
        const t = (frac - f0) / (f1 - f0 || 1);
        return v0 + (v1 - v0) * t;
      }
    }
    return 0;
  }

  const cyclePixels = 220;
  const scrollSpeed = 70; // px/sec

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const baseline = h / 2;
    const amplitude = h * 0.42;
    const timeOffset = (performance.now() / 1000) * scrollSpeed;

    ctx.beginPath();
    ctx.strokeStyle = ecgColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = ecgColor;
    ctx.shadowBlur = 6;
    for (let x = 0; x <= w; x++) {
      const worldX = x + timeOffset;
      const frac = (((worldX % cyclePixels) + cyclePixels) % cyclePixels) / cyclePixels;
      const v = ecgValue(frac);
      const y = baseline - v * amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    requestAnimationFrame(draw);
  }
  draw();
})();
