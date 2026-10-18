# assigment.apk

BCA Semester V assignment suite — turned into an **offline Android app** with
Capacitor, built automatically by **GitHub Actions**.

| | |
|---|---|
| Subjects | 5 |
| Questions | 15 |
| A4 pages | 60 (4 per question) |
| Print type size | 12 pt (matches handwriting density) |
| Diagrams / charts | 35 (animated SVG + text-mode figures) |
| Ready-made PDFs | 5 (bundled inside the app) |
| Internet needed after install | **No** |

### Page density is matched to handwriting

The answers were originally carrying about **342 words per planned page** —
roughly twice what a person can comfortably copy onto one A4 sheet by hand. The
content has now been rebuilt around a real handwriting sample.

The calibration sample was a filled answer sheet: about **23 handwritten
lines**, each holding roughly **10 words**. So:

> **260 words of prose = one A4 page written by hand.**

Every planned page is then budgeted by what else has to fit on that same
sheet:

| What the page carries | Ink it uses | Prose budget |
|---|---|---|
| plain prose | — | 260 words |
| one hand-drawn diagram | ~9 lines | 172 words |
| one text-mode (ASCII) figure | ~11 lines | 150 words |
| a table | 1 line per row | 260 − 10 words per row |
| a code program | ~30 lines per page | 40 words + ≤ 26 lines |

That is why the programs are deliberately short: a 36-line program would
already fill a whole sheet on its own.

| | Before | After rebalancing |
|---|---|---|
| Words per planned page | ~342 | **~150** |
| Average page load (1.0 = one sheet) | 1.95 | **0.96** |
| Tallest page load | 2.89 | **1.10** |
| Lightest page load | 0.40 | **0.80** |
| Total prose across 60 pages | 20,527 | **9,023** |
| Diagrams, tables and programs | 35 / 11 / 15 | **all 35 kept** |

The work was done in two passes. First the over-full pages were condensed and
the programs shortened. Then, instead of simply cutting, the material was
**redistributed**: pages that had been left half empty were given real extra
explanation, so the total answer grew by about 2,100 words while every single
page still lands inside one A4 sheet. **All 60 pages now sit between 0.80 and
1.10** — no page is over-full and no page is half empty.

Nothing was deleted to make room: every figure, table and program survived.
The printed sheets are set at **12 pt** so the plan is easy to read while
writing, and the tallest printed page is about **213 mm** of the available
271 mm — the rest of each sheet is left free for your own handwriting and
diagrams.

---

## How it works

```
web/                      the assignment site (plain HTML, CSS, JS)
  ├── index.html          dashboard
  ├── 5BCA*.html          the five subjects
  ├── assets/
  │   ├── monolith.css    design system + print stylesheet
  │   ├── monolith.js     reveals + SVG animation
  │   ├── fonts.css       self-hosted @font-face rules
  │   ├── fonts/          Fraunces · Inter · JetBrains Mono (woff2, 144 KB)
  │   └── vendor/         highlight.js engine + theme
  └── pdf/                the five A4 PDFs, shipped inside the APK
resources/                app icon + splash screen
scripts/patch-android.mjs native tweaks (zoom, rotation)
capacitor.config.json     app id, name, webDir
.github/workflows/        CI that builds the APK
```

`android/` is **not** committed. The CI job creates it from scratch on every
build, so the repository stays small and can never fall out of date.

---

## Turning it on (one time only)

Everything happens in GitHub, nothing is installed on your PC.

### 1. Create the private repository

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/SudhirDevOps1/assigment.apk.git
git push -u origin main
```

### 2. Let the workflow run

Push triggers **Build Android APK** automatically. Open
**Actions → Build Android APK → Artifacts** and download
`bca-sem-v-debug-apk`.

That is it — install the APK on the phone and everything works with the
network switched off.

### 3. Want the APK on the Releases page instead?

Push a **tag**. The same build then also lands on the repository front page
under **Releases**, where it can be downloaded without logging into Actions and
without the 90-day artifact expiry:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Wait two or three minutes, then open
<https://github.com/SudhirDevOps1/assigment.apk/releases> and download
`app-debug.apk`.

To ship a new version later, bump the number and push again:

```bash
git tag v1.0.1
git push origin v1.0.1
```

---

## Optional: a signed release APK

Debug APKs install fine, but Android shows a warning and they cannot be
updated in place later. For a proper release build, add four secrets under
**Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 my-release.keystore` (Linux/macOS) or `[Convert]::ToBase64String([IO.File]::ReadAllBytes('my-release.keystore'))` (PowerShell) |
| `STORE_PASSWORD` | keystore password |
| `KEY_ALIAS` | e.g. `assigment` |
| `KEY_PASSWORD` | key password |

The workflow then produces **both** APKs. Create the keystore once with
`keytool -genkeypair -v -keystore my-release.keystore -alias assigment -keyalg RSA -keysize 2048 -validity 10000`
and keep the `.keystore` file somewhere safe — without it you can never
update the app later.

---

## What works inside the app

* **True full screen.** The status bar and the navigation bar are hidden and
  the page draws edge to edge. A swipe from the screen edge brings the bars
  back for a moment, exactly like a video player.
* **A toolbar that gets out of the way.** Scroll down and the top bar slides
  away; scroll up and it returns — the behaviour of every good PDF reader.
  On a phone the whole bar is a single 51 px row.
* **Focus mode.** One tap on **Focus** clears every piece of interface and
  leaves only the answer, which is what you want while copying it onto paper.
  Tap **Focus** again, or press `Esc`, to bring the buttons back.
* **Pinch zoom** in and out anywhere on the page.
* **Rotation** in portrait and landscape. The WebView is never recreated on
  rotate, so you never lose your scroll position.
* **A real launcher icon.** Adaptive icon, so Android masks it to whatever
  shape the phone uses, plus the older square icons for old devices.
* **All five subjects, all 35 diagrams, all 5 PDFs** — bundled in the APK, so
  no network is needed at any point.
* **The animated figures** play exactly as they do in a browser.
* Printing from inside the app still opens Android's own print dialog, where
  "Save as PDF" produces the same 60 A4 pages, in the same 12 pt type, with the
  same 11 mm margins.

## Icons and splash screen

`resources/` holds the artwork that the build turns into app icons and splash
screens:

| File | Used for |
|---|---|
| `icon.png` | the plain icon for Android 7 and older |
| `icon-foreground.png` | adaptive icon artwork, kept inside the 66 % safe zone |
| `icon-background.png` | adaptive icon background layer |
| `splash.png` | the launch screen |

Replace any of them and push a tag — CI regenerates every density and every
round and square mask automatically.

---

## Working on the site

```bash
# preview locally
python -m http.server 8899 --directory web
# -> http://localhost:8899/index.html

# push -> CI builds a fresh APK automatically
git add . && git commit -m "update" && git push
```

Change anything inside `web/` and just push. The workflow rebuilds the APK with
the new content.

---

*Internal Assignment · BCA Semester V · Submission 23-10-2026*