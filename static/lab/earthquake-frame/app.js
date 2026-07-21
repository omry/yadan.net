import { DIMENSIONS, FrameModel, magnitudeToIntensityG, wallCondition } from "./model.js";

const canvas = document.querySelector("#frameCanvas");
const context = canvas.getContext("2d");
const model = new FrameModel();

const controls = {
  gap: document.querySelector("#gapWidth"),
  magnitude: document.querySelector("#magnitude"),
  duration: document.querySelector("#duration"),
  frequency: document.querySelector("#frequency"),
  damping: document.querySelector("#damping"),
};

const readouts = {
  status: document.querySelector("#statusBadge"),
  time: document.querySelector("#timeReadout"),
  drift: document.querySelector("#driftReadout"),
  gap: document.querySelector("#gapReadout"),
  peak: document.querySelector("#peakReadout"),
  contact: document.querySelector("#contactReadout"),
  damages: [document.querySelector("#damageReadout1"), document.querySelector("#damageReadout2")],
  damageMeters: [document.querySelector("#damageMeter1"), document.querySelector("#damageMeter2")],
  intensity: document.querySelector("#intensityEstimate"),
  frequency: document.querySelector("#frequencyOutput"),
  damping: document.querySelector("#dampingOutput"),
  dimensionGap: document.querySelector("#dimensionGap"),
};

const startButton = document.querySelector("#startButton");
const resetButton = document.querySelector("#resetButton");
const recordingMode = new URLSearchParams(window.location.search).get("recording") === "1";
document.body.classList.toggle("recording-mode", recordingMode);
let running = false;
let lastTimestamp = 0;
let accumulator = 0;

function controlValues() {
  const gapMm = clampedValue(controls.gap, 0, 1000, 100);
  const magnitude = clampedValue(controls.magnitude, 3, 9.5, 7);
  return {
    gap: gapMm / 1000,
    magnitude,
    duration: clampedValue(controls.duration, 1, 120, 10),
    frequency: clampedValue(controls.frequency, 0.4, 3, 1.2),
    damping: clampedValue(controls.damping, 1, 20, 5) / 100,
  };
}

function clampedValue(control, minimum, maximum, fallback) {
  const value = Number.parseFloat(control.value);
  return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
}

function updateControlLabels() {
  const values = controlValues();
  readouts.intensity.textContent = `Conceptual shaking: ${magnitudeToIntensityG(values.magnitude).toFixed(2)} g`;
  readouts.frequency.value = `${values.frequency.toFixed(2)} Hz`;
  readouts.damping.value = `${controls.damping.value}%`;
  readouts.dimensionGap.textContent = `${values.gap.toFixed(3)} m`;
}

function fitCanvas() {
  const rect = canvas.getBoundingClientRect();
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * density));
  const height = Math.max(1, Math.round(rect.height * density));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(density, 0, 0, density, 0, 0);
  return rect;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function doubleArrow(ctx, x1, y1, x2, y2, label, labelOffset = 0) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 6;
  ctx.save();
  ctx.strokeStyle = "#829086";
  ctx.fillStyle = "#617066";
  ctx.lineWidth = 1;
  line(ctx, x1, y1, x2, y2);
  for (const [x, y, a] of [[x1, y1, angle], [x2, y2, angle + Math.PI]]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a + 0.45) * head, y + Math.sin(a + 0.45) * head);
    ctx.lineTo(x + Math.cos(a - 0.45) * head, y + Math.sin(a - 0.45) * head);
    ctx.closePath();
    ctx.fill();
  }
  ctx.font = "700 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const mx = (x1 + x2) / 2 + Math.cos(angle + Math.PI / 2) * labelOffset;
  const my = (y1 + y2) / 2 + Math.sin(angle + Math.PI / 2) * labelOffset;
  ctx.fillText(label, mx, my);
  ctx.restore();
}

const WALL_CRACKS = [
  [[0.02, 0.12], [0.10, 0.17], [0.07, 0.27], [0.18, 0.35], [0.13, 0.48]],
  [[0.98, 0.10], [0.88, 0.18], [0.92, 0.29], [0.79, 0.38], [0.84, 0.52]],
  [[0.47, 0.01], [0.51, 0.13], [0.45, 0.22], [0.54, 0.33], [0.49, 0.46]],
  [[0.18, 0.58], [0.29, 0.53], [0.38, 0.64], [0.49, 0.59], [0.60, 0.70]],
  [[0.82, 0.55], [0.72, 0.63], [0.77, 0.74], [0.64, 0.83], [0.68, 0.98]],
  [[0.04, 0.75], [0.14, 0.70], [0.21, 0.81], [0.31, 0.76], [0.40, 0.94]],
];

