# Taihang House Activities

Twenty short English activities for the start of the school day. Each has prompts for the board, a timer and a teacher guide. The site also includes a menu and a short tutorial.

Live site: https://colourfour.github.io/esl-homeroom/

## Use it

Open `docs/index.html` in a browser, or serve `docs/` with a static web server. Students work together in the room; the controls are for one shared screen. The activity pages have no student accounts, external dependencies or saved responses.

## Edit the content

- `content/activities.json` contains the activity descriptions, teacher notes and classroom prompts.
- `build.py` contains the shared page layouts, menu and tutorial.
- `docs/assets/style.css` controls the presentation.
- `docs/assets/app.js` runs the classroom tools.

After changing the content or layouts, run `python3 build.py`. This rebuilds the HTML pages in `docs/`. The builder uses only the Python standard library. Keep the activity slugs unchanged to preserve existing links.

## Publish

GitHub Pages serves `docs/` from `main`. Pushing a change to that branch updates the site. The `.nojekyll` file keeps the site as plain static files.

## Classroom controls

The timer can run for 20, 3 or 1 minute, or 30 seconds. “Focus view” enlarges the task and hides navigation. Each activity starts with three student steps; the teacher guide opens below the board. A Timer link jumps to the shared timer. Each page has controls suited to the task: debate replies, question cards, picture references, speaking turns, word chains, editable statements and more. The pictures are bundled locally; see IMAGE-CREDITS.md for sources and generation prompts.

Votes are entered on one device: type each total or use +1. Undo restores the last count change. Changing a prompt clears its answers; refreshing or leaving the page clears the timer too. Nothing is sent to a server. For secret-card activities, the guesser or drawer must face away before the card is shown.

## Jacket design competition

The homepage links to `docs/jackets/`, a separate student entry page for the 2026 house jacket competition. Students upload one or two JPG/PNG/PDF files by 31 October 2026, with brooker@rdfzcygj.cn as an email backup. The entry form uses a separate upload service; existing activity tools remain browser-only. Student entries and artwork are private to the teacher during submissions. The private review page requires teacher authorization, even though its page shell is public. No teacher key or student files are in this repository. The house vote will take place after entries close.

The homepage link and announcement are also in `build.py`, so rebuilding the activities preserves them. The builder leaves the separate jacket pages in place.

### Jacket vote (November 2026)

The jacket page now shows three shortlisted designs and accepts one final choice per single-use code. Voting closes automatically at 2026-11-03 16:00 UTC (end of 3 November in China). The original submissions and teacher access remain available at `docs/jackets/admin.html`; `docs/jackets/voting-admin.html` manages private totals, pause/resume, CSV results and additional code batches using the existing teacher key.

The separate `taihang-vote` Edge Function validates hashed codes and calls a service-only transaction to record votes. Concurrent retries for the same choice return the same receipt. Codes and totals are never in the public repository; names, classes and original upload metadata are omitted from the public gallery. Gallery images are metadata-free derivatives of the three genuine submissions. The test entry, game screenshot and photo with no visible design are excluded. Distribute exactly one code per person; possession of a code is the voting credential.

Validation: desktop/mobile browser review, artwork modal and ballot confirmation; live teacher-authentication checks; eight simultaneous same-code retries count once; changed-choice and invented-code rejection; closed/deadline enforcement. The synthetic test vote and code were removed before opening voting. Security advisor findings for vote tables are informational RLS-without-policy notices: the tables intentionally allow only the server service role.
