# BCA Semester V — Assignment Suite (Monolith)

A dark, print-perfect HTML reference for **five BCA Semester V theory subjects**.
Fifteen questions, each planned across **exactly four A4 pages** — 60 pages in all.

| Code | Subject | Questions | A4 pages | Code language |
|------|---------|-----------|----------|---------------|
| 5BCA1 | COM / DCOM | 2 | 8 | C++ |
| 5BCA2 | Multimedia Tools & Applications | 3 | 12 | HTML / CSS / Python |
| 5BCA3 | Java Programming | 3 | 12 | Java |
| 5BCA4 | Oracle RDBMS | 4 | 16 | SQL |
| 5BCA5 | Computer Centre Management | 3 | 12 | Theory & tables only |
| | **TOTAL** | **15** | **60** | |

---

## Files

```
web/
├── index.html                    dashboard with all five subjects
├── 5BCA1_COM_DCOM.html
├── 5BCA2_Multimedia.html
├── 5BCA3_JAVA.html
├── 5BCA4_Oracle.html
├── 5BCA5_Centre_Management.html
├── assets/
│   ├── monolith.css              design system + print stylesheet
│   └── monolith.js               progress bar, reveals, diagram animation
├── pdf/                          ready-made A4 PDFs (one per subject)
└── README.md
```

---

## Getting the printed copy

### Option 1 — download the PDF (easiest)

Every subject card on `index.html`, and every subject page, has a **PDF** button.
The files in `pdf/` are already A4-sized with four pages per question.

### Option 2 — print from the browser

1. Open a subject page.
2. Click **Print / Save A4**.
3. In the print dialog choose **Save as PDF** (or your printer).
4. Set **Margins → Default**, **Background graphics → ON**, **Headers and footers → OFF**.

### Option 3 — run it locally

```
python -m http.server 8899 --directory D:\Assignment\web
```

Then open <http://localhost:8899/index.html>.

---

## Regenerating the PDFs after an edit

```powershell
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
& $edge --headless --disable-gpu --no-sandbox --virtual-time-budget=20000 `
        --no-pdf-header-footer `
        --print-to-pdf="D:\Assignment\web\pdf\5BCA1_COM_DCOM.pdf" `
        "http://localhost:8899/5BCA1_COM_DCOM.html"
```

Run one command per subject. If a command silently fails, close any running
`msedge` process first (`Get-Process msedge | Stop-Process -Force`).

---

## Page planning — how one page = one handwritten A4 sheet

Every question is planned across exactly four A4 pages, and each planned page
is sized so that it fills **one sheet when written by hand**. The calibration
comes from a real answer sheet: about 23 handwritten lines, each holding
roughly 10 words, so **260 words of prose = one A4 page**.

| What the page carries | Ink it uses | Prose budget |
|---|---|---|
| plain prose | — | 260 words |
| one hand-drawn diagram | ~9 lines | 172 words |
| one text-mode (ASCII) figure | ~11 lines | 150 words |
| a table | 1 line per row | 260 − 10 words per row |
| a code program | ~30 lines per page | 40 words + ≤ 26 lines of code |

That is why the code programs are deliberately short — a 36-line program
would already fill a whole sheet on its own. The figure captions are written
as instructions ("write this box in your notebook") so nothing is wasted ink.

The measured result across all 60 pages: **average load 0.96, and every single
page falls between 0.80 and 1.10.** The original pages averaged 1.95, which
meant two sheets of handwriting each; the heaviest reached 2.89.

Reaching that took two passes. The over-full pages were condensed and the
programs shortened. The half-empty pages were then **filled with real extra
explanation** rather than left blank, so the total answer grew by roughly 2,100
words while every page still fits one sheet. No figure, table or program was
removed at any stage.

## Printing rules used by the stylesheet

* `@page { size: A4; margin: 13mm }` → a printable box of 184 × 271 mm.
* `.qblock` starts a new sheet, and inside it every `.page-sec` marker starts
  another one — so **every question prints as exactly four sheets**.
* `.monument`, `.contents`, `.foot`, `.topbar`, `.totop` and `.progress` are
  screen chrome and never reach paper. The question header (`.qhead`) does print.
* A blunt safety block in `@media print` forces `opacity:1`, `transform:none`,
  `animation:none` and `overflow:visible` on every element, so nothing can ever
  be invisible, shifted or clipped in the PDF.
* Diagrams are inline SVG (scalable, print-safe) or monospaced text-mode (ASCII)
  figures — no external image files, so nothing can go missing.

---

## Design notes

* **Dark "Monolith" theme** on screen: basalt tones, brass accents, Fraunces /
  Inter / JetBrains Mono.
* **Animated SVG** — each figure builds itself part by part on entry, filled
  slabs breathe, connector lines carry a flowing dash, arrow heads drift forward.
* **Scroll reveals** for every question block, figure, code frame and card.
* All motion lives inside `@media screen and (prefers-reduced-motion: no-preference)`,
  so the printed sheets are always perfectly still.
* Fully responsive: verified at 360 px, 768 px and 1024 px with no horizontal overflow.

---

## Deploying to GitHub Pages

```bash
cd web
git init
git add .
git commit -m "BCA Semester V assignment suite"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

Then in the repository: **Settings → Pages → Source → Deploy from a branch →
`main` / `root`**. The site will be live at `https://<your-user>.github.io/<your-repo>/`.

---

## Everything is local — the site works offline

There is **not a single external request** left in this project:

| Was | Now |
|---|---|
| `fonts.googleapis.com` + `fonts.gstatic.com` | `assets/fonts.css` + `assets/fonts/*.woff2` (144 KB, latin subset, de-duplicated) |
| `cdnjs.cloudflare.com` highlight.js | `assets/vendor/highlight.min.js` |
| `cdnjs.cloudflare.com` highlight.js theme | `assets/vendor/atom-one-dark.min.css` |

The `pdf/` folder is committed too, so the five A4 PDFs are downloadable even
with no connection. That is also what makes the Capacitor Android app in the
parent folder work completely offline — see the top-level `README.md`.

---

*Internal Assignment · BCA Semester V · Submission 23-10-2026*