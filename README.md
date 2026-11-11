# assigment.apk

BCA Semester V internal assignment — one offline content set, shipped as an
**Android app (Capacitor)** and a **desktop app (Electron)**, both built by
**GitHub Actions**. No PDFs, no network requirement, no server.

| | |
|---|---|
| Subjects | 5 |
| Questions | 13 |
| A4 pages | 39 (**3 per question**) |
| Diagrams & charts | 19 (SVG + text-mode) |
| Tables | 17 |
| Code samples | 2 Java programs + SQL examples |
| Internet needed after install | **No** |
| Submission | 18-11-2026 |

---

## The paper this follows

S.V.P. College Bhabua (Kaimur), V.K.S.U. Ara — Internal Assignment, All Subjects.

| Subject | Q | Question | Pages |
|---|---|---|---|
| COM / DCOM (5BCA1) | 3 | Explain scalability of DCOM | 3 |
| | 4 | Describe security of COM / DCOM | 3 |
| Multimedia (5BCA2) | 4 | Multimedia input and output technologies | 3 |
| | 5 | How audio and video are used for multimedia | 3 |
| | 6 | Difference between Hypertext and Hypermedia | 3 |
| Java (5BCA3) | 4 | What do you understand by AWT | 3 |
| | 5 | One program for inheritance | 3 |
| | 6 | Java program using init / start / stop (Applet) | 3 |
| Oracle RDBMS (5BCA4) | 5 | Explain Codd's law for RDBMS | 3 |
| | 6 | Joins and types of join | 3 |
| | 7 | Draw an ER diagram of E-Learning | 3 |
| Computer Centre Mgmt (5BCA5) | 4 | Group — characteristics and types | 3 |
| | 5 | Organizational design and its advantages | 3 |

---

## Page density is matched to handwriting

One filled A4 sheet written by hand is about **260 words**. Every planned page
is budgeted by what else sits on the same sheet:

| What the page carries | Prose budget |
|---|---|
| plain prose | 260 words |
| one hand-drawn diagram | 172 words |
| one text-mode (ASCII) figure | 150 words |
| a table | 260 words − 10 per row |
| a code program | 40 words + at most 26 lines |

That is why every answer is exactly **three planned pages**: page 1 introduces
the concept with a figure, page 2 explains the mechanism with a table, page 3
covers limits, examples and the conclusion. The printed type is **12 pt** with
**11 mm** margins, so one printed page is one sheet of handwriting.

`npm run check:pages` proves it: the script prints each subject into a
throw-away file in the OS temp folder, counts the sheets, then deletes it. If a
question overflows onto a fourth page the check fails. Nothing is ever shipped
as a PDF.

---

## How it works

```
web/                      the assignment site (plain HTML, CSS, JS)
  ├── index.html          dashboard
  ├── 5BCA*.html          the five subjects
  └── assets/             design system, fonts, highlight.js
desktop/                  Electron shell around the same web/ folder
  ├── main.js             window, menu, print, focus mode, state memory
  ├── preload.js          read-only marker for the page
  ├── electron-builder.yml
  └── package.json
resources/                app icon + splash screen
scripts/                  android patcher + page-budget check
capacitor.config.json     app id, name, webDir
.github/workflows/        android.yml (APK) · desktop.yml (EXE / AppImage)
```

`android/` is **not** committed: CI creates it from scratch on every build.
The desktop app copies `web/` at package time, so both apps always show the
same content.

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

### 2. Let the workflows run

A push triggers both builds:

| Workflow | Produces | Where |
|---|---|---|
| **Build Android APK** | `bca-sem-v-debug-apk` | Actions → Artifacts |
| **Build Desktop App** | Windows EXE + portable, Linux AppImage | Actions → Artifacts |

### 3. Want everything on the Releases page?

Push a **tag**:

```bash
git tag v1.6.0
git push origin v1.6.0
```

Both workflows attach their files to the same release, so the front page then
offers the APK and the desktop installers together — no 90-day expiry:

<https://github.com/SudhirDevOps1/assigment.apk/releases>

---

## Optional: a signed release APK

Debug APKs install fine, but Android shows a warning and they cannot be
updated in place later. Add four secrets under
**Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 my-release.keystore` (Linux/macOS) or `[Convert]::ToBase64String([IO.File]::ReadAllBytes('my-release.keystore'))` (PowerShell) |
| `STORE_PASSWORD` | keystore password |
| `KEY_ALIAS` | e.g. `assigment` |
| `KEY_PASSWORD` | key password |

Create the keystore once with
`keytool -genkeypair -v -keystore my-release.keystore -alias assigment -keyalg RSA -keysize 2048 -validity 10000`
and keep the `.keystore` file somewhere safe — without it you can never update
the app later.

The workflow then produces **both** APKs.

---

## What works in the Android app

* **True full screen.** Status and navigation bars are hidden; a swipe from the
  edge brings them back.
* **A toolbar that gets out of the way.** Scroll down and it slides away; scroll
  up and it returns.
* **Focus mode.** One tap hides every control and leaves only the answer.
* **Pinch zoom** anywhere, and rotation in portrait and landscape without
  losing the scroll position.
* **A real launcher icon.** Adaptive icon plus legacy square icons.
* **All five subjects, all 19 diagrams, all tables and programs** — bundled in
  the APK, so the network is never used.

## What works in the desktop app

* Native window with remembered size and position.
* Menu-driven **Print (Ctrl+P)**, **Focus mode (Ctrl+Shift+F)**, zoom,
  fullscreen and back / forward.
* Same offline content, same design system, no browser needed.
* Windows **installer** and **portable EXE**; Linux **AppImage**.

| Shortcut | Action |
|---|---|
| `Ctrl + P` | Print the current subject |
| `Ctrl + Shift + F` | Toggle focus mode |
| `Ctrl + + / − / 0` | Zoom in / out / reset |
| `F11` | Fullscreen |
| `Alt + ← / →` | Back / forward |
| `Ctrl + 1` | Back to the dashboard |

---

## Working on the site

```bash
# any static server works; python is not required
npx serve web            # or: python -m http.server 8899 --directory web

# prove every answer still fits its three sheets (needs Chrome or Edge)
npm run check:pages

# run the desktop shell
cd desktop && npm install && npm start

# push -> both CI workflows rebuild the APK and the desktop apps
git add . && git commit -m "update" && git push
```

Change anything inside `web/` and push. Nothing else needs editing.

---

## Icons and splash screen

`resources/` holds the artwork that the builds turn into app icons and splash
screens:

| File | Used for |
|---|---|
| `icon.png` | plain icon (Android 7 and older) and desktop app icon |
| `icon-foreground.png` | adaptive icon artwork inside the 66 % safe zone |
| `icon-background.png` | adaptive icon background layer |
| `splash.png` | launch screen |

Replace any of them and push a tag — every density and mask is regenerated.

---

*Internal Assignment · BCA Semester V · Submission 18-11-2026*
