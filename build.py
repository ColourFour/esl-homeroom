from pathlib import Path
from html import escape as esc
import json

ROOT = Path(__file__).resolve().parent
SITE = ROOT / 'docs'
activities = json.loads((ROOT / 'content/activities.json').read_text())


def page(title, content, prefix='', data=None, page_type=''):
    photo_credit = ('<span class="photo-credit">Taihang Mountains: <a href="https://commons.wikimedia.org/wiki/File:Taihang_Mountains_%E5%A4%AA%E8%A1%8C%E5%B1%B1_-_panoramio.jpg">SIMPLE / Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> · resized and cropped for display</span>' if page_type == 'home' else '')
    document_title = 'Taihang House Activities' if title == 'Activities' else f'{esc(title)} | Taihang House Activities'
    embedded = '' if data is None else '<script id="activity-data" type="application/json">' + json.dumps(data, ensure_ascii=False).replace('</', '<\\/') + '</script>'
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Simple English activities for a 20-minute homeroom. Prompts for the board, clear instructions for teachers, and enough variety to use them again.">
<meta name="theme-color" content="#174e43">
<title>{document_title}</title>
<link rel="stylesheet" href="{prefix}assets/style.css">
{embedded}
<script src="{prefix}assets/app.js" defer></script>
</head>
<body data-page="{page_type}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
<a class="brand" href="{prefix}index.html">Taihang House Activities</a>
<nav aria-label="Main navigation"><a href="{prefix}index.html">Activities</a><a href="{prefix}tutorial.html">Teacher notes</a></nav>
</header>
{content}
<footer class="site-footer"><span>Taihang House · 20-minute activities</span><a href="{prefix}tutorial.html">A few notes on running these</a>{photo_credit}</footer>
</body>
</html>'''


def timer():
    return '''<section class="timer-panel" id="activity-timer" aria-label="Activity timer">
<div class="timer-readout"><span class="eyebrow" id="timer-label">Time left</span><div class="clock" id="clock" role="timer" aria-label="Time remaining">20:00</div><p id="timer-stage">Explain &amp; model</p></div>
<div class="timer-controls"><div class="timer-presets" role="group" aria-label="Timer length"><button data-minutes="20" aria-pressed="true">20 min</button><button data-minutes="3" aria-pressed="false">3 min</button><button data-minutes="1" aria-pressed="false">1 min</button><button data-minutes="0.5" aria-pressed="false">30 sec</button></div><div class="actions"><button class="button lime" id="timer-toggle">Start timer</button><button class="button ghost" id="timer-reset">Reset</button></div><p class="timer-status" id="timer-status" role="status">Start when the class is ready.</p></div>
</section>'''


cards = []
for a in activities:
    cards.append(f'''<a class="activity-card" href="activities/{a['slug']}.html" data-category="{esc(a['kind'])}">
<div class="card-top"><span class="activity-number">{a['id']:02}</span><span class="tag">{esc(a['kind'])}</span></div>
<h2>{esc(a['title'])}</h2><p>{esc(a['purpose'])}</p>
<div class="card-bottom"><span>{esc(a['group'])} · {esc(a['prep'])}</span><span aria-hidden="true">→</span></div></a>''')
categories = ['All activities'] + list(dict.fromkeys(a['kind'] for a in activities))
filters = ''.join(f'<button class="filter" data-filter="{esc(c)}" aria-pressed="{str(i == 0).lower()}">{esc(c)}</button>' for i, c in enumerate(categories))
home = f'''<main id="main" class="home">
<h1 class="visually-hidden">Taihang House Activities</h1>
<figure class="mountain-banner"><img src="assets/taihang-mountains.jpg" width="2200" height="568" alt="Panoramic view of green ridges and steep cliffs in the Taihang Mountains" fetchpriority="high" decoding="async"></figure>
<section id="collection" aria-labelledby="collection-title"><div class="section-heading"><h2 id="collection-title">Choose an activity</h2><button class="button secondary" id="surprise">Pick one for me</button></div><div class="filters" role="group" aria-label="Filter activities">{filters}</div><p class="result-count" id="result-count" role="status">20 activities</p><div class="activity-grid">{''.join(cards)}</div></section>
<aside class="bottom-note"><strong>A couple of things to keep in mind</strong><p>Give them a moment to think before asking for an answer. Make sure everyone gets a turn. Help with a missing word when they need it, but keep the conversation moving.</p></aside>
</main>'''
(SITE / 'index.html').write_text(page('Activities', home, page_type='home'))

for a in activities:
    i = a['id']
    steps = ''.join(f'<li><span>{time}</span><div><strong>{esc(title)}</strong><p>{esc(body)}</p></div></li>' for time, (title, body) in zip(['0–3 min', '3–9 min', '9–16 min', '16–20 min'], a['steps']))
    prev, nxt = activities[(i-2) % 20], activities[i % 20]
    note = f'<div class="teacher-note"><h3>Worth keeping in mind</h3><p>{esc(a["note"])}</p></div>' if a.get('note') else ''
    content = f'''<main id="main" class="activity-page">
