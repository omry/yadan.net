export const DIMENSIONS = Object.freeze({
  columnHeight: 3.0,
  beamSpan: 5.0,
  gap: 0.10,
  beamDepth: 0.34,
  columnWidth: 0.50,
});

export function magnitudeToIntensityG(magnitude) {
  // Conceptual visual scaling only: Mw alone does not determine site PGA.
  return Math.min(1.2, Math.max(0.03, 0.03 * 10 ** (0.35 * (magnitude - 4))));
}

export function wallCondition(damage) {
  if (damage >= 0.9) return "Failed";
  if (damage >= 0.65) return "Severe cracking";
  if (damage >= 0.35) return "Cracked";
  if (damage >= 0.1) return "Hairline cracks";
  return "Intact";
}

export class FrameModel {
  constructor() {
    this.naturalFrequency = 1.45;
    this.contactFrequency = 8.0;
    this.reset();
  }

  reset() {
    this.time = 0;
    this.floorDisplacements = [0, 0];
    this.floorVelocities = [0, 0];
    this.peakFloorDisplacements = [0, 0];
    this.peakStoryDrifts = [0, 0];
    this.contacts = [null, null];
    this.damages = [0, 0];
    this.impactCounts = [0, 0];
    this.wasInContact = [false, false];
  }

  groundAcceleration(time, intensityG, frequency) {
    const ramp = Math.min(time / 1.2, 1);
    const fade = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.13 * time + 0.8);
    const primary = Math.sin(2 * Math.PI * frequency * time);
    const secondary = 0.34 * Math.sin(2 * Math.PI * frequency * 2.17 * time + 1.1);
    return 9.81 * intensityG * ramp * fade * (primary + secondary) / 1.34;
  }

  step(dt, controls) {
    // Equal floor masses and equal storey stiffnesses. The 0.618 factor makes
    // naturalFrequency the first-mode frequency of the undamaged two-storey frame.
    const storyOmega = 2 * Math.PI * this.naturalFrequency / 0.618034;
    const storyStiffness = storyOmega * storyOmega;
    const storyDamping = 2 * controls.damping * storyOmega;
    const contactOmega = 2 * Math.PI * this.contactFrequency;
    const intensityG = magnitudeToIntensityG(controls.magnitude);
    const groundAccel = this.groundAcceleration(this.time, intensityG, controls.frequency);
    const storyDrifts = [
      this.floorDisplacements[0],
      this.floorDisplacements[1] - this.floorDisplacements[0],
    ];
    const storyVelocities = [
      this.floorVelocities[0],
      this.floorVelocities[1] - this.floorVelocities[0],
    ];
    const accelerations = [-groundAccel, -groundAccel];

    const applyStoreyResistance = (storyIndex, resistance) => {
      accelerations[storyIndex] -= resistance;
      if (storyIndex > 0) accelerations[storyIndex - 1] += resistance;
    };

    for (let storyIndex = 0; storyIndex < 2; storyIndex += 1) {
      const drift = storyDrifts[storyIndex];
      const driftVelocity = storyVelocities[storyIndex];
      const frameResistance = storyStiffness * drift + storyDamping * driftVelocity;
      applyStoreyResistance(storyIndex, frameResistance);

      const penetration = Math.max(Math.abs(drift) - controls.gap, 0);
      const direction = Math.sign(drift);
      this.contacts[storyIndex] = null;

      if (penetration > 0) {
        this.contacts[storyIndex] = direction > 0 ? "left" : "right";

        if (!this.wasInContact[storyIndex]) {
          const impactDemand = Math.abs(driftVelocity) + 6 * penetration;
          const impactDamage = Math.max(0, impactDemand - 0.08) / 3.2;
          this.damages[storyIndex] = Math.min(1, this.damages[storyIndex] + impactDamage);
          this.impactCounts[storyIndex] += 1;
        }

        const crushingDamage = Math.max(0, penetration - 0.012) * dt * 8;
        this.damages[storyIndex] = Math.min(1, this.damages[storyIndex] + crushingDamage);

        const stiffnessFactor = Math.max(0.12, 1 - 0.88 * this.damages[storyIndex]);
        const contactResistance =
          contactOmega * contactOmega * stiffnessFactor * penetration * direction
          + 2 * 0.16 * contactOmega * Math.sqrt(stiffnessFactor) * driftVelocity;
        applyStoreyResistance(storyIndex, contactResistance);
      }

      this.wasInContact[storyIndex] = penetration > 0;
    }

    // Semi-implicit Euler with a fixed 1/240 s substep.
    for (let floorIndex = 0; floorIndex < 2; floorIndex += 1) {
      this.floorVelocities[floorIndex] += accelerations[floorIndex] * dt;
      this.floorDisplacements[floorIndex] += this.floorVelocities[floorIndex] * dt;
      this.peakFloorDisplacements[floorIndex] = Math.max(
        this.peakFloorDisplacements[floorIndex],
        Math.abs(this.floorDisplacements[floorIndex]),
      );
    }

    const updatedStoryDrifts = [
      this.floorDisplacements[0],
      this.floorDisplacements[1] - this.floorDisplacements[0],
    ];
    for (let storyIndex = 0; storyIndex < 2; storyIndex += 1) {
      this.peakStoryDrifts[storyIndex] = Math.max(
        this.peakStoryDrifts[storyIndex],
        Math.abs(updatedStoryDrifts[storyIndex]),
      );
    }

    this.time += dt;
  }
}
