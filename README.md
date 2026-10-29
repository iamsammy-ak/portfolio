<div align="center">

# ✏️ Abhishek Kumar — a portfolio you walk through

**A hand-drawn 3D sketchbook world.** Tear the paper, knock on the door, walk the corridor, open the rooms.

[![Live site](https://img.shields.io/badge/live-iamsammy--ak.github.io%2Fportfolio-e2574b?style=for-the-badge&logo=githubpages&logoColor=white)](https://iamsammy-ak.github.io/portfolio/)
[![three.js](https://img.shields.io/badge/three.js-r152-5f93b8?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org)
[![GSAP](https://img.shields.io/badge/GSAP-3.12-6b985a?style=for-the-badge&logo=greensock&logoColor=white)](https://gsap.com)
[![No build](https://img.shields.io/badge/build-none%20needed-f6cf5a?style=for-the-badge)](#run-it-locally)

<sub>*“Computer engineer by training, manager by ambition.”*</sub>

**[▶ Open the site](https://iamsammy-ak.github.io/portfolio/)** · click the door to come in

</div>

---

## hello, I'm Abhishek

Engineering Management M.Sc. student at **Politecnico di Torino**, previously a computer engineer, a data analyst and a management trainee. I like building things at the edge of engineering and business. Based in Turin, Italy.

<table>
<tr>
<td align="center"><h3>3</h3>hackathon podiums</td>
<td align="center"><h3>1,000+</h3>students reached as PISA president</td>
<td align="center"><h3>40%</h3>faster reporting at Fibzio</td>
</tr>
</table>

---

## 🚪 The rooms

Everything on the site is drawn procedurally on `<canvas>` in pencil and watercolour. There are no image files at all. The world is a brick building with a corridor and four doors.

| Door | What you find |
| --- | --- |
| **The Gallery** | Projects and hackathons as posters pegged on a rooftop clothesline. Click one to inspect it. |
| **The Office** | Floating screens, one per role. Drag to spin them around. |
| **About** | A paper-plane flight through the clouds: skills as balloons, the journey as islands, awards as medals. |
| **Contact** | A pier in the sea with signposts to GitHub, LinkedIn, email and my CV. |
| **End of the corridor** | Opens the CV. |

Along the way you collect six achievements: *Explorer, Wanderer, Art Critic, Director, Sky Walker, Sociable*. There is a map in the corner if you get lost.

### Controls

| Input | What it does |
| --- | --- |
| Scroll or swipe up and down | Walk the corridor, fly through About |
| Drag, trackpad swipe, `←` `→` | Look left and right in the corridor |
| Drag or `←` `→` in Gallery / Office | Slide the clothesline, rotate the screens |
| Click, or `Enter` on a hovered thing | Open doors, posters, screens, signposts |

---

## 🏆 What hangs in the Gallery

| Project | Result | Event | What it is |
| --- | --- | --- | --- |
| **cityX** | 🥇 1st place | LOKI Urban Monitoring Hackathon | AI civic-intelligence platform turning street reports into prioritised incidents, with geospatial analysis and duplicate detection |
| **Risk Radar** | 🥈 2nd place | Automation Hackathon | AI supply-chain risk platform built in five hours, surfacing geopolitical, weather and logistics risks for 1,000+ vendors |
| **Weld AI** | 🥇 1st place | Therness Hackathon | 1,551 welding samples across thermal video, audio and sensors, detecting six defect categories |
| **VR Homes** | MVP shipped | OpenSky VR Italia | 3D walkthroughs and VR previews with React, Angular, Matterport and LiDAR, cutting presentation time by ~30% |
| **Chess × Red Bull** | 400+ players | PISA | Red Bull sponsored chess tournament: budget, sponsorship, logistics and volunteers |

## 🖥️ What glows in the Office

| Role | Where | When |
| --- | --- | --- |
| Technical Management Trainee | OpenSky VR Italia | Jan 2025 – Jun 2025 |
| Junior Data Analyst | Fibzio | Sep 2023 – Dec 2024 |
| President | Politecnico Indian Students Association (PISA) | Apr 2023 – present |
| Logistics Coordinator | Torino 2025 FISU Games | May 2024 – Jul 2024 |
| Marketing Manager | AIESEC | Nov 2022 – Jun 2023 |

## 🎈 Balloons in the sky

`Python` `SQL` `Power BI` `AI / ML` `MATLAB` `Docker` `Figma` `React` `Excel` `JIRA` `Notion` `Market Research` `Project Mgmt` `Public Speaking`

**Awards and certificates:** INSIDE LVMH · McKinsey Forward Program · CS50 (Harvard) · Therness Hackathon 1st · LOKI Hackathon 1st · Automation Hackathon 2nd

**Languages:** Hindi (native) · English (professional) · Italian (beginner)

---

## 🛠️ How it is built

Inspired by the wonderful [itomdev.com](https://itomdev.com). Plain ES5-style scripts loaded from CDNs, so the whole thing runs by opening one HTML file.

- **three.js** for the scenes, **GSAP** for every transition and the door swing.
- A tiny pencil engine, `SK.Pen`, draws wobbly strokes, hatching, handwriting and paper textures onto canvases that become WebGL textures.
- One watercolour palette, `SK.PAL`, colours the whole world. The CSS mirrors it in `:root`.
- Virtual scroll with easing drives walking and flying. A raycaster handles hover and click.
- Every word of content lives in **one file**, `data.js`.

```
index.html        page shell, HUD, overlays, paper tear
styles.css        UI layer: torn-paper sheets, map, modal, sticky-note hints
data.js           ← all the content
js/sketch.js      pencil-line drawing helpers (Pen) + three.js glue
js/art.js         every drawing: bricks, planks, tree, cat, doors, posters, avatar…
js/core.js        renderer, virtual scroll, raycasting, transitions, HUD
js/scenes/*.js    home (entrance + corridor), gallery, studio, about, contact
```

## Run it locally

```bash
git clone https://github.com/iamsammy-ak/portfolio.git
cd portfolio
# then open index.html in a browser, or:
python -m http.server 8000
```

Needs an internet connection for three.js, GSAP and Google Fonts.

## Make it yours

Edit **`data.js`** only. Sections: `meta` (name, `hello`, `role`, `tagline`, links), `entrance` (sign, `cue`, the three sticky-note `stats`, door stickers), `corridor` (room signs, wall frames), `gallery.projects`, `studio.items`, `about`, `contact.methods`. Drop a new CV at `assets/Abhishek_Kumar_CV.pdf`.

To change the colours, edit `SK.PAL` at the top of `js/sketch.js` and the matching variables in `:root` of `styles.css`.

---

<div align="center">

**Say hello** · [LinkedIn](https://www.linkedin.com/in/sammy4bhishek/) · [GitHub](https://github.com/iamsammy-ak) · [kumarabhishekk363@gmail.com](mailto:kumarabhishekk363@gmail.com) · [CV](assets/Abhishek_Kumar_CV.pdf)

<sub>Drawn in pencil, coloured in watercolour, rendered in WebGL. Turin, 2026.</sub>

</div>
