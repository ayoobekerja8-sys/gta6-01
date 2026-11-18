import { makeWorld } from "./world.js";
import { createEngine } from "../vendor/vice-engine.js";
import { createRenderer } from "./render.js";
import { stageShot } from "./shots.js";
const canvas = document.querySelector("#game"),
  status = document.querySelector("#status"),
  params = new URLSearchParams(location.search),
  seed = Number(params.get("seed")) || 1,
  world = makeWorld(seed),
  engine = createEngine(canvas),
  renderer = createRenderer(engine, world);
let screen = "title",
  last = performance.now(),
  acc = 0,
  keys = {},
  mouse = { x: 0, y: 0 },
  music = null;
function audio() {
  if (music) return;
  try {
    let A = window.AudioContext || window.webkitAudioContext;
    if (!A) return;
    music = new A();
    let o = music.createOscillator(),
      g = music.createGain();
    o.type = "triangle";
    o.frequency.value = 55;
    g.gain.value = 0.018;
    o.connect(g);
    g.connect(music.destination);
    o.start();
    let eo = music.createOscillator(),
      eg = music.createGain();
    eo.type = "sawtooth";
    eo.frequency.value = 38;
    eg.gain.value = 0;
    eo.connect(eg);
    eg.connect(music.destination);
    eo.start();
    music.engineOsc = eo;
    music.engineGain = eg;
  } catch {}
}
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k))
    e.preventDefault();
  keys[k] = true;
  if (["enter", " "].includes(k)) {
    audio();
    if (screen === "busted" || screen === "end") {
      world.reset();
      screen = "title";
    } else if (screen === "title") {
      screen = "play";
      world.save();
    } else if (screen === "paused") screen = "play";
  }
  if (k === "p" || k === "escape") {
    if (screen === "play") screen = "paused";
    else if (screen === "paused") screen = "play";
  }
  if (k === "c" && screen === "title") {
    world.load();
    screen = world.done ? "end" : "play";
  }
});
addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
canvas.addEventListener("click", () => {
  audio();
  if (screen === "title") {
    screen = "play";
    world.save();
  } else if (screen === "paused") screen = "play";
});
addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
let enterLatch = false,
  fireLatch = false,
  meleeLatch = false;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (screen === "play") {
    acc += dt;
    while (acc > 1 / 60) {
      const p = world.player;
      const act = {
        up: keys.w || keys.arrowup,
        down: keys.s || keys.arrowdown,
        left: keys.a || keys.arrowleft,
        right: keys.d || keys.arrowright,
        run: keys.shift,
        enter: keys.e && !enterLatch,
        fire: keys.f && !fireLatch,
        melee: keys[" "] && !meleeLatch,
        mx: p.x + (mouse.x - engine.width / 2),
        my: p.y + (mouse.y - engine.height / 2),
      };
      enterLatch = !!keys.e;
      fireLatch = !!keys.f;
      meleeLatch = !!keys[" "];
      world.step(1 / 60, act);
      if (world.busted) screen = "busted";
      if (world.done) screen = "end";
      acc -= 1 / 60;
    }
  }
  if (music?.engineGain) {
    const driving = screen === "play" && world.player.car >= 0;
    music.engineGain.gain.setTargetAtTime(
      driving ? 0.035 : 0,
      music.currentTime,
      0.12,
    );
    music.engineOsc.frequency.setTargetAtTime(
      driving ? 58 + Math.abs(world.cars[world.player.car].speed) * 0.8 : 38,
      music.currentTime,
      0.08,
    );
  }
  renderer.draw(screen);
  status.textContent =
    screen === "play"
      ? `Mission ${world.mission + 1}. Cash ${world.player.cash}. Health ${Math.round(world.player.health)}.`
      : `${screen} screen`;
}
if (params.has("shot")) {
  const shot = stageShot(params.get("shot"), world);
  screen = shot;
  renderer.draw(screen);
  requestAnimationFrame(() => {
    renderer.draw(screen);
    window.__shotReady = true;
  });
} else requestAnimationFrame(frame);
