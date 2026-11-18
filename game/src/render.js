import { TITLE, STORY, MISSIONS } from "./config.js";
export function createRenderer(engine, world) {
  const { ctx: c } = engine;
  let cam = { x: 0, y: 0 };
  const palette = ["#d7c59e", "#c6d7bf", "#e2b69c", "#d7d9dc"];
  function text(t, x, y, size = 16, color = "#fff", align = "left") {
    c.font = `600 ${size}px system-ui`;
    c.textAlign = align;
    c.fillStyle = color;
    c.fillText(t, x, y);
  }
  function city() {
    c.fillStyle = "#c4b89b";
    c.fillRect(0, 0, world.W, world.H);
    for (let x = 0; x < world.W; x += 200) {
      c.fillStyle = "#777a78";
      c.fillRect(x, 0, 64, world.H);
      c.fillStyle = "#d2c092";
      c.fillRect(x + 4, 0, 56, world.H);
      c.strokeStyle = "#eee0ae";
      c.setLineDash([17, 18]);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 32, 0);
      c.lineTo(x + 32, world.H);
      c.stroke();
      c.setLineDash([]);
    }
    for (let y = 0; y < world.H; y += 190) {
      c.fillStyle = "#737876";
      c.fillRect(0, y, world.W, 60);
      c.fillStyle = "#c9b78f";
      c.fillRect(0, y + 4, world.W, 52);
      c.strokeStyle = "#ebd99e";
      c.setLineDash([17, 18]);
      c.beginPath();
      c.moveTo(0, y + 30);
      c.lineTo(world.W, y + 30);
      c.stroke();
      c.setLineDash([]);
    }
    for (let x = 70; x < world.W; x += 200)
      for (let y = 70; y < world.H; y += 190) {
        let bx = x + 8,
          by = y + 8;
        c.fillStyle = "rgba(30,40,39,.2)";
        c.fillRect(bx + 5, by + 7, 92, 78);
        c.fillStyle = palette[((x + y) % 4) | 0];
        c.fillRect(bx, by, 92, 78);
        c.fillStyle = "#34464a";
        for (let wx = 0; wx < 3; wx++)
          for (let wy = 0; wy < 2; wy++)
            c.fillRect(bx + 12 + wx * 26, by + 12 + wy * 28, 12, 12);
        c.fillStyle = "#35a68b";
        c.fillRect(bx - 8, by + 83, 110, 9);
        c.fillStyle = "#edce79";
        c.beginPath();
        c.arc(bx + 50, by + 100, 13, 0, 7);
        c.fill();
        c.fillStyle = "#286c55";
        c.beginPath();
        c.arc(bx + 50, by + 100, 7, 0, 7);
        c.fill();
      }
    c.fillStyle = "rgba(41,145,135,.27)";
    c.fillRect(0, 0, 27, world.H);
    text("OCEAN DRIVE", 40, 24, 11, "#fff");
  }
  function car(o, police = false) {
    c.save();
    c.translate(o.x, o.y);
    c.rotate(o.a || 0);
    c.fillStyle = "rgba(20,20,20,.25)";
    c.fillRect(-16, -8, 37, 22);
    c.fillStyle = police ? "#f3f0dc" : o.color;
    c.beginPath();
    c.roundRect(-19, -11, 38, 22, 6);
    c.fill();
    c.fillStyle = police ? "#29466b" : "#253a42";
    c.fillRect(-7, -8, 13, 16);
    c.fillStyle = "#ffe7a7";
    c.fillRect(14, -8, 4, 5);
    c.fillRect(14, 3, 4, 5);
    if (police) {
      c.fillStyle = "#c94243";
      c.fillRect(-3, -12, 7, 4);
      c.fillStyle = "#4587cf";
      c.fillRect(4, -12, 7, 4);
    }
    c.restore();
  }
  function player() {
    const p = world.player;
    if (p.car >= 0) {
      car(world.cars[p.car]);
      return;
    }
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle);
    c.fillStyle = "rgba(0,0,0,.3)";
    c.beginPath();
    c.ellipse(0, 3, 10, 6, 0, 0, 7);
    c.fill();
    c.fillStyle = "#e1a477";
    c.beginPath();
    c.arc(0, -1, 6, 0, 7);
    c.fill();
    c.fillStyle = "#32d9c3";
    c.fillRect(-5, 4, 10, 12);
    c.strokeStyle = "#252f3b";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-3, 14);
    c.lineTo(-6, 20);
    c.moveTo(3, 14);
    c.lineTo(6, 20);
    c.stroke();
    c.restore();
  }
  function scene() {
    cam.x = Math.max(
      0,
      Math.min(world.W - engine.width, world.player.x - engine.width / 2),
    );
    cam.y = Math.max(
      0,
      Math.min(world.H - engine.height, world.player.y - engine.height / 2),
    );
    c.save();
    c.translate(-cam.x, -cam.y);
    city();
    for (const k of world.skids) {
      c.save();
      c.translate(k.x, k.y);
      c.rotate(k.a);
      c.fillStyle = `rgba(25,25,25,${Math.min(0.4, k.life * 0.2)})`;
      c.fillRect(-22, -9, 28, 3);
      c.restore();
    }
    world.people.forEach((q) => {
      c.fillStyle = q.police ? "#273d67" : "#d35c4c";
      c.beginPath();
      c.arc(q.x, q.y, 5, 0, 7);
      c.fill();
      c.fillStyle = "#f0c8a2";
      c.beginPath();
      c.arc(q.x, q.y - 7, 3, 0, 7);
      c.fill();
    });
    world.cars.forEach((v, i) => {
      if (i !== world.player.car) car(v);
    });
    world.police.forEach((v) => car(v, true));
    player();
    let m = MISSIONS[world.mission];
    if (m) {
      c.strokeStyle = "#ffe45e";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(m.x, m.y, 18 + Math.sin(world.time * 4) * 3, 0, 7);
      c.stroke();
      c.fillStyle = "#ffe45e";
      c.beginPath();
      c.moveTo(m.x, m.y - 30);
      c.lineTo(m.x - 7, m.y - 40);
      c.lineTo(m.x + 7, m.y - 40);
      c.fill();
    }
    c.restore();
  }
  function minimap() {
    const x = engine.width - 178,
      y = 20,
      s = 150;
    c.fillStyle = "rgba(8,23,29,.85)";
    c.fillRect(x - 7, y - 7, s + 14, s + 14);
    c.save();
    c.translate(x, y);
    c.scale(s / world.W, s / world.H);
    c.fillStyle = "#b7b397";
    c.fillRect(0, 0, world.W, world.H);
    for (let a = 0; a < world.W; a += 200) {
      c.fillStyle = "#596967";
      c.fillRect(a, 0, 64, world.H);
    }
    for (let a = 0; a < world.H; a += 190) {
      c.fillStyle = "#596967";
      c.fillRect(0, a, world.W, 60);
    }
    world.cars.forEach((v) => {
      c.fillStyle = "#65c7d0";
      c.fillRect(v.x - 5, v.y - 3, 10, 6);
    });
    world.police.forEach((v) => {
      c.fillStyle = "#fb6560";
      c.fillRect(v.x - 6, v.y - 4, 12, 8);
    });
    let m = MISSIONS[world.mission];
    if (m) {
      c.fillStyle = "#ffe45e";
      c.beginPath();
      c.arc(m.x, m.y, 12, 0, 7);
      c.fill();
    }
    c.fillStyle = "#45f3d5";
    c.beginPath();
    c.arc(world.player.x, world.player.y, 13, 0, 7);
    c.fill();
    c.restore();
  }
  function hud() {
    const p = world.player,
      m = MISSIONS[world.mission];
    c.fillStyle = "rgba(5,19,27,.82)";
    c.fillRect(18, 18, 370, 126);
    text("VICE LINE  /  LITTLE HAVANA", 34, 43, 16, "#73efdb");
    text(`$ ${p.cash.toLocaleString()}`, 34, 70, 21, "#f2db84");
    c.fillStyle = "#394346";
    c.fillRect(34, 82, 170, 11);
    c.fillStyle = p.health > 30 ? "#60e3b0" : "#ff625d";
    c.fillRect(34, 82, (170 * p.health) / 100, 11);
    text("HEALTH", 214, 93, 12, "#a6b6b5");
    text(
      "★".repeat(Math.ceil(p.wanted)) + "☆".repeat(5 - Math.ceil(p.wanted)),
      34,
      119,
      20,
      "#ffdb69",
    );
    text(
      m ? `MISSION ${world.mission + 1}/4 • ${m.name}` : "ALL JOBS COMPLETE",
      34,
      169,
      15,
      "#fff",
    );
    text(m ? m.objective : "You made it, Mara.", 34, 194, 14, "#c1d1ce");
    if (p.car >= 0)
      text(
        `SPEED ${Math.abs(Math.round(world.cars[p.car].speed * 1.2))} MPH`,
        34,
        223,
        14,
        "#ffe389",
      );
    minimap();
    text(
      "WASD MOVE / DRIVE   E ENTER   SHIFT RUN   SPACE MELEE   F FIRE   P PAUSE",
      20,
      engine.height - 20,
      12,
      "#fff",
    );
  }
  function panel(title, sub, action) {
    c.fillStyle = "rgba(4,16,24,.76)";
    c.fillRect(0, 0, engine.width, engine.height);
    c.fillStyle = "rgba(12,28,37,.94)";
    c.fillRect(
      engine.width * 0.18,
      engine.height * 0.18,
      engine.width * 0.64,
      engine.height * 0.64,
    );
    text(
      "MARA VEGA  •  LITTLE HAVANA, 1987",
      engine.width / 2,
      engine.height * 0.28,
      13,
      "#61e9d1",
      "center",
    );
    text(
      title,
      engine.width / 2,
      engine.height * 0.4,
      Math.min(70, engine.width * 0.07),
      "#ffe08a",
      "center",
    );
    text(sub, engine.width / 2, engine.height * 0.49, 16, "#e3efed", "center");
    const lines = STORY.match(/.{1,78}(?:\s|$)/g) || [];
    lines
      .slice(0, 3)
      .forEach((l, i) =>
        text(
          l,
          engine.width / 2,
          engine.height * 0.55 + i * 22,
          14,
          "#b6c6c3",
          "center",
        ),
      );
    text(
      action,
      engine.width / 2,
      engine.height * 0.75,
      19,
      "#55efda",
      "center",
    );
    text(
      "WASD + MOUSE • E CAR • SHIFT RUN • SPACE MELEE • F PISTOL • P PAUSE",
      engine.width / 2,
      engine.height * 0.82,
      12,
      "#9dadaa",
      "center",
    );
  }
  function draw(screen) {
    engine.clear("#14252a");
    scene();
    if (screen === "play" || screen === "paused") hud();
    if (screen === "title")
      panel(
        TITLE,
        "A sun-faded crime story across the streets of Vice City",
        "CLICK / ENTER  •  NEW GAME     C  •  CONTINUE",
      );
    if (screen === "paused")
      panel(
        "PAUSED",
        "Catch your breath. The city can wait.",
        "P / ESC  •  RESUME",
      );
    if (screen === "busted")
      panel(
        "BUSTED",
        "The Vice City Police Department got their headline.",
        "ENTER  •  BACK TO TITLE",
      );
    if (screen === "end")
      panel(
        "THE LAST LIGHT",
        "The coast is clear. Mara is gone by sunrise.",
        "ENTER  •  PLAY AGAIN",
      );
  }
  return { draw };
}