function drawReinforcedConcreteFill(ctx, left, top, right, bottom, storyIndex) {
  const width = right - left;
  const height = bottom - top;
  const inset = 11;
  const meshSpacing = 27;

  ctx.save();
  roundedRect(ctx, left, top, width, height, 2);
  ctx.clip();

  // Preserve the green wall identity while adding a diagrammatic RC cutaway fill.
  ctx.fillStyle = "rgba(32, 169, 87, 0.09)";
  ctx.fillRect(left, top, width, height);

  // Fine, deterministic aggregate marks keep the texture stable during animation.
  for (let row = 0, y = top + 8; y < bottom - 5; row += 1, y += 13) {
    for (let column = 0, x = left + 7; x < right - 5; column += 1, x += 15) {
      const noise = Math.sin((column + 1) * 17.13 + (row + 1) * 31.71 + storyIndex * 11.9);
      const jitterX = noise * 3.2;
      const jitterY = Math.cos(noise * 8.7 + row) * 2.4;
      const radius = 0.55 + (noise + 1) * 0.28;
      ctx.beginPath();
      ctx.arc(x + jitterX, y + jitterY, radius, 0, Math.PI * 2);
      ctx.fillStyle = noise > 0
        ? "rgba(75, 88, 79, 0.20)"
        : "rgba(255, 253, 247, 0.45)";
      ctx.fill();
    }
  }

  // A restrained reinforcement mesh makes the concrete wall construction legible.
  ctx.strokeStyle = "rgba(48, 68, 56, 0.23)";
  ctx.lineWidth = 0.8;
  for (let x = left + inset; x < right - inset / 2; x += meshSpacing) {
    line(ctx, x, top + inset, x, bottom - inset);
  }
  for (let y = top + inset; y < bottom - inset / 2; y += meshSpacing) {
    line(ctx, left + inset, y, right - inset, y);
  }

  ctx.restore();
}

