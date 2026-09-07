# Morning English

20 interactive ESL homeroom activities, a menu and a teacher tutorial. A static website: no installation, build step, student accounts or external dependencies.

## Run
Open `docs/index.html` in a browser, or serve `docs/` with any static web server. Each activity has its own URL under `activities/`.

## GitHub Pages
In repository Settings → Pages, select **Deploy from a branch**, then **main** and **/docs**, and save. The `.nojekyll` file keeps the site as plain static files.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Classroom features
- 20-minute timer with lesson phases, pause/reset and 1- or 3-minute rounds
- Teacher/classroom view; clear language frames and complete teacher plans
- Voting, accessible ranking buttons, secret cards, drawing pad, editable statements, story prompts, vocabulary lists and more
- Several prompts per activity; eight new activities extend the original twelve
- Responsive layout, keyboard-operable controls and reduced-motion support

The page is a shared classroom tool, not a networked multiplayer service. Vote totals are entered on one device. Answers and timers exist only in the current page and clear on navigation or refresh. Secret cards require the guesser/drawer to face away before revealing.

## Edit
Pages are in `docs/activities/`. Each includes readable teacher instructions and an embedded `activity-data` JSON block used by the interactive panel. Shared styles and behaviour are in `docs/assets/`. Change both the instructions and JSON when revising an activity.
