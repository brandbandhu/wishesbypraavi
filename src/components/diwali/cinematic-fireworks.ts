// Physics use CSS pixels and seconds; DPR only affects the drawing buffer.
const COLORS = ["#FFD700", "#FFB347", "#FF7A18", "#E8A598", "#FF6FAE"];
const DURATION = 8;
const TAU = Math.PI * 2;
const HISTORY = 7;

type Style = "chrysanthemum" | "ring" | "willow";
type Cue = { at: number; x: number; y: number; size: number; color: number; style: Style };
type Rocket = {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  age: number;
  life: number;
  emission: number;
  cue: Cue;
};
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  drag: number;
  gravity: number;
  color: number;
  radius: number;
  phase: number;
  glitter: boolean;
  splitAt: number;
  history: Float32Array;
  count: number;
  cursor: number;
  historyAge: number;
};
type Cloud = { x: number; y: number; age: number; size: number; color: number };
const random = (min: number, max: number) => min + Math.random() * (max - min);

function createSprite(color: string, smoke = false) {
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = smoke ? 96 : 32;
  const ctx = sprite.getContext("2d");
  if (ctx) {
    const r = sprite.width / 2;
    const glow = ctx.createRadialGradient(r, r, 0, r, r, r);
    glow.addColorStop(0, smoke ? color : "#fff9df");
    glow.addColorStop(smoke ? 0.25 : 0.12, color);
    glow.addColorStop(smoke ? 0.65 : 0.35, `${color}30`);
    glow.addColorStop(1, `${color}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, sprite.width, sprite.height);
  }
  return sprite;
}

export class CinematicFireworks {
  readonly available: boolean;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly sparks: HTMLCanvasElement[];
  private readonly clouds: HTMLCanvasElement[];
  private width = 1;
  private height = 1;
  private mobile = false;
  private limit = 2200;
  private frame = 0;
  private startTime: number | null = null;
  private lastTime = 0;
  private cueIndex = 0;
  private running = false;
  private looping = false;
  private disposed = false;
  private cues: Cue[] = [];
  private rockets: Rocket[] = [];
  private particles: Particle[] = [];
  private smoke: Cloud[] = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onStart: () => void = () => {},
  ) {
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.available = Boolean(this.ctx);
    this.sparks = this.available ? COLORS.map((color) => createSprite(color)) : [];
    this.clouds = this.available ? COLORS.map((color) => createSprite(color, true)) : [];
    this.resize();
  }

  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    const oldWidth = this.width;
    const oldHeight = this.height;
    this.width = Math.max(1, bounds.width);
    this.height = Math.max(1, bounds.height);
    this.mobile = this.width < 640;
    this.limit = this.mobile ? 850 : 2200;
    const dpr = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2);
    // Bound fill-rate on large/high-DPI displays without changing CSS size.
    const ratio = Math.min(dpr, Math.sqrt(5_000_000 / (this.width * this.height)));
    this.canvas.width = Math.max(1, Math.round(this.width * ratio));
    this.canvas.height = Math.max(1, Math.round(this.height * ratio));
    this.ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    const sx = this.width / oldWidth;
    const sy = this.height / oldHeight;
    for (const p of this.particles) {
      p.x *= sx;
      p.y *= sy;
      p.vx *= sx;
      p.vy *= sy;
      for (let i = 0; i < HISTORY; i++) {
        p.history[i * 2] = (p.history[i * 2] ?? 0) * sx;
        p.history[i * 2 + 1] = (p.history[i * 2 + 1] ?? 0) * sy;
      }
    }
    for (const r of this.rockets) {
      r.x *= sx;
      r.originX *= sx;
      r.targetX *= sx;
      r.y *= sy;
      r.originY *= sy;
      r.targetY *= sy;
    }
    for (const cloud of this.smoke) {
      cloud.x *= sx;
      cloud.y *= sy;
    }
  }

  play(loop = false) {
    if (this.disposed || !this.available) return;
    this.stop();
    this.looping = loop;
    // Composed left/right pairs, with small variations on replay.
    const cues: Cue[] = [
      { at: 0.04, x: 0.17, y: 0.23, size: 1, color: 0, style: "chrysanthemum" },
      { at: 0.24, x: 0.82, y: 0.2, size: 1.05, color: 1, style: "chrysanthemum" },
      { at: 0.65, x: 0.33, y: 0.13, size: 0.7, color: 0, style: "ring" },
      { at: 1.04, x: 0.69, y: 0.12, size: 0.8, color: 2, style: "ring" },
      { at: 1.42, x: 0.1, y: 0.5, size: 0.6, color: 1, style: "chrysanthemum" },
      { at: 1.72, x: 0.9, y: 0.47, size: 0.65, color: 3, style: "ring" },
      { at: 2.15, x: 0.47, y: 0.08, size: 0.75, color: 0, style: "chrysanthemum" },
      { at: 2.5, x: 0.2, y: 0.21, size: 1.15, color: 0, style: "willow" },
      { at: 2.64, x: 0.79, y: 0.18, size: 1.1, color: 1, style: "willow" },
      { at: 2.86, x: 0.36, y: 0.1, size: 0.8, color: 0, style: "ring" },
      { at: 3, x: 0.65, y: 0.1, size: 0.85, color: 4, style: "chrysanthemum" },
      { at: 3.18, x: 0.09, y: 0.39, size: 0.7, color: 2, style: "chrysanthemum" },
      { at: 3.3, x: 0.91, y: 0.38, size: 0.7, color: 0, style: "ring" },
      { at: 3.58, x: 0.23, y: 0.17, size: 1.2, color: 0, style: "willow" },
      { at: 3.72, x: 0.77, y: 0.19, size: 1.2, color: 0, style: "willow" },
      { at: 4.03, x: 0.5, y: 0.08, size: 0.85, color: 1, style: "ring" },
      { at: 4.2, x: 0.12, y: 0.33, size: 0.8, color: 0, style: "chrysanthemum" },
      { at: 4.34, x: 0.88, y: 0.31, size: 0.8, color: 3, style: "chrysanthemum" },
    ];
    this.cues = cues.map((cue) => ({
      ...cue,
      x: Math.max(0.07, Math.min(0.93, cue.x + random(-0.025, 0.025))),
      y: Math.max(0.07, cue.y + random(-0.015, 0.015)),
    }));
    this.running = true;
    this.frame = requestAnimationFrame(this.render);
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.running = false;
    this.looping = false;
    this.startTime = null;
    this.lastTime = 0;
    this.cueIndex = 0;
    this.rockets.length = this.particles.length = this.smoke.length = 0;
    this.ctx?.clearRect(0, 0, this.width, this.height);
  }

  dispose() {
    this.stop();
    this.disposed = true;
  }

  private launch(cue: Cue) {
    const targetX = cue.x * this.width;
    this.rockets.push({
      x: targetX,
      y: this.height + 12,
      originX: targetX + (cue.x < 0.5 ? 1 : -1) * this.width * random(0.015, 0.055),
      originY: this.height + 12,
      targetX,
      targetY: cue.y * this.height,
      age: 0,
      life: random(0.8, 1.03),
      emission: 0,
      cue,
    });
  }

  private addParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: number,
    willow: boolean,
    glitter = false,
    split = false,
  ) {
    if (this.particles.length >= this.limit) return;
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      age: 0,
      life: glitter ? random(0.22, 0.65) : willow ? random(2.4, 3.25) : random(1.5, 2.4),
      drag: glitter ? 2 : willow ? 1.15 : 1.45,
      gravity: glitter ? 65 : willow ? 63 : 46,
      radius: glitter ? random(1.8, 3.3) : random(3.3, 6.5),
      phase: random(0, TAU),
      glitter,
      splitAt: split ? random(0.65, 1.05) : Infinity,
      history: new Float32Array(HISTORY * 2),
      count: 0,
      cursor: 0,
      historyAge: 0,
    });
  }

  private burst(rocket: Rocket) {
    const { x, y, cue } = rocket;
    const willow = cue.style === "willow";
    const count = Math.round((this.mobile ? 85 : 220) * cue.size);
    const scale = Math.min(this.width / 1100, this.height / 760, 1.2);
    const speed = (willow ? 230 : 255) * Math.max(0.52, scale) * cue.size;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + random(-0.018, 0.018);
      // Outer shell plus inner stars gives a spherical chrysanthemum silhouette.
      const shell =
        cue.style === "ring" ? random(0.94, 1.02) : Math.sqrt(Math.random()) * 0.85 + 0.15;
      const velocity = speed * shell;
      const color = Math.random() < 0.22 ? 1 : cue.color;
      this.addParticle(
        x,
        y,
        Math.cos(angle) * velocity,
        Math.sin(angle) * velocity * 0.88 - (willow ? 24 : 0),
        color,
        willow,
        false,
        i % 29 === 0,
      );
    }
    this.smoke.push({ x, y, size: speed * 0.8, color: cue.color, age: 0 });
  }

  // Soft spatial falloff preserves legibility without a visible cutout.
  private visibility(x: number, y: number) {
    const nx = (x / this.width - 0.5) / 0.29;
    const ny = (y / this.height - 0.48) / 0.34;
    return 0.2 + 0.8 * Math.min(1, (nx * nx + ny * ny) * 0.65);
  }

  private render = (time: number) => {
    const ctx = this.ctx;
    if (!ctx || !this.running || this.disposed) return;
    if (this.startTime === null) {
      this.startTime = this.lastTime = time;
      this.onStart();
    }
    const elapsed = (time - this.startTime) / 1000;
    if (elapsed >= DURATION) {
      if (this.looping) this.play(true);
      else this.stop();
      return;
    }
    // Time-based drag/acceleration prevents refresh-rate-dependent trajectories.
    const dt = Math.min((time - this.lastTime) / 1000, 0.034);
    this.lastTime = time;
    const endFade = Math.min(1, (DURATION - elapsed) / 0.85);
    ctx.clearRect(0, 0, this.width, this.height);
    while (this.cues[this.cueIndex] && this.cues[this.cueIndex]!.at <= elapsed) {
      this.launch(this.cues[this.cueIndex++]!);
    }
    ctx.globalCompositeOperation = "lighter";
    this.drawClouds(dt, endFade);
    this.drawRockets(dt, endFade);
    this.drawParticles(dt, endFade);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    this.frame = requestAnimationFrame(this.render);
  };

  private drawClouds(dt: number, fade: number) {
    const ctx = this.ctx!;
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const cloud = this.smoke[i]!;
      cloud.age += dt;
      if (cloud.age > 2.8) {
        this.smoke.splice(i, 1);
        continue;
      }
      cloud.x += dt * 6;
      cloud.y -= dt * 8;
      const size = cloud.size * (1 + cloud.age * 0.4);
      // Low-opacity haze and gradual bloom, never a screen flash.
      const bloom = Math.sin(Math.min(1, cloud.age / 0.35) * Math.PI) * 0.06;
      ctx.globalAlpha =
        (bloom + 0.022 * Math.sin((cloud.age / 2.8) * Math.PI)) *
        fade *
        this.visibility(cloud.x, cloud.y);
      ctx.drawImage(this.clouds[cloud.color]!, cloud.x - size, cloud.y - size, size * 2, size * 2);
    }
  }

  private drawRockets(dt: number, fade: number) {
    const ctx = this.ctx!;
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i]!;
      rocket.age += dt;
      const t = Math.min(1, rocket.age / rocket.life);
      const eased = 1 - Math.pow(1 - t, 1.65);
      const oldX = rocket.x;
      const oldY = rocket.y;
      rocket.x = rocket.originX + (rocket.targetX - rocket.originX) * eased;
      rocket.y = rocket.originY + (rocket.targetY - rocket.originY) * eased;
      ctx.globalAlpha = 0.7 * fade * this.visibility(rocket.x, rocket.y);
      ctx.strokeStyle = COLORS[1]!;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(oldX, oldY + 13);
      ctx.lineTo(rocket.x, rocket.y);
      ctx.stroke();
      ctx.drawImage(this.sparks[1]!, rocket.x - 5, rocket.y - 5, 10, 10);
      rocket.emission += dt * (this.mobile ? 55 : 110);
      while (rocket.emission >= 1) {
        rocket.emission -= 1;
        this.addParticle(
          rocket.x + random(-1, 1),
          rocket.y + 5,
          random(-9, 9),
          random(22, 65),
          1,
          false,
          true,
        );
      }
      if (t === 1) {
        this.burst(rocket);
        this.rockets.splice(i, 1);
      }
    }
  }

  private drawParticles(dt: number, fade: number) {
    const ctx = this.ctx!;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.age += dt;
      if (p.age >= p.life || p.y > this.height + 35) {
        // Unordered removal avoids shifting thousands of live particles.
        this.particles[i] = this.particles[this.particles.length - 1]!;
        this.particles.pop();
        continue;
      }
      p.historyAge += dt;
      if (p.historyAge >= 1 / 60) {
        p.historyAge %= 1 / 60;
        p.history[p.cursor * 2] = p.x;
        p.history[p.cursor * 2 + 1] = p.y;
        p.cursor = (p.cursor + 1) % HISTORY;
        p.count = Math.min(HISTORY, p.count + 1);
      }
      const drag = Math.exp(-p.drag * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const remaining = 1 - p.age / p.life;
      const ignition = Math.min(1, p.age / 0.045);
      const twinkle =
        p.glitter || remaining < 0.5 ? 0.55 + 0.45 * Math.sin(p.age * 29 + p.phase) ** 2 : 1;
      const alpha =
        Math.pow(remaining, 0.65) * ignition * twinkle * fade * this.visibility(p.x, p.y);
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = COLORS[p.color]!;
      ctx.lineWidth = p.glitter ? 0.55 : 0.85;
      ctx.beginPath();
      const length = p.glitter ? Math.min(3, p.count) : p.count;
      for (let j = 0; j < length; j++) {
        const at = ((p.cursor - length + j + HISTORY) % HISTORY) * 2;
        if (j === 0) ctx.moveTo(p.history[at]!, p.history[at + 1]!);
        else ctx.lineTo(p.history[at]!, p.history[at + 1]!);
      }
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      const size = p.radius * (0.6 + remaining * 0.4);
      ctx.drawImage(this.sparks[p.color]!, p.x - size, p.y - size, size * 2, size * 2);
      if (p.age >= p.splitAt) {
        p.splitAt = Infinity;
        for (let j = 0; j < (this.mobile ? 3 : 6); j++) {
          const a = random(0, TAU);
          const speed = random(14, 38);
          this.addParticle(
            p.x,
            p.y,
            p.vx * 0.3 + Math.cos(a) * speed,
            p.vy * 0.3 + Math.sin(a) * speed,
            0,
            false,
            true,
          );
        }
      }
      // Emission probability is per second, independent of frame rate.
      if (!p.glitter && p.life > 2.4 && Math.random() < dt * (this.mobile ? 2 : 4)) {
        this.addParticle(p.x, p.y, random(-7, 7), random(1, 14), 1, false, true);
      }
    }
  }
}
