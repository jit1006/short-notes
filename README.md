# Short Notes

A responsive, dependency-free webpage for capturing short notes. Warm neutral styling, keyboard-accessible controls, and local browser storage.

## Features
- Create, edit, and delete notes (with deletion confirmation).
- Search titles and content.
- Sort by last update or title.
- Keep notes across reloads using localStorage.
- Responsive layout and polite screen-reader status announcements.
- Plain-text rendering: notes are never interpreted as HTML.

## Run locally
Clone this repository and serve its root with any static server:

```sh
git clone https://github.com/jit1006/short-notes.git
cd short-notes
python -m http.server 8000
```

Open http://localhost:8000. The app has no runtime packages or build step.

## Validation
Node.js 22+ and npm are needed only for development checks.

```sh
npm install
npx playwright install chromium
npm run check
npm test
```

The browser smoke test covers create/edit/delete, persistence after reload, search, alphabetical sorting, safe rendering, mobile overflow, and malformed storage. CI runs these checks on pushes and pull requests.

## Project layout
- `index.html`: semantic page structure.
- `styles.css`: responsive visual design.
- `app.js`: note management, search, and persistence.
- `tests/smoke.cjs`: browser integration checks.

## GitHub Pages
In repository **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/ (root)**, then save. The expected address is https://jit1006.github.io/short-notes/ after GitHub finishes deployment. Hosting must be enabled separately; adding these files does not activate Pages.

## Data and limitations
Notes stay in this browser profile and origin. There is no account, backend, cloud sync, or encryption. Clearing site data removes saved notes. Avoid sensitive information. Browser storage errors are reported, and malformed existing data is not overwritten. Multiple tabs are not synchronized: reload when notified of changes before editing. There is currently no export feature.

## Contributing
Use small feature branches such as `feat/note-export` and focused Conventional Commit messages (`feat:`, `fix:`, `docs:`, `test:`, `ci:`). Open a pull request describing the behavior change and checks run. Run the checks above before requesting review.
