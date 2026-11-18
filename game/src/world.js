import { MISSIONS, SAVE_KEY } from "./config.js";
export function makeWorld(seed = 1) {
  const initialSeed = seed >>> 0 || 1;
  let s = initialSeed;
  const rand = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
  const W = 1200,
    H = 760;
  const player = {
    x: 90,
    y: 370,
    angle: 0,
    health: 100,
    cash: 250,
    car: -1,
    wanted: 0,
    heat: 0,
    package: false,
  };
  const cars = Array.from({ length: 17 }, (_, i) => ({
    x: 90 + (i % 6) * 190 + rand() * 40,
    y: 90 + Math.floor(i / 6) * 240 + rand() * 80,
    a: rand() * 6.28,
    color: ["#d9b95f", "#46a9bb", "#be5b56", "#d2d1cb", "#6473bc"][i % 5],
    traffic: i < 8,
    speed: 18 + rand() * 15,
    stolen: false,
  }));
  const people = Array.from({ length: 24 }, () => ({
    x: rand() * W,
    y: rand() * H,
    a: rand() * 6.28,
    t: rand() * 3,
    police: false,
    health: 100,
  }));
  const startingCars = cars.map((car) => ({ ...car }));
  const startingPeople = people.map((person) => ({ ...person }));
  return {
    W,
    H,
    player,
    cars,
    people,
    police: [],
    mission: 0,
    done: false,
    time: 0,
    lastFire: 0,
    seed,
    rand,
    particles: [],
    skids: [],
    reset() {
      s = initialSeed;
      cars.forEach((car, index) => Object.assign(car, startingCars[index]));
      people.forEach((person, index) =>
        Object.assign(person, startingPeople[index]),
      );
      player.x = 90;
      player.y = 370;
      player.angle = 0;
      player.health = 100;
      player.cash = 250;
      player.car = -1;
      player.wanted = 0;
      player.heat = 0;
      player.package = false;
      this.seed = initialSeed;
      this.mission = 0;
      this.done = false;
      this.time = 0;
      this.police = [];
      this.particles = [];
      this.skids = [];
      this.busted = false;
      this.lastFire = 0;
    },
    save() {
      try {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({
            cash: player.cash,
            mission: this.mission,
            x: player.x,
            y: player.y,
          }),
        );
      } catch {}
    },
    load() {
      try {
        const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
        if (!d) return false;
        if (!d || !Number.isFinite(d.cash) || !Number.isInteger(d.mission))
          return false;
        if (!Number.isFinite(d.x) || !Number.isFinite(d.y)) return false;
        player.cash = Math.max(0, d.cash);
        this.mission = Math.max(0, Math.min(MISSIONS.length, d.mission));
        this.done = this.mission === MISSIONS.length;
        player.x = Math.max(8, Math.min(W - 8, d.x));
        player.y = Math.max(8, Math.min(H - 8, d.y));
        return true;
      } catch {
        return false;
      }
    },
    step(dt, input) {
      this.time += dt;
      const p = player;
      let obj = p.car >= 0 ? cars[p.car] : p;
      let throttle = (input.up ? 1 : 0) - (input.down ? 1 : 0),
        steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (p.car >= 0) {
        const c = cars[p.car];
        c.a += steer * dt * (throttle < 0 ? -1 : 1) * 1.8;
        c.speed = Math.max(-85, Math.min(185, c.speed + throttle * dt * 90));
        c.speed *= Math.pow(0.985, dt * 60);
        c.x += Math.cos(c.a) * c.speed * dt;
        c.y += Math.sin(c.a) * c.speed * dt;
        c.x = Math.max(20, Math.min(W - 20, c.x));
        c.y = Math.max(20, Math.min(H - 20, c.y));
        p.x = c.x;
        p.y = c.y;
        p.angle = c.a;
        if (Math.abs(steer) && Math.abs(c.speed) > 65 && rand() < dt * 1.8)
          this.skids.push({ x: c.x, y: c.y, a: c.a, life: 2 });
      } else {
        p.angle = Math.atan2(input.my ?? p.y, input.mx ?? p.x);
        let speed = input.run ? 132 : 83;
        let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0),
          dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
        const n = Math.hypot(dx, dy) || 1;
        p.x = Math.max(8, Math.min(W - 8, p.x + (dx / n) * speed * dt));
        p.y = Math.max(8, Math.min(H - 8, p.y + (dy / n) * speed * dt));
      }
      for (let i = 0; i < cars.length; i++) {
        const c = cars[i];
        if (c.traffic && i !== p.car) {
          c.x += Math.cos(c.a) * c.speed * dt;
          c.y += Math.sin(c.a) * c.speed * dt;
          if (c.x < 20 || c.x > W - 20) c.a = Math.PI - c.a;
          if (c.y < 20 || c.y > H - 20) c.a = -c.a;
        }
      }
      for (const q of people) {
        q.t -= dt;
        if (q.t <= 0) {
          q.a += (rand() - 0.5) * 2;
          q.t = 1 + rand() * 4;
        }
        q.x += Math.cos(q.a) * 15 * dt;
        q.y += Math.sin(q.a) * 15 * dt;
        q.x = (q.x + W) % W;
        q.y = (q.y + H) % H;
      }
      if (input.enter) {
        if (p.car >= 0) {
          p.car = -1;
          p.x += Math.cos(p.angle + 1.57) * 28;
          p.y += Math.sin(p.angle + 1.57) * 28;
        } else {
          let best = 52,
            idx = -1;
          cars.forEach((c, i) => {
            const d = Math.hypot(c.x - p.x, c.y - p.y);
            if (d < best) {
              best = d;
              idx = i;
            }
          });
          if (idx >= 0) {
            p.car = idx;
            cars[idx].stolen = true;
            cars[idx].traffic = false;
            p.wanted = Math.min(5, p.wanted + 0.65);
            p.heat = 14;
            this.police.push({ x: p.x - 160, y: p.y - 120, a: 0, foot: false });
          }
        }
      }
      if (input.fire && this.time > this.lastFire + 0.35) {
        this.lastFire = this.time;
        this.particles.push({
          x: p.x + Math.cos(p.angle) * 30,
          y: p.y + Math.sin(p.angle) * 30,
          life: 0.5,
        });
        for (const q of people)
          if (q.health > 0 && Math.hypot(q.x - p.x, q.y - p.y) < 135) {
            q.health = Math.max(0, q.health - 35);
            q.a += Math.PI;
            p.wanted = Math.min(5, p.wanted + 0.35);
            p.heat = 12;
            break;
          }
      }
      if (input.melee && p.car < 0) {
        for (const q of people)
          if (q.health > 0 && Math.hypot(q.x - p.x, q.y - p.y) < 38) {
            q.health = Math.max(0, q.health - 50);
            q.a += Math.PI;
            p.wanted = Math.min(5, p.wanted + 0.2);
            p.heat = 9;
            break;
          }
      }
      if (p.wanted > 0) {
        if (p.heat > 0) p.heat -= dt;
        else if (
          !this.police.some((c) => Math.hypot(c.x - p.x, c.y - p.y) < 245)
        )
          p.wanted = Math.max(0, p.wanted - dt * 0.11);
        if (this.police.length < Math.ceil(p.wanted) && rand() < dt * 0.7)
          this.police.push({
            x: Math.max(5, Math.min(W - 5, p.x + (rand() - 0.5) * 470)),
            y: Math.max(5, Math.min(H - 5, p.y + (rand() - 0.5) * 470)),
            a: 0,
            foot: rand() < 0.25,
          });
      }
      for (const cop of this.police) {
        const a = Math.atan2(p.y - cop.y, p.x - cop.x);
        cop.a = a;
        const v = cop.foot ? 42 : 79;
        cop.x += Math.cos(a) * v * dt;
        cop.y += Math.sin(a) * v * dt;
        if (Math.hypot(cop.x - p.x, cop.y - p.y) < 19) {
          p.health -= dt * 14;
          if (p.health <= 0) this.busted = true;
        }
      }
      this.skids = this.skids.filter((k) => (k.life -= dt) > 0);
      this.particles = this.particles.filter((k) => (k.life -= dt) > 0);
      const m = MISSIONS[this.mission];
      if (m && Math.hypot(p.x - m.x, p.y - m.y) < 58) {
        if (this.mission === 0 && p.car < 0) return;
        if (this.mission === 1) p.package = true;
        if (this.mission === 2 && p.wanted > 0.1) return;
        p.cash += m.reward;
        this.mission++;
        if (this.mission >= MISSIONS.length) {
          this.done = true;
          this.save();
        } else this.save();
      }
    },
  };
}
