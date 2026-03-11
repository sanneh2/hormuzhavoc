# Hormuz Havoc 🚢

> Arcade-style browser survival game — navigate the Strait of Hormuz and don't get blown up.

![Hormuz Havoc](https://img.shields.io/badge/status-playable-brightgreen) ![Tech](https://img.shields.io/badge/stack-Phaser%203%20%2B%20Vite-blue)

---

## Play

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Controls

| Key | Action |
|-----|--------|
| `←` / `A` | Steer left |
| `→` / `D` | Steer right |
| Touch drag | Steer (mobile) |

---

## Gameplay

- Your tanker automatically moves forward through the Strait.
- **Avoid** mines (drifting circles with spikes), rockets (fast, straight), speedboats (zigzag) and drone strikes (warning circle → explosion).
- **Collect** oil barrels (+$10), insurance payouts (+$25) and navigation bonuses (slow motion!).
- Difficulty ramps every 20 seconds — eventually reaching **CHAOS MODE**.
- High scores persist via `localStorage`.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Game engine | [Phaser 3](https://phaser.io/) |
| Build tool | [Vite 5](https://vitejs.dev/) |
| Language | JavaScript ES6 |
| Rendering | HTML5 Canvas |
| Storage | localStorage |

No backend required — fully static.

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy that folder to:

- **Vercel** — `vercel --prod`
- **Netlify** — drag `dist/` into the Netlify dashboard, or `netlify deploy --prod --dir dist`
- **Cloudflare Pages** — connect repo, build command `npm run build`, publish dir `dist`
- **GitHub Pages** — push `dist/` to `gh-pages` branch (or use `gh-pages` npm package)

---

## Project Structure

```
hormuz-havoc/
├── index.html
├── style.css
├── vite.config.js
├── package.json
└── src/
    ├── main.js              # Phaser game config & boot
    ├── scenes/
    │   ├── BootScene.js     # Asset generation + splash screen
    │   ├── GameScene.js     # Core gameplay loop
    │   ├── UIScene.js       # HUD overlay (time, money, high score)
    │   └── GameOverScene.js # End screen + restart
    └── objects/
        ├── PlayerShip.js    # Player tanker (physics + controls)
        ├── Mine.js          # Drifting mine obstacle
        ├── Rocket.js        # Fast straight rocket
        ├── Speedboat.js     # Zigzagging speedboat
        ├── Collectible.js   # Barrel / insurance / nav bonus
        └── Drone.js         # Warning → explosion drone strike
```

---

## Score System

| Item | Reward |
|------|--------|
| Oil Barrel | +$10 |
| Insurance Payment | +$25 |
| Navigation Bonus | Slow-motion + $5 |

Survive as long as possible and collect as much money as you can!

---

## Humor Elements

Random popup quips appear during gameplay:

- *"Insurance premium increased!"*
- *"GPS signal lost!"*
- *"Lloyd's of London: No comment."*
- *"Sanctions loading..."*

---

## License

MIT — go nuts.
