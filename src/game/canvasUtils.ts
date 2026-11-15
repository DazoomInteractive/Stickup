/**
 * Rounded rectangle path that also works on WebViews without ctx.roundRect.
 * Does NOT call beginPath(): the caller does that, same as with ctx.roundRect.
 */
export function roundRectSafe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[],
): void {
  if ('roundRect' in ctx && typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const raw = Array.isArray(r) ? r : [r];
  let tl = 0;
  let tr = 0;
  let br = 0;
  let bl = 0;
  if (raw.length === 1) {
    tl = tr = br = bl = raw[0];
  } else if (raw.length === 2) {
    tl = br = raw[0];
    tr = bl = raw[1];
  } else if (raw.length === 3) {
    tl = raw[0];
    tr = bl = raw[1];
    br = raw[2];
  } else if (raw.length >= 4) {
    [tl, tr, br, bl] = raw;
  }
  const maxR = Math.max(0, Math.min(Math.abs(w), Math.abs(h)) / 2);
  const c = (v: number) => Math.max(0, Math.min(v, maxR));
  tl = c(tl);
  tr = c(tr);
  br = c(br);
  bl = c(bl);
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}
