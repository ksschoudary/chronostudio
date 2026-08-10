# Chrono Studio

A private timeline of your life. Everything you write stays in your phone's own storage — there is no account, no server, and nothing to sign in to.

## What's inside

Navigation lives entirely in the header: brand, then the lens bar, then the five sections, then the category filters. Nothing is anchored to the bottom edge, which is where iOS causes trouble in standalone mode.

**Timeline** holds four lenses, switched at the top or by swiping left and right. A category filter sits under them and applies to all four.

- **Calendar** — a month grid with small coloured event slivers, then that month's events as a scrolling agenda. When you're on the current month, an *On this day* ribbon appears above the grid with anything you recorded on the same date in earlier years.
- **Monthly** — one year at a time. Twelve fixed-size tiles give the year at a glance; below them the year runs month by month with each month's events listed in full. Tapping a tile jumps to that month. The tiles never change height with content, which is what distorted the earlier ribbon version once events were added.
- **Journey tree** — collapsible years, months as branches, events as leaves.
- **Milestone map** — a dotted trail with pins, one stop per milestone, dashed year checkpoints along the way.

**Search** (magnifier, top right) looks across titles, notes, people, places and category names at once, highlights the matched words, and groups results by year.

**Diary** and **Manifestation** are the same machine with different data. Each has three lenses: **Calendar** (month grid with title snippets, plus the month's entries below), the book view (**Diary view** / **Manifestations**) which renders one entry per page on ruled cream paper you turn with Previous and Next, and **Milestones** (every title date-wise in small boxes, grouped by year). Entries carry a date, a title and a description — nothing more.

**Habits** has three lenses. **Today** shows a ring split into one segment per habit due today, filling as you tick them, with the count in the middle. **Week** runs Monday to Sunday, one tappable tile per habit per day, a star for any habit whose scheduled days are all kept so far, and four figures underneath: met percentage, best day, total kept and best streak. **Calendar** gives each past day a small dial showing how much of that day you kept; tap a day to open it.

A habit has a name, details, an optional time, the weekdays it runs on, and a colour. Streaks count consecutive *scheduled* days, so a Mon/Wed/Fri habit is not broken by Tuesday — and today staying unticked does not break anything until the day is actually over. Missed days are shown as empty boxes, never as failures.

**Export** is available per section — the ⤓ button in the top bar exports whatever section you are looking at, in JSON, Markdown or CSV. Library holds the same for the whole app at once, plus section-only shortcuts.

**Library** holds your totals, your rhythm (recording streaks measured in months, your fullest month, a twelve-month bar chart, and what you record most), category management, and every export.

## Put it online (GitHub Pages)

1. Make a new **public** repo, e.g. `chrono-studio`.
2. Upload every file in this folder to the repo root (not inside a subfolder):
   `index.html`, `manifest.webmanifest`, `sw.js`, `icon-180.png`, `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
4. Wait a minute, then open `https://<your-username>.github.io/chrono-studio/`

HTTPS is required for a PWA, and GitHub Pages gives you that automatically.

## Install it on your iPhone

Open the URL in **Safari** (not Chrome — only Safari can install to the Home Screen on iOS), tap **Share → Add to Home Screen**, then launch it from the icon. It opens full-screen with no browser chrome, works with no signal, and iOS treats its storage as long-lived.

Launching from the Home Screen icon matters. A site left in a Safari tab can have its storage cleared after about seven days of no use; an installed web app is not treated that way.

## Where your data lives

In `localStorage` on that one device, under `chrono.events.v1`, `chrono.categories.v1`, `chrono.diary.v1`, `chrono.manifest.v1` and `chrono.habits.v1`. Consequences worth knowing:

- Your events do **not** sync between your iPhone and any other device.
- Deleting the app from the Home Screen, or clearing website data in Safari, deletes your events.
- **Library → Export backup (.json)** is your safety net. It saves to Files, and importing it later restores everything. Do it every so often.

## Security posture

Chrono makes **zero network requests**. There is no analytics, no font CDN, no error reporting, no API. A Content-Security-Policy of `connect-src 'none'` is set in the page itself, so even a future mistake in the code cannot open a connection.

What is enforced in the app:

| Risk | Handling |
|---|---|
| Malicious backup file | Every field is validated before it is trusted — ids must match `[A-Za-z0-9_-]`, dates must be real calendar dates, colours must be plain 6-digit hex, text is length-capped and stripped of control and bidi-override characters. Anything failing is dropped, and you're told how many were skipped. |
| Tampered local storage | Storage is re-validated on every load with the same rules, so a poisoned store is treated exactly like a hostile file. |
| Injected markup | All user text is HTML-escaped at every render, including inside attributes and `style` values. |
| Clickjacking | Cross-origin framing is detected and covered with a visible notice. |
| Silent clipboard leak | If a download is blocked, Chrono asks before putting your journal on the clipboard. |
| Rogue service worker use | The worker only touches same-origin GETs inside its own scope, caches nothing opaque, and has no message handler. |
| CSV formula injection | A title beginning `=`, `+`, `-` or `@` is executed as a formula by Excel, Numbers and Sheets. Exports prefix those cells with an apostrophe so they stay text. |
| Storage full | A failed write warns you instead of losing the entry quietly. |
| Prototype pollution | Completion-log dates become object keys, so they are validated at the point of write as well as at the call site — a key like `__proto__` never reaches the object. |
| Form autofill leak | Every private field (diary, intentions, habits, events) opts out of autofill, so your writing is never stored in the browser's form history and offered on other sites. |
| Page-lock leak | Bottom sheets pin the page while open. Locking is one-shot, so a sheet that redraws itself in place cannot re-capture a scroll offset the browser reports as 0 while pinned, and unlocking is idempotent — a stray or double close can never strand the page. |
| Deletion residue | "Delete everything" removes the storage keys outright rather than overwriting them with empty arrays. |
| Abandoned drafts | Closing an editor clears all three draft objects, so a closed editor's half-written entry cannot be resurrected by a later tap. |
| Silent save failure | Every saver — events, categories, journals, habits — reports a failed write instead of losing the change quietly. |

Colours, ids and dates are validated at the point of *output* as well as input, so an injection needs two independent failures to land rather than one.

### Sharing the origin with your other projects

This origin is shared with everything else you publish under the same account, so Chrono is written to be a good neighbour as well as a safe one. It is confined to its own corner by construction:

- **Every storage key must begin with `chrono.`** — the storage layer refuses any other key outright, so a typo or a future bug cannot read or overwrite another project's data.
- **The store is never enumerated.** No `localStorage.length`, no `.key(i)`, no `Object.keys(localStorage)`. Chrono has no way to discover that another project's keys even exist.
- **`localStorage.clear()` is never called.** It would wipe the whole origin. "Delete everything" removes Chrono's five keys by name.
- **The service worker only deletes caches named `chrono-studio-*`**, and only ever reads from its own cache — never the origin-wide `caches.match()`, which searches every cache on the domain.
- **The worker's scope is pinned** to Chrono's own folder, so requests belonging to your other projects pass straight through untouched.

This is enforced by a test suite that plants another project's data on the same origin and confirms Chrono can neither read, overwrite, delete nor enumerate it.

Note the direction of this guarantee: it stops Chrono reaching your other projects. It cannot stop your other projects reaching Chrono — only the browser's origin rules do that, and they treat the whole domain as one. See below.

### The one risk you should decide about

**All GitHub Pages sites under `yourname.github.io` share a single browser origin.** That means any *other* project you publish to that same account can read Chrono's storage with a line of JavaScript. This is how browsers work, not a flaw in the app, but it matters here.

Pick one:

- Publish nothing else to that account, or only things you fully trust; **or**
- Put Chrono on its own custom domain (Settings → Pages → Custom domain), which gives it a private origin; **or**
- Use a separate GitHub account just for Chrono.

Two more things worth being clear about. **iOS snapshots whatever is on screen when you switch apps**, and that snapshot appears in the app switcher — no web app can prevent this, so leave a neutral view open before handing your phone to someone. And **your entries are not encrypted.** Anyone who can unlock your phone can read them. Your device passcode is the lock. If you want a second lock inside the app, say so and I'll add a passphrase that encrypts the store with WebCrypto — the trade-off is that forgetting it means the data is gone for good.

## Themes

Eight, switched in **Library → Look and feel** and remembered on the device:

| | |
|---|---|
| **Studio** | Warm cream, ink brown, terracotta. Editorial and calm. The default. |
| **Graphite** | Cool neutral grey, near-black type, one vivid vermilion accent. |
| **Sea glass** | Cool mist, deep navy, clear blue. Fresh and crisp. |
| **Forest** | Pale sage, deep green, warm gold. |
| **Blossom** | Blush and lavender with candy accents. Soft and playful. |
| **Ink** | The original dark. |
| **Midnight** | Deep indigo with electric cyan and violet. |
| **Noir** | High contrast: amber on near-black. |

Every colour in the app resolves through CSS custom properties, so a theme is a token set and nothing more — including the diary paper and the iOS status bar. The theme is applied by a tiny script in `<head>` before first paint, so the app never flashes the wrong background on launch.

The category and habit palette is deliberately mid-tone rather than pastel or neon: the same colours have to stay legible as text on a near-white surface and still read as colour on a near-black one.

## The font

Chrono does not download fonts, because that would tell a third party every time you open your journal. On a Mac or Windows machine it uses real Comic Sans MS; on iOS it falls through to Chalkboard SE, which ships with the system and has the same handwritten feel.

If you want exact Comic Sans everywhere, download **Comic Neue** (SIL Open Font License), put `ComicNeue-Regular.woff2` and `ComicNeue-Bold.woff2` in a `fonts/` folder next to `index.html`, and it activates on its own — the `@font-face` rules are already at the top of the stylesheet. Add both filenames to the `SHELL` array in `sw.js` so they cache for offline use.

## Layout architecture

The document itself never scrolls: `html, body { overflow: hidden }`, and `#app` is `position: fixed; inset: 0` as a flex column. The header, filter chips and bottom nav are flex children with fixed height; `main` is the single scroll container.

The bottom nav is gone: section navigation sits in the header between the lens bar and the filters. The page scrolls as a normal document. There is no fixed-height shell, so there is no shell height for iOS to under-report and no gap it can leave at the bottom — `<body>` paints the canvas, which always fills the screen whatever the viewport reports, and the page is exactly as tall as its content. Three attempts to size a shell correctly (`inset: 0`, then `100dvh`, then a measured `window.innerHeight`) each left dead space in standalone; removing the shell removed the question.

Section navigation is a floating glass pill fixed near the bottom, with content flowing freely behind it — `backdrop-filter` blur plus a per-theme translucent fill, and an opaque fallback where blur is unsupported. It is inset from every edge deliberately: a bar welded to the screen edge has to line up with it exactly, and iOS shifts fixed elements slightly during rubber-band overscroll, whereas a pill that already floats has no edge to misalign with.

The header — brand, lenses, filters — is a single `position: sticky` block, and its height is measured into `--head-h` after every render so anything reached by `scrollIntoView` clears it instead of landing underneath. Bottom sheets pin the page at its current offset rather than relying on `overflow: hidden`, which iOS ignores for touch scrolling.

A `position: fixed` bottom bar over a scrolling document also drifts on iOS — it detaches during rubber-band overscroll and jumps when the keyboard opens. As a flex child of a pinned shell the nav has no way to move. Bottom sheets read `window.visualViewport` and lift above the keyboard via a `--kb` custom property rather than letting iOS shove the layout around.

Renders preserve scroll position when only the data changed, and replay the entrance animation only when the view actually changed. Ticking a habit should not re-animate the screen or throw away your place in a long list.

## Performance

Ticking a habit patches the tapped control in place and refreshes only the figures that depend on it — the ring and its caption, or the weekly counts and totals. The surrounding tree is untouched, so the response stays instant no matter how much history is on screen. Anything the patcher doesn't recognise — a different screen, an unexpected element — falls back to a full render, because a half-updated screen is worse than a slower one.

Both the renderer and the patcher read the same `weekFigures()`, and the Today row's sub-line comes from the same `habitSubline()` the renderer uses. Two implementations of one calculation will drift; one implementation cannot.

Year sections in the Journey tree use `content-visibility: auto` with an intrinsic size, so offscreen content costs nothing to lay out while the scrollbar stays stable. It is deliberately kept off anything reachable by `scrollIntoView` — for a section never yet rendered the browser uses the intrinsic estimate, so the scroll lands in the wrong place. Cards declare `contain: content` to keep layout and paint work local.

Habit statistics are memoised for the duration of a single render pass and the cache is emptied at the start of each one. A screen with thirty habits draws one row each, and every row wants the same streak figures; without this, ticking one box re-walked years of history thirty times before the screen redrew. The cache is deliberately scoped to a render rather than keyed on a fingerprint of the log — any cheap hash can collide, and a silently wrong streak is worse than a slow one.

## Known behaviour worth knowing

- Exported CSV cells that start with `=`, `+`, `-` or `@` gain a leading apostrophe. Spreadsheets hide it; it is what stops the cell being run as a formula.
- Dates are built at midday internally. This is deliberate — a date built at midnight rolls to the previous day in timezones where daylight saving starts at 00:00, which would silently misplace events.

## Updating the app later

Edit `index.html`, then bump `CACHE_VERSION` in `sw.js` and push both. Without the bump, phones keep serving the old cached copy.

The app now calls `registration.update()` on launch and reloads itself once a new worker takes control — unless a sheet is open, so an update never interrupts something you are writing. If you ever need to force it by hand: close the app from the switcher, reopen, and it will pick up the new build on the second launch at the latest.

## Making it yours

Everything is one file with no build step. The pieces you are most likely to touch:

| What | Where in `index.html` |
|---|---|
| Colours | `:root` at the top of `<style>` |
| Default categories | `DEFAULT_CATS` |
| Colour choices for new categories | `SWATCHES` |
| The three lenses | `renderCalendar`, `renderTree`, `renderMap` |
| Search behaviour | `matchEv`, `renderSearch` |
| On this day | `onThisDay`, `otdBlock` |
| Streaks and charts | `insights` |
| Work-in-progress copy | `WIP` |
| Monthly ribbon | `renderMonthly`, `MONTH_INK` |
| Diary + Manifestation | `JOURNALS`, `renderJCalendar`, `renderBook`, `renderStones` |
| Lens sets per section | `LENSES` |
| Habits | `renderToday`, `renderWeek`, `renderHabitCal`, `habitStats` |
| Themes | `THEMES`, `applyTheme`, and the `[data-theme=...]` blocks at the top of the stylesheet |
| Palette | `SWATCHES`, `MONTH_INK`, `DEFAULT_CATS` |
| Exports | `exportScope`, `SCOPES` |
| Validation rules | `cleanEvent`, `cleanEntry`, `cleanCat`, `validDate`, `col` |
| Export formats | `exportJSON`, `exportMD`, `exportCSV` |
