/*
 * Evidence handling in the browser, before anything is uploaded.
 * Photos are redrawn on a canvas, which removes hidden EXIF data such as GPS location
 * and phone model, resized to a sensible maximum, and can have faces, number plates or
 * names pixelated. Every file gets a SHA-256 fingerprint so later tampering can be detected.
 */
import { uid } from "./data.js";

export const LIMITS = { photos: 4, videos: 1, photoMB: 15, videoMB: 20, videoSeconds: 90, maxSide: 1600 };

export async function sha256(blob) {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

/** Redraw the photo (stripping metadata), applying pixelated blur boxes given in 0..1 coordinates. */
export async function renderPhoto(sourceUrl, boxes = []) {
  const img = await loadImage(sourceUrl);
  const scale = Math.min(1, LIMITS.maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  for (const b of boxes) {
    const x = Math.round(b.x * w), y = Math.round(b.y * h), bw = Math.max(2, Math.round(b.w * w)), bh = Math.max(2, Math.round(b.h * h));
    const block = Math.max(8, Math.round(Math.max(bw, bh) / 12));
    const t = document.createElement("canvas"); t.width = Math.max(1, Math.ceil(bw / block)); t.height = Math.max(1, Math.ceil(bh / block));
    const tc = t.getContext("2d"); tc.drawImage(c, x, y, bw, bh, 0, 0, t.width, t.height);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(t, 0, 0, t.width, t.height, x, y, bw, bh); ctx.imageSmoothingEnabled = true;
  }
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.86));
  return { blob, w, h, url: URL.createObjectURL(blob) };
}

function videoDuration(url) {
  return new Promise((res) => { const v = document.createElement("video"); v.preload = "metadata"; v.onloadedmetadata = () => res(v.duration || 0); v.onerror = () => res(0); v.src = url; });
}

/** Turn a picked File into a draft evidence item, or throw a friendly error. */
export async function prepare(file) {
  const isImage = file.type.startsWith("image/"), isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) throw new Error("Only photos and videos can be added as evidence.");
  const mb = file.size / 1048576;
  if (isImage && mb > LIMITS.photoMB) throw new Error(`Photos must be under ${LIMITS.photoMB} MB.`);
  if (isVideo && mb > LIMITS.videoMB) throw new Error(`Videos must be under ${LIMITS.videoMB} MB. Trim the clip or record at a lower quality.`);
  const sourceUrl = URL.createObjectURL(file);
  if (isImage) {
    const out = await renderPhoto(sourceUrl, []);
    return { id: uid(), kind: "image", sourceUrl, boxes: [], ...out, name: file.name };
  }
  const duration = await videoDuration(sourceUrl);
  if (duration > LIMITS.videoSeconds + 1) throw new Error(`Videos must be ${LIMITS.videoSeconds} seconds or shorter.`);
  return { id: uid(), kind: "video", sourceUrl, blob: file, url: sourceUrl, duration, name: file.name };
}
