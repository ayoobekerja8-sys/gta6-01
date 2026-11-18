// VICE LINE's tiny, original Canvas engine. It owns the responsive viewport and drawing surface.
export function createEngine(canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let w = 0,
    h = 0,
    dpr = 1;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize);
  resize();
  return {
    ctx,
    get width() {
      return w;
    },
    get height() {
      return h;
    },
    clear(color) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
    },
    resize,
  };
}
