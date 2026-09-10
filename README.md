# Taihang House Activities

Twenty short English activities for the start of the school day. Each has prompts for the board, a timer and a teacher guide. The site also includes a menu and a short tutorial.

Live site: https://colourfour.github.io/esl-homeroom/

## Use it

Open `docs/index.html` in a browser, or serve `docs/` with a static web server. Students work together in the room; the controls are for one shared screen. There are no student accounts, external dependencies or saved responses.

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
