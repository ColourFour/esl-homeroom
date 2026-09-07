# Homeroom English

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

The timer can run for 20, 3 or 1 minute. “Put it on the board” hides the teacher notes and enlarges the task. Other tools include voting, ranking, secret cards, drawing, word lists and story notes.

Votes are entered on one device. Changing a prompt clears its answers; refreshing or leaving the page clears the timer too. Nothing is sent to a server. For secret-card activities, the guesser or drawer must face away before the card is shown.