function drawWallDamage(ctx, left, top, right, bottom, damage) {
  if (damage <= 0) return;

  const width = right - left;
  const height = bottom - top;
  const visibleCracks = damage < 0.1
    ? 0
    : Math.min(WALL_CRACKS.length, 1 + Math.floor(((damage - 0.1) / 0.9) * WALL_CRACKS.length));

  ctx.save();
  ctx.fillStyle = `rgba(193, 79, 43, ${0.06 + damage * 0.15})`;
  ctx.fillRect(left, top, width, height);
  ctx.strokeStyle = `rgba(91, 53, 39, ${0.42 + damage * 0.5})`;
  ctx.lineWidth = 0.8 + damage * 1.7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let index = 0; index < visibleCracks; index += 1) {
    const crack = WALL_CRACKS[index];
    ctx.beginPath();
    crack.forEach(([x, y], pointIndex) => {
      const px = left + x * width;
      const py = top + y * height;
      if (pointIndex === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  const rect = fitCanvas();
  const width = rect.width;
  const height = rect.height;
  context.clearRect(0, 0, width, height);

  const sideSpace = recordingMode ? Math.max(32, width * 0.06) : Math.max(44, width * 0.12);
  const topSpace = recordingMode ? 40 : Math.max(64, height * 0.13);
  const bottomSpace = recordingMode ? 78 : Math.max(85, height * 0.17);
  const usableWidth = width - sideSpace * 2;
  const usableHeight = height - topSpace - bottomSpace;
  const fullWidthM = DIMENSIONS.beamSpan + DIMENSIONS.columnWidth;
  const fullHeightM = DIMENSIONS.columnHeight * 2 + DIMENSIONS.beamDepth * 3;
  const scale = Math.min(usableWidth / fullWidthM, usableHeight / fullHeightM);

  const baseCenterX = width / 2;
  const bottomY = height - bottomSpace;
  const beamWidth = DIMENSIONS.beamSpan * scale;
  const beamDepth = DIMENSIONS.beamDepth * scale;
  const columnWidth = DIMENSIONS.columnWidth * scale;
  const storyHeight = DIMENSIONS.columnHeight * scale;
  const frameLeft = baseCenterX - beamWidth / 2;
  const frameRight = baseCenterX + beamWidth / 2;
  const baseTop = bottomY - beamDepth;
  const middleUnderside = baseTop - storyHeight;
  const middleTop = middleUnderside - beamDepth;
  const roofUnderside = middleTop - storyHeight;
  const floorShifts = model.floorDisplacements.map((displacement) => displacement * scale);

  // Ground reference. Roof drift above the frame shows the motion direction.
  context.save();
  context.strokeStyle = "#c9cec6";
  context.lineWidth = 1;
  line(context, sideSpace * 0.55, bottomY + 12, width - sideSpace * 0.55, bottomY + 12);
  context.fillStyle = "#8a958d";
  context.font = "600 10px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText("FOUNDATION / GROUND", baseCenterX, bottomY + 31);
  context.restore();

  // Each wall moves with its supporting floor and is detached from the frame above it.
  const gap = controlValues().gap;
  const gapPx = gap * scale;
  const storeys = [
    {
      lowerShift: 0,
      upperShift: floorShifts[0],
      lowerY: baseTop,
      upperY: middleUnderside,
    },
    {
      lowerShift: floorShifts[0],
      upperShift: floorShifts[1],
      lowerY: middleTop,
      upperY: roofUnderside,
    },
  ];
  const wallBounds = [];

  storeys.forEach((storey, storyIndex) => {
    const wallLeft = frameLeft + storey.lowerShift + columnWidth + gapPx;
    const wallRight = frameRight + storey.lowerShift - columnWidth - gapPx;
    const wallTop = storey.upperY + gapPx;
    wallBounds.push({ left: wallLeft, right: wallRight, top: wallTop, bottom: storey.lowerY });

    context.save();
    context.strokeStyle = "#20a957";
    context.lineWidth = Math.max(3, scale * 0.035);
    drawReinforcedConcreteFill(context, wallLeft, wallTop, wallRight, storey.lowerY, storyIndex);
    roundedRect(context, wallLeft, wallTop, wallRight - wallLeft, storey.lowerY - wallTop, 2);
    context.stroke();
    drawWallDamage(context, wallLeft, wallTop, wallRight, storey.lowerY, model.damages[storyIndex]);
    context.fillStyle = "#168a46";
    context.font = "800 10px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(`STOREY ${storyIndex + 1} DETACHED WALL`, (wallLeft + wallRight) / 2, wallTop + 18);
    context.restore();
  });

  // Three beams and two pairs of constant-width deforming columns.
  context.save();
  context.strokeStyle = "#1d2520";
  context.fillStyle = "#fffdf7";
  context.lineWidth = Math.max(3, scale * 0.04);
  context.lineJoin = "round";

  context.fillRect(frameLeft, baseTop, beamWidth, beamDepth);
  context.strokeRect(frameLeft, baseTop, beamWidth, beamDepth);

  storeys.forEach((storey) => {
    context.beginPath();
    context.moveTo(frameLeft + storey.lowerShift, storey.lowerY);
    context.lineTo(frameLeft + storey.upperShift, storey.upperY);
    context.lineTo(frameLeft + storey.upperShift + columnWidth, storey.upperY);
    context.lineTo(frameLeft + storey.lowerShift + columnWidth, storey.lowerY);
    context.closePath();
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(frameRight + storey.lowerShift - columnWidth, storey.lowerY);
    context.lineTo(frameRight + storey.upperShift - columnWidth, storey.upperY);
    context.lineTo(frameRight + storey.upperShift, storey.upperY);
    context.lineTo(frameRight + storey.lowerShift, storey.lowerY);
    context.closePath();
    context.fill();
    context.stroke();
  });

  context.fillRect(frameLeft + floorShifts[0], middleTop, beamWidth, beamDepth);
  context.strokeRect(frameLeft + floorShifts[0], middleTop, beamWidth, beamDepth);
  context.fillRect(frameLeft + floorShifts[1], roofUnderside - beamDepth, beamWidth, beamDepth);
  context.strokeRect(frameLeft + floorShifts[1], roofUnderside - beamDepth, beamWidth, beamDepth);
  context.restore();

  // Contact flashes are independent for the two walls.
  model.contacts.forEach((contact, storyIndex) => {
    if (!contact) return;
    const bounds = wallBounds[storyIndex];
    const contactX = contact === "right" ? bounds.right : bounds.left;
    context.save();
    const contactY = bounds.top + 30;
    const gradient = context.createRadialGradient(contactX, contactY, 2, contactX, contactY, 30);
    gradient.addColorStop(0, "rgba(238, 125, 57, 0.95)");
    gradient.addColorStop(1, "rgba(238, 125, 57, 0)");
    context.fillStyle = gradient;
    context.fillRect(contactX - 34, contactY - 34, 68, 68);
    context.fillStyle = "#d75f19";
    context.font = "900 10px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("CONTACT", contactX, bounds.top + 13);
    context.restore();
  });

  // Dimensions.
  doubleArrow(context, frameLeft, bottomY + 67, frameRight, bottomY + 67, "5.00 m BEAM SPAN", -12);
  doubleArrow(context, frameLeft - 24, baseTop, frameLeft - 24, middleUnderside, "3.00 m", -13);
  doubleArrow(context, frameLeft - 24, middleTop, frameLeft - 24, roofUnderside, "3.00 m", -13);
  wallBounds.forEach((bounds) => {
    const innerColumnFace = bounds.left - gapPx;
    doubleArrow(context, innerColumnFace, bounds.top + 42, bounds.left, bounds.top + 42, `${Math.round(gap * 1000)} mm`, -9);
  });

  // Floor-level arrows show each absolute floor displacement.
  const arrowLevels = [middleTop - 14, roofUnderside - beamDepth - 16];
  floorShifts.forEach((shift, floorIndex) => {
    if (Math.abs(shift) <= 0.4) return;
    const direction = Math.sign(shift);
    const arrowY = arrowLevels[floorIndex];
    context.save();
    context.strokeStyle = "#ee7d39";
    context.fillStyle = "#ee7d39";
    context.lineWidth = 2;
    const x1 = baseCenterX;
    const x2 = baseCenterX + shift;
    line(context, x1, arrowY, x2, arrowY);
    context.beginPath();
    context.moveTo(x2 + direction * 7, arrowY);
    context.lineTo(x2 - direction * 3, arrowY - 5);
    context.lineTo(x2 - direction * 3, arrowY + 5);
    context.fill();
    context.restore();
  });
}

function updateReadouts() {
  const gap = controlValues().gap;
  const storyDrifts = [
    model.floorDisplacements[0],
    model.floorDisplacements[1] - model.floorDisplacements[0],
  ];
  const roofMm = model.floorDisplacements[1] * 1000;
  const remainingGapMm = Math.max(gap - Math.max(...storyDrifts.map(Math.abs)), 0) * 1000;
  readouts.time.textContent = `${model.time.toFixed(2)} s`;
  readouts.drift.textContent = `${roofMm >= 0 ? "+" : ""}${roofMm.toFixed(1)} mm`;
  readouts.gap.textContent = `${remainingGapMm.toFixed(1)} mm`;
  readouts.peak.textContent = `${(model.peakFloorDisplacements[1] * 1000).toFixed(1)} mm`;
  const contacts = model.contacts
    .map((contact, index) => contact ? `S${index + 1} ${contact}` : null)
    .filter(Boolean);
  readouts.contact.textContent = contacts.length ? contacts.join(" · ") : "None";
  model.damages.forEach((damage, storyIndex) => {
    const damagePercent = Math.round(damage * 100);
    readouts.damages[storyIndex].textContent = `${damagePercent}% · ${wallCondition(damage)}`;
    readouts.damageMeters[storyIndex].value = damagePercent;
    readouts.damageMeters[storyIndex].textContent = `${damagePercent}%`;
  });
}

function animate(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const frameTime = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  if (running) {
    accumulator += frameTime;
    const fixedStep = 1 / 240;
    const values = controlValues();
    while (accumulator >= fixedStep && model.time < values.duration) {
      const step = Math.min(fixedStep, values.duration - model.time);
      model.step(step, values);
      accumulator -= step;
    }
    if (model.time >= values.duration) {
      running = false;
      readouts.status.textContent = "COMPLETE";
      readouts.status.className = "badge complete";
      startButton.textContent = "Replay earthquake";
    }
  }

  updateReadouts();
  draw();
  requestAnimationFrame(animate);
}

startButton.addEventListener("click", () => {
  if (model.time >= controlValues().duration) {
    model.reset();
    accumulator = 0;
  }
  running = !running;
  startButton.textContent = running ? "Pause" : model.time > 0 ? "Resume" : "Start earthquake";
  readouts.status.textContent = running ? "SHAKING" : "PAUSED";
  readouts.status.className = `badge ${running ? "running" : "paused"}`;
  lastTimestamp = 0;
});

resetButton.addEventListener("click", () => {
  running = false;
  accumulator = 0;
  model.reset();
  startButton.textContent = "Start earthquake";
  readouts.status.textContent = "READY";
  readouts.status.className = "badge ready";
  updateReadouts();
  draw();
});

Object.values(controls).forEach((control) => control.addEventListener("input", updateControlLabels));
window.addEventListener("resize", draw);
updateControlLabels();
updateReadouts();
requestAnimationFrame(animate);
