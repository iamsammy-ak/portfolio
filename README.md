# Abhishek Kumar — hand-drawn 3D portfolio

An interactive sketchbook world (inspired by itomdev.com): a torn-paper loader,
a brick building you walk into, a 3D corridor with doors to four rooms, and a
map / achievements HUD. Everything is drawn procedurally on `<canvas>` in a
pencil style — there are no image files to manage.

Open `index.html` in a browser (double-click works; no build, no server).
Needs internet for three.js, GSAP and Google Fonts.

## Rooms

| Door          | What it is                                                     |
| ------------- | -------------------------------------------------------------- |
| The Gallery   | rooftop clothesline — projects & hackathons, click to inspect  |
| The Office    | floating screens — one per role, drag to rotate                |
| About         | paper-plane flight — intro, skills balloons, journey islands, awards |
| Contact       | pier in the sea — signposts for GitHub, LinkedIn, email, CV    |
| End of corridor | opens your CV                                                |

## Controls

| Input                         | What it does                                        |
| ----------------------------- | --------------------------------------------------- |
| Scroll / swipe up-down        | walk the corridor, fly through About                |
| Drag, trackpad swipe, ← →     | look left / right in the corridor (doors are on the walls) |
| Drag or ← → in Gallery/Office | slide the clothesline / rotate the screens          |
| Click (or Enter on a hovered thing) | open doors, posters, screens, signposts       |

## Updating your content

Edit **`data.js`** only. Sections: `meta` (name, `hello`/`role`/`tagline` for
the entrance card, links), `entrance` (sign, `cue`, three `stats` sticky notes,
door stickers), `corridor` (room signs, wall frames), `gallery.projects`,
`studio.items`, `about`, `contact.methods`. Drop a new CV at
`assets/Abhishek_Kumar_CV.pdf` when you have one.

## Colours

Every wash in the 3D world comes from one palette, `SK.PAL` at the top of
`js/sketch.js` (sky, leaf, wood, sun, coral, lilac…). The CSS mirrors the same
values in `:root` of `styles.css`. Change a colour there and it changes everywhere.

## Code map

```
index.html        page shell, HUD, overlays, paper-tear
styles.css        UI layer (torn-paper sheets, map, modal, hint)
data.js           ← all your content
js/sketch.js      pencil-line drawing helpers (Pen) + three.js glue
js/art.js         every drawing: bricks, planks, tree, cat, doors, posters…
js/core.js        renderer, virtual scroll, raycasting, transitions, HUD
js/scenes/*.js    home (entrance + corridor), gallery, studio, about, contact
```
