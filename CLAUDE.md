# CLAUDE.md — Game Xếp Hình Tốc Độ Maycha Festival

## Project Overview
Single-file HTML game: Speed Jigsaw 6×6 puzzle minigame for Facebook Messenger Bot.
- Theme: Festive Effervescence — Maycha Festival 30/4-1/5
- Aesthetic: Warm cream, coral-red (#b71029), gold (#ffc967), soft shadows
- Tech: Vanilla HTML/CSS/JS, Tailwind CDN, Google Fonts, no framework

## Key Files
- `index.html` — Main game (single file, ~2000 lines)
- `DESIGN.md` — Design specification
- `start.html`, `ingame.html`, `result.html` — Reference screenshots
- `webhook/` — NocoDB webhook server (Node.js)

## Game Flow
1. **screen-lead** — Enter phone number → save lead
2. **screen-start** — Intro screen with prize teaser → "Bắt đầu chơi"
3. **screen-game** — 6×6 puzzle board, 60s countdown, piece tray
4. **screen-result** — Win/lose, voucher code, share

## Game Constants
```js
const GRID_SIZE     = 6;
const TOTAL_PIECES  = 36;
const GAME_TIME     = 60; // seconds
```

## Puzzle Image
Generated **inline** via `buildPuzzleImage()` — draws bubble tea cup, boba pearls, ribbon banner, grid lines on a 600×600 canvas. No external image URL (avoids CORS issues).

## Puzzle Rendering (CRITICAL — Read Before Editing)
Pieces use **CSS background-image + background-position** (NOT canvas):
```js
// Each piece/tray-item uses:
item.style.backgroundImage = `url(${puzzleDataURL})`;
item.style.backgroundSize  = `600%`;   // 6 × 100%
item.style.backgroundPosition = `${col * 16.667}% ${row * 16.667}%`;
```
- `fullImage` = 600×600 canvas created once in `initGame()`
- `puzzleDataURL` = `fullImage.toDataURL()` called once per render pass
- Board slots: ghost preview at opacity 0.35 (white semi-transparent bg)
- Placed slots: solid opacity 1 with inner `<div>` showing correct piece

## Hint System
- **5 hints per round** (stored in `hintCount`)
- Badge on button shows remaining count (e.g. `5`, `4`, `3`...)
- Button deactivates at 0: `opacity: 0.4`, `pointerEvents: none`
- Clicking a piece does NOT auto-highlight target slot — only Gợi ý button does
- Auto-selects first unplaced piece + glow animation on correct slot

## CSS Key Selectors
| Selector | Purpose |
|---|---|
| `.puzzle-grid` | 6-col CSS grid, `aspect-ratio: 1`, `width: 100%` |
| `.puzzle-slot` | Board cell, ghost preview via CSS bg, `opacity: 0.35` |
| `.puzzle-slot.filled` | Placed piece, solid image shown |
| `.puzzle-slot.target` | Glow outline when Gợi ý active |
| `.piece-item` | Tray piece, `80×80px`, CSS bg with position |

## Bugs Fixed (Do Not Revert)
1. **Pieces not showing** — Was creating 36 canvas elements each calling `drawImage()` on 600×600 source. Fixed: CSS background-image per piece.
2. **Grid no width** — `.puzzle-grid` missing `width: 100%` so `aspect-ratio: 1` had no reference. Fixed.
3. **Slot filled white** — `.puzzle-slot.filled { background: transparent }` was overriding CSS bg. Fixed: removed `background: transparent`.
4. **Auto-hint on tap** — Clicking piece auto-highlighted slot. Fixed: removed target highlight from `selectPiece()`.
5. **1 hint per game** — Was using `hintUsed` boolean. Fixed: `hintCount = 5`.

## NocoDB Integration
Webhook POST to `/api/lead` with `{ phone, source: 'WEB', fb_sender }`.
Webhook server in `webhook/server.js` — saves to NocoDB `leads` table.

## Git
```bash
git remote add origin https://github.com/TuanThanh1609/game-xep-hinh.git
git branch -M main
git push -u origin main
```
