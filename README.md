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
| **The Lab** | A workshop rolodex: every public GitHub repo is an index card, pulled live from the GitHub API. Scroll to flip, click the front card for details and links. |
| **Contact** | A pier in the sea with signposts to GitHub, LinkedIn, email and my CV. |
| **End of the corridor** | A filing cabinet, one drawer per CV. Pulling a drawer opens that CV in a folder on the page. |

Along the way you collect six achievements: *Explorer, Wanderer, Art Critic, Director, Sky Walker, Sociable*. There is a map in the corner if you get lost.

### Controls

| Input | What it does |
| --- | --- |
| Scroll, swipe, `W` `S` | Walk the corridor. Turned round, scrolling walks you back |
| Drag, trackpad swipe, `A` `D`, `←` `→` | Turn, all the way round if you like |
| Browser back / forward, `←` button | Move between rooms. Leaving a room puts you back in its doorway |
| Drag or `←` `→` in Gallery / Office | Slide the clothesline, rotate the screens |
| Scroll, drag or `↑` `↓` in the Lab | Flip the rolodex one card at a time |
| Click, or `Enter` on a hovered thing | Open doors, posters, screens, signposts |

---

## 📱 On a phone

The whole site works on touch screens.

- **Swipe up or down** to walk. **Swipe sideways** to look around. Each swipe locks to one direction, so walking never twists the view.
- **Tap** doors, posters, screens, drawers, the lamp, the mailbox and the pets.
- On tall screens the lens widens so the house, the corridor walls and every room fit.
- Panels such as the CV folder, the one-page summary, the map and the sound settings reflow for small screens and keep clear of the notch.
- Hints say tap and swipe instead of click and scroll.
- Rendering is lighter on phones so it stays smooth and cool.

## 🏡 Outside

The original brick house, rebuilt from 3D parts. It has a tiled pitched roof with a chimney, stone corners, a plinth and a cornice, and a stone door surround with a step. The recessed windows have white frames, green shutters and coral curtains, and there's a flower box. The PORTFOLIO sign hangs on chains and sways. Bunting, the tree, the cat and Turin on the hills complete the street.

- **Click the street lamp** to switch between day and night. Night brings a moon, stars and lit windows, and the choice is remembered.
- **Click the mailbox** to go straight to Contact.
- **Sofia**, a German Shepherd, sits by the door. Click her and she barks, gets up and wanders the garden. **Luna** the cat sits by the mailbox and follows your cursor. At night both walk to their shelters, a kennel with SOFIA over the door and a little house marked LUNA, and sleep until morning. Both are real 3D models with cartoon shading.

## 🖼️ The corridor is a small museum

Between the doors hang public-domain paintings in gilded frames, each with a museum label, plus typeset quotations from Drucker, Deming, Alan Kay and Van Gogh. Near the end there is a stretch of graffiti, and the Gallery rooftop and the Lab room are sprayed too. The graffiti is drawn in code, not copied from anyone.

Each door is painted in a colour from Turin and opens into a lit room you can see into before you walk through.

| Painting | Artist | Year |
| --- | --- | --- |
| The Starry Night | Vincent van Gogh | 1889 |
| The Great Wave off Kanagawa | Katsushika Hokusai | c. 1831 |
| Water Lilies | Claude Monet | 1906 |
| Sunflowers | Vincent van Gogh | 1888 |
| Girl with a Pearl Earring | Johannes Vermeer | c. 1665 |
| The Kiss | Gustav Klimt | 1908 |
| Mona Lisa | Leonardo da Vinci | c. 1503 |
| Impression, Sunrise | Claude Monet | 1872 |

Images are public domain, via Wikimedia Commons, stored in `assets/art/`. Change or add them under `corridor.paintings` in `data.js`.

## 🎵 Sound and light

Each room has its own generative piece, made in the browser in `js/audio.js`:

| Room | Music | Ambience |
| --- | --- | --- |
| Outside | Garden morning | birds by day, crickets at night |
| Corridor | Corridor lo-fi | |
| Gallery | Rooftop waltz | wind |
| Office | Office focus | |
| Lab | Lab sequencer | |
| About | Story in the clouds | wind |
| Contact | Seaside | waves |

Sofia's bark and Luna's meow are real recordings from Wikimedia Commons, stored in `assets/audio/`. The bark is "Barking of a dog" by Amada44, licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The meow is "Meow of a Siamese cat" by freemaster2, licensed CC0.

Other effects are generated: heel-and-toe footsteps, a key turning and the latch releasing before each door creaks open, paper tears, card flips and a chime for achievements. Nothing is downloaded.

The speaker button opens **Sound & light**. It has a sound switch, separate volumes for music, ambience and effects, and a day/night switch. Night applies to every room, and so does the street lamp outside. To play your own licensed track instead, put the mp3 in `assets/audio/` and set `audio.music` in `data.js`.

## 💼 For recruiters

The briefcase button, or the link on the entrance card, opens a one-page summary. It has experience, selected work, education, skills and contact buttons, readable in under a minute. It is also reachable directly at `#brief`.

## 📁 CVs for different roles

The CV is read on the page itself, rendered with pdf.js inside a manila folder with one tab per version. The **CV** button in the top bar opens it from anywhere, and `#cv` links straight to it.

To add a version, upload a PDF to `assets/cv/`, for example `Data-Analyst.pdf`. On the live site it appears automatically as a new drawer and tab named after the file. Replacing a PDF updates what visitors see. To give a version a nicer title, a note or a fixed order, list it under `cv.files` in `data.js`.

## 🧪 Projects from GitHub

The Lab asks the GitHub API for public repos on every visit and caches the answer for six hours, so a new repo shows up on its own. Forks are skipped. In `data.js` under `github` you can hide repos, pin a few to the front, and add nicer titles and notes. The `snapshot` there is only the offline fallback.

Rooms have shareable links: `#gallery`, `#studio`, `#lab`, `#about`, `#contact`.

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
js/art.js         every drawing: planks, doors, posters, paintings, graffiti, avatar…
js/art-house.js   house materials, garden, Turin skyline, moon, stars, birds
js/pets.js        Sofia the German Shepherd, Luna the cat and their shelters, in 3D
js/audio.js       generated music and sound effects
js/core.js        renderer, virtual scroll, raycasting, transitions, HUD
js/github.js      live repo list for the Lab (GitHub API + cache + snapshot)
js/cv.js          the CV folder: finds PDFs, renders them with pdf.js
js/scenes/*.js    home (entrance + corridor), gallery, studio, lab, about, contact
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

Edit **`data.js`** only. Sections: `meta` (name, `hello`, `role`, `tagline`, links), `entrance` (sign, `cue`, the three sticky-note `stats`, door stickers), `corridor` (room signs, wall frames), `gallery.projects`, `studio.items`, `github`, `cv`, `about`, `contact.methods`. Role-specific CVs go in `assets/cv/`.

To change the colours, edit `SK.PAL` at the top of `js/sketch.js` and the matching variables in `:root` of `styles.css`.

---

<div align="center">

**Say hello** · [LinkedIn](https://www.linkedin.com/in/sammy4bhishek/) · [GitHub](https://github.com/iamsammy-ak) · [kumarabhishekk363@gmail.com](mailto:kumarabhishekk363@gmail.com) · [CV](assets/Abhishek_Kumar_CV.pdf)

<sub>Drawn in pencil, coloured in watercolour, rendered in WebGL. Turin, 2026.</sub>

</div>
