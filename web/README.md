# web/ — the assignment site

The whole deliverable is plain HTML, CSS and JavaScript. No build step, no
framework, no network. Both apps wrap this folder:

* **Android** — Capacitor copies `web/` into the APK.
* **Desktop** — Electron loads `web/index.html` (packaged as `extraResources`).

## Contents

| File | Subject |
|---|---|
| `index.html` | dashboard — 5 subjects, 13 questions, 39 pages |
| `5BCA1_COM_DCOM.html` | DCOM scalability, COM/DCOM security |
| `5BCA2_Multimedia.html` | multimedia I/O, audio & video, hypertext vs hypermedia |
| `5BCA3_JAVA.html` | AWT, inheritance program, applet life cycle |
| `5BCA4_Oracle.html` | Codd's rules, joins, e-learning ER diagram |
| `5BCA5_Centre_Management.html` | groups, organizational design |

Each subject is **3 planned pages per question**. A page is a single
`<div class="page-sec">` block; the print stylesheet in
`assets/monolith.css` starts a new A4 sheet at every one of them.

## Page structure (do not break it)

```html
<article class="qblock" id="q4">
  <div class="qhead">...</div>
  <div class="ans">
    <div class="page-sec">  <!-- sheet 1 -->
    <div class="page-sec">  <!-- sheet 2 -->
    <div class="page-sec">  <!-- sheet 3 -->
  </div>
</article>
```

Adding a fourth `page-sec` without moving content around will break the
"3 pages per answer" rule. Check it with:

```bash
npm run check:pages
```

The check writes temporary files to the OS temp folder, counts the sheets and
deletes them. It fails loudly if any subject gained or lost a page. It requires
Chrome or Edge; set `CHROME_PATH` if the browser is in a non-standard place.

## Print settings

* Size: **A4**, margins **Default**, **Background graphics ON**, **Headers and
  footers OFF**.
* Type is 12 pt with 11 mm margins so one printed page matches one handwritten
  sheet.
* Screen-only chrome (toolbar, contents, hero, footer) is hidden by
  `@media print`.

## Preview locally

```bash
npx serve web
# or
python -m http.server 8899 --directory web
```

Then open <http://localhost:8899/index.html>.

## Small conventions

* Fonts are self-hosted in `assets/fonts/` — never link a CDN.
* Diagrams are inline SVG (classes `d-box`, `d-fill`, `d-line`, …) or
  `<pre class="ascii">`; both are styled for screen and paper.
* Code uses highlight.js classes (`language-java`, `language-sql`) but the
  engine is bundled in `assets/vendor/`.
* Keep answers factual and syllabus-level; each question has a fixed page
  budget, so a paragraph that does not earn its lines should be cut.
