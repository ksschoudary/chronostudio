# Chrono Studio

A private timeline of your life. Everything you write stays in your phone's own storage — there is no account, no server, and nothing to sign in to.

## What's inside

**Timeline** holds three lenses, switched at the top or by swiping left and right. A category filter sits under them and applies to all three.

- **Calendar** — a month grid with small coloured event slivers, then that month's events as a scrolling agenda. When you're on the current month, an *On this day* ribbon appears above the grid with anything you recorded on the same date in earlier years.
- **Journey tree** — collapsible years, months as branches, events as leaves.
- **Milestone map** — a dotted trail with pins, one stop per milestone, dashed year checkpoints along the way.

**Search** (magnifier, top right) looks across titles, notes, people, places and category names at once, highlights the matched words, and groups results by year.

**Diary**, **Manifestation** and **Habits** are in the nav but not built yet — each shows what it will do and states plainly that nothing there saves.

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

In `localStorage` on that one device, under `chrono.events.v1` and `chrono.categories.v1`. Consequences worth knowing:

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
| Storage full | A failed write now warns you instead of losing the entry quietly. |

Colours, ids and dates are validated at the point of *output* as well as input, so an injection needs two independent failures to land rather than one.

### The one risk you should decide about

**All GitHub Pages sites under `yourname.github.io` share a single browser origin.** That means any *other* project you publish to that same account can read Chrono's storage with a line of JavaScript. This is how browsers work, not a flaw in the app, but it matters here.

Pick one:

- Publish nothing else to that account, or only things you fully trust; **or**
- Put Chrono on its own custom domain (Settings → Pages → Custom domain), which gives it a private origin; **or**
- Use a separate GitHub account just for Chrono.

Also worth being clear about: **your entries are not encrypted.** Anyone who can unlock your phone can read them. Your device passcode is the lock. If you want a second lock inside the app, say so and I'll add a passphrase that encrypts the store with WebCrypto — the trade-off is that forgetting it means the data is gone for good.

## The font

Chrono does not download fonts, because that would tell a third party every time you open your journal. On a Mac or Windows machine it uses real Comic Sans MS; on iOS it falls through to Chalkboard SE, which ships with the system and has the same handwritten feel.

If you want exact Comic Sans everywhere, download **Comic Neue** (SIL Open Font License), put `ComicNeue-Regular.woff2` and `ComicNeue-Bold.woff2` in a `fonts/` folder next to `index.html`, and it activates on its own — the `@font-face` rules are already at the top of the stylesheet. Add both filenames to the `SHELL` array in `sw.js` so they cache for offline use.

## Known behaviour worth knowing

- Exported CSV cells that start with `=`, `+`, `-` or `@` gain a leading apostrophe. Spreadsheets hide it; it is what stops the cell being run as a formula.
- Dates are built at midday internally. This is deliberate — a date built at midnight rolls to the previous day in timezones where daylight saving starts at 00:00, which would silently misplace events.

## Updating the app later

Edit `index.html`, then bump the cache name in `sw.js` (`chrono-v1` → `chrono-v2`) and push both. Without the bump, phones keep serving the old cached copy.

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
| Validation rules | `cleanEvent`, `cleanCat`, `validDate`, `col` |
| Export formats | `exportJSON`, `exportMD`, `exportCSV` |
