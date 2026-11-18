import { MISSIONS } from "./config.js";
export function stageShot(name, w) {
  w.reset();
  const p = w.player;
  if (name === "start") return "title";
  if (name === "play") {
    p.car = 0;
    p.x = w.cars[0].x;
    p.y = w.cars[0].y;
    p.wanted = 0;
    for (let i = 0; i < 480; i++) {
      w.step(1 / 60, { up: true, right: i % 120 > 80, enter: false });
    }
    return "play";
  }
  if (name === "chase") {
    p.car = 2;
    p.x = 430;
    p.y = 380;
    p.wanted = 3.1;
    p.heat = 8;
    w.police = [
      { x: 300, y: 330, a: 0, foot: false },
      { x: 590, y: 470, a: 0, foot: false },
      { x: 420, y: 560, a: 0, foot: false },
    ];
    for (let i = 0; i < 180; i++) {
      w.step(1 / 60, { up: true, left: i % 130 > 95 });
      if (w.busted) {
        w.busted = false;
        p.health = 75;
      }
    }
    return "play";
  }
  if (name === "end") {
    w.mission = 3;
    p.cash = 8250;
    p.x = MISSIONS[3].x;
    p.y = MISSIONS[3].y;
    w.step(1 / 60, {});
    return "end";
  }
  return "title";
}