<div class="activity-title"><div><p class="eyebrow">{i:02} / 20 · {esc(a['kind'])}</p><h1>{esc(a['title'])}</h1></div><button class="button secondary" id="present" aria-pressed="false">Focus view</button></div>
<div class="activity-layout"><section class="play-panel" aria-labelledby="play-title"><div class="play-top"><h2 id="play-title">{esc(a["group"])}</h2><div class="board-tools"><a href="#activity-timer">Timer ↓</a><span id="round-count">Prompt 1</span></div></div><ol class="board-steps">{''.join(f'<li><b>{n}</b><span>{esc(step)}</span></li>' for n, step in enumerate(a['board']['steps'], 1))}</ol><noscript><p>Turn on JavaScript to use the controls. You can also run this from the teacher instructions with paper and a timer.</p></noscript><div id="play"></div><p id="play-status" class="play-status" role="status"></p><div class="round-controls"><button class="button secondary" id="previous-round">← Previous prompt</button><button class="button primary" id="next-round">Next prompt →</button></div><div class="language-box"><h3>A few useful phrases</h3><p>{esc(a['frames'])}</p></div></section>
<details class="teacher-panel"><summary id="teacher-title">Teacher guide <span>Setup · 20-minute plan · English support</span></summary><div class="teacher-content"><p class="guide-purpose">{esc(a["purpose"])}</p><p><strong>You need:</strong> {esc(a["prep"])}</p><h3>Before you start</h3><p>{esc(a['setup'])}</p><h3>The 20 minutes</h3><ol class="lesson-steps">{steps}</ol>{note}<h3>The English they’re using</h3><p>{esc(a['skills'])}</p><details><summary>Make it easier or harder</summary><p><strong>Keep it simple:</strong> {esc(a['support'])}</p><p><strong>Take it further:</strong> {esc(a['stretch'])}</p></details></div></details></div>
{timer()}
<nav class="activity-pager" aria-label="More activities"><a href="{prev['slug']}.html">← {esc(prev['title'])}</a><a href="../index.html">All activities</a><a href="{nxt['slug']}.html">{esc(nxt['title'])} →</a></nav>
</main>'''
    (SITE / 'activities' / (a['slug'] + '.html')).write_text(page(a['title'], content, '../', a, 'activity'))

tutorial = '''<main id="main" class="tutorial-page">
<p class="eyebrow">For colleagues</p><h1>A few notes before you start.</h1><p class="lead">You don’t need to plan a full English lesson for this. Choose a task the class can get into quickly, show them what to do, and give them most of the time to try it.</p>
<section class="tour-box" aria-labelledby="tour-title"><div class="tour-progress" id="tour-progress">1 of 5</div><h2 id="tour-title">Choose something straightforward</h2><p id="tour-copy">Start with Would You Rather? or Odd One Out. Both take very little explaining. The menu lets you narrow the list by the kind of activity you want.</p><div class="tour-example" id="tour-example">A good first question: would you rather be able to fly or become invisible? Ask them why.</div><div class="actions"><button class="button secondary" id="tour-back" disabled>← Back</button><button class="button primary" id="tour-next">Next →</button></div></section>
<section class="tutorial-timer"><h2>The timer</h2><p>Use 20 minutes for the whole session, or one minute for a short speaking turn. Use 30 seconds for an advert or a first attempt. Changing the length resets and pauses the timer.</p>''' + timer() + '''</section>
<section class="guide-grid"><article><h2>A quick check</h2><label class="check-row"><input type="checkbox"> I’ve read the setup.</label><label class="check-row"><input type="checkbox"> We have any paper or objects we need.</label><label class="check-row"><input type="checkbox"> I know how I’m grouping the class.</label><label class="check-row"><input type="checkbox"> I have one example ready.</label></article>
<article><h2>When they’re slow to get going</h2><p>Give them 20 seconds to think, then let them try an answer with a partner. Put a sentence starter on the board. If they can’t find a word, help them with it and carry on.</p><p>Keep movement optional. For personal questions, students can choose a different example.</p></article>
<article><h2>Using the board</h2><p><strong>Focus view</strong> enlarges the task and hides the surrounding navigation. <strong>Exit focus view</strong> brings it back. The teacher guide opens below each task; the timer sits just beneath it.</p><p>For guessing and drawing games, turn the guesser or drawer away before showing a secret card. Hide it before they turn back. Enlarging the page doesn’t hide the answer.</p></article>
<article><h2>A couple of practical details</h2><p>Enter a show of hands in the vote boxes, or use +1 to count as hands go up. Students don’t need their own devices. Ranking arrows move a shared list; groups can make their own lists on paper.</p><p>Changing the prompt clears its answers. Leaving or refreshing the page clears the timer as well. Nothing is saved or sent anywhere.</p></article></section>
<aside class="bottom-note"><strong>There’s no need to hear every group at the front.</strong><p>Have neighbouring groups share with each other, then take two or three answers from the room. It gives everyone a chance to speak without using up the whole morning.</p></aside>
<div class="tutorial-finish"><a class="button primary" href="activities/would-you-rather.html">Try Would You Rather?</a><a class="text-link" href="index.html">Back to the activities</a></div>
</main>'''
(SITE / 'tutorial.html').write_text(page('Teacher notes', tutorial, page_type='tutorial'))
(SITE / '.nojekyll').write_text('')
(SITE / '404.html').write_text('''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | Taihang House Activities</title><style>body{font:18px/1.6 system-ui,sans-serif;color:#263d49;max-width:600px;margin:15vh auto;padding:25px}a{color:inherit}</style></head><body><h1>That page isn’t here.</h1><p><a href="/esl-homeroom/">Back to the activities</a></p></body></html>''')
print(f'Built {len(activities)} activity pages, menu and teacher notes.')
