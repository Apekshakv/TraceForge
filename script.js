// Set your repository URL here. Every "GitHub" button on the page uses it.
const REPO_URL = "https://github.com/<your-username>/traceforge";
document.querySelectorAll(".repo-link").forEach(a => { a.href = REPO_URL; });

// One-pixel verifier demo: real SHA-256 of the canvas PNG, computed in the browser.
const canvas = document.getElementById("evidence");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const $ = id => document.getElementById(id);
let sealed = null;

function drawSample() {
  const w = canvas.width, h = canvas.height;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#12343f"); g.addColorStop(1, "#19c2ad");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,.85)";
  for (let i = 0; i < 6; i++) ctx.fillRect(10, 14 + i * 13, 30 + ((i * 17) % 46), 6);
  ctx.fillStyle = "#f2a93b"; ctx.fillRect(10, 8, 22, 4);
}

async function hashCanvas() {
  const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
  const buf = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function setResult(cls, text) { const r = $("result"); r.className = "result " + cls; r.textContent = text; }
const short = h => h ? h.slice(0, 16) + "…" + h.slice(-8) : "–";

$("seal").addEventListener("click", async () => {
  sealed = await hashCanvas();
  $("h-sealed").textContent = short(sealed);
  $("h-current").textContent = short(sealed);
  $("verify").disabled = false; $("flip").disabled = false;
  setResult("ok", "Sealed. This hash is now the evidence record.");
});

$("verify").addEventListener("click", async () => {
  const now = await hashCanvas();
  $("h-current").textContent = short(now);
  if (now === sealed) setResult("ok", "MATCH: the evidence is untouched.");
  else setResult("bad", "MISMATCH: the file has been altered.");
});

$("flip").addEventListener("click", () => {
  const px = ctx.getImageData(70, 70, 1, 1);
  px.data[0] = (px.data[0] + 1) % 256; // nudge one channel of one pixel
  ctx.putImageData(px, 70, 70);
  setResult("idle", "One pixel changed. Now press Verify.");
});

$("reset").addEventListener("click", () => {
  sealed = null; drawSample();
  $("h-sealed").textContent = "–"; $("h-current").textContent = "–";
  $("verify").disabled = true; $("flip").disabled = true;
  setResult("idle", "Seal the image to start.");
});

drawSample();
