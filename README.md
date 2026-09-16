# Extroverts — Signup Wizard (web replication)

A front-end replication of the signup experience in **Extroverts — Party • Hangout • Vibe**
(`com.pro.nubpack`): the landing mechanism, the terms & community rules page, and the
four-step signup wizard.

No build step, no dependencies, no back end. Every "network" call is simulated so that
loading, success and failure states can all be shown on demand.

---

## Running it

Open `index.html` in a browser. That is the whole setup.

If you prefer a local server (identical result):

```bash
npx serve .
# or
python -m http.server 5173
```

Then visit `http://localhost:5173`.

**Demo credentials**

| Input | Value | What happens |
| --- | --- | --- |
| OTP | `123456` | Verifies. Anything else fails (3 attempts, then the code locks) |
| Any new email | e.g. `you@college.edu` | Normal signup path |
| `member@extroverts.app` | — | "Account already exists" → auto-switches to log in |
| Any email in log-in mode | not in the list | "No account found with that email" |
| Handle `honey`, `admin`, `party`, `vibe`, `host`, `test` | — | Reported as taken by the availability check |

A **Demo controls** chip sits in the bottom-right corner. It forces a slow network,
a send-code failure, or a submit failure, and can autofill the current step — so the
failure paths can be shown deliberately instead of waited for.

---

## Structure

```
index.html          all four screens + terms + success + modal
css/styles.css      design tokens and every component
js/data.js          states → cities → colleges, party themes, taken handles
js/app.js           router, story carousel, validation engine, wizard, draft persistence
assets/             landing collage photographs, avatars, and the brand-pane photo
```

The source carries no comments by request; this README is the documentation.

---

## The flow

**1 · Landing.** A two-column hero: the rotating headline, CTAs and value props on the
left, a tilted photo collage on the right with floating "Real people / Create real
memories" pills and handwritten margin notes.

The story mechanism from the app's onboarding is kept — the headline and subhead
auto-advance through three slides, and the progress bars moved up beside *Honey presents*
in the top bar. Tap left/right, swipe, or hold to pause; arrow keys work too. The slides
are stacked in a single CSS grid cell so the buttons below never shift when a taller
headline rotates in.

The hero adapts in two stages rather than one. From **700–999 px** (tablet) it becomes a
single centred column with the collage re-laid-out underneath as a wide band — three cards
across, the "Real people" pill kept, the second pill and the handwritten notes dropped
because they need horizontal room. **Below 700 px** the collage goes entirely and the hero
is the centred type treatment, which is what the app itself shows on a phone.

**2 · Terms & Community Rules.** A real, readable document. The agree checkbox stays
locked until the reader reaches the end (or until the document is short enough not to
scroll). Decline returns to the landing page.

**3 · The wizard.**

| Step | Collects | Notable logic |
| --- | --- | --- |
| 1 | Email → OTP, or Google | Progressive disclosure: nothing else is asked until the email is verified |
| 2 | Name, date of birth, pronouns | Live age chip, hard 18+ gate |
| 3 | State → city → college, phone | Cross-field dependency, +91 numeric-only |
| 4 | Handle, party themes, bio | Debounced availability check, 3–6 theme selection, 150-char bio |

On the left of every step sits a brand pane: the dusk photograph, the rotating headline
for that step with one line in the brand gradient, the numbered step list with the
current step marked in violet, and the *Real people. Real moments.* tagline pinned to the
bottom. It collapses below 1000 px, where the form takes the full width.

**Continue with Google** on step 1 is **simulated** — there is no OAuth in a front-end
exercise. It shows the real loading state, then treats the address as already verified
and skips the OTP step, which is what a genuine Google hand-off would do.

**4 · Success.** A profile card built from everything that was entered, plus the Bronze
Club / Honorary Vibe Tokens nod from the app.

---

## Validation

Fields validate quietly on the first pass and loudly once touched: the first check runs
**on blur**, and every keystroke after that re-validates **on input**, so an error
disappears the moment it is fixed rather than at the next submit.

- **Email** — format, no whitespace, 254-char ceiling, consecutive-dot rejection. Spaces
  are stripped as they are typed.
- **Name** — 2–40 characters, letters/spaces/hyphens/apostrophes only, digits rejected,
  leading spaces stripped, whitespace-only rejected.
- **Date of birth** — three numeric boxes that auto-advance and backspace-retreat. Real
  calendar validation (31 February is refused), no future dates, a sanity ceiling at 100,
  and a **live age chip** that turns red the moment the date implies someone under 18.
- **Phone** — numeric-only at the keypress level, formatted `98765 43210`, must start
  6–9, repeated-digit numbers rejected, and a running `5/10 so far` count while short.
- **Handle** — forced lowercase, `a-z0-9_` only, 3–20 characters, not all digits, then a
  debounced 600 ms availability check with an inline spinner and a suggested alternative
  when taken.
- **Themes** — minimum 3, maximum 6, with the remaining chips visibly dimmed at the cap.
- **Bio** — optional, 150-character live counter that turns amber then red, and a
  whitespace-only guard.

**Errors** appear beneath the field in red, the field border and fill turn red, and the
control shakes. A failed submit also raises a **global toast** naming how many fields need
attention and focuses the first one. On the final step, a server failure raises an
inline **error banner with a Retry button** instead — the form is never cleared.

**Loading** states disable the button, dim its label and spin an inline spinner, so a
double submit is impossible.

---

## What I changed, and why

The brief asked for improvements rather than a literal copy. These are the deliberate
departures:

1. **The OTP screen is rebuilt.** Six separate boxes instead of one field: auto-advance,
   backspace-retreat, arrow-key navigation, `one-time-code` autofill, full paste support
   (pasting six digits fills all six boxes and submits), and auto-submit on the sixth
   digit. The code is masked behind a 30-second resend timer, wrong attempts are counted
   down out loud (`2 attempts left`), and after three failures the code locks and resend
   becomes the only way forward — which is what a real OTP endpoint does.

2. **Under-18 is handled before submit, not after.** The app lets you fill the date and
   find out later. Here the age appears as a chip as soon as the year is complete, turns
   red at 17 and below, and the copy explains the rule instead of just refusing.

3. **The terms page is enforceable.** Agreement unlocks only after the document has
   actually been scrolled, which is the difference between a consent record and a
   checkbox.

4. **Progress survives a refresh.** Every step is written to `localStorage`, and the
   landing CTA changes to *Continue your signup* with the step number restored. Closing
   the wizard asks first.

5. **Cross-field resets are explained.** Changing state clears the city and college and
   says so in a toast, instead of silently leaving a stale city selected.

6. **Both directions work.** Going back preserves every value and its validation state,
   and the step you return to is the step you left.

7. **Log in shares the wizard.** The same email + OTP pane serves log in, and each path
   corrects the other: signing up with a known email switches you to log in, logging in
   with an unknown one offers signup.

8. **Accessibility.** Labels on every control, `role="alert"` error regions, an
   `aria-live` step counter, visible focus rings, full keyboard operation, and a
   `prefers-reduced-motion` path that removes the animation.

---

## Responsive

Verified at 320, 390, 768, 834, 1024, 1440 and 1920 px — no horizontal scroll at any of
them. One centred column on phone and tablet; from 1000 px the wizard splits into a brand
pane (photograph, headline, step list) and a deeper frosted form panel, so the background
never competes with an input.

Form fields stay left-aligned at every width even though the landing copy centres — a
centred label above a left-aligned input leaves a ragged edge that is slower to scan, and
forms are the one place where centring costs more than it gains.

---

## Assets

The `E°` wordmark, the favicon, the background pattern, the feature icons and every
control are drawn in CSS/SVG. Type is **Poppins** for the UI, **Playfair Display** for the
display wordmark and **Caveat** for the handwritten notes, all from Google Fonts with
system fallback stacks.

The seven photographs in the landing collage (three cards, four avatars) are from
**Unsplash**, whose licence permits free commercial use. They are **downloaded into
`assets/` rather than hot-linked** — a remote image is a hard dependency the page cannot
recover from, and a slow or blocked CDN would leave visible holes in the hero. Nothing but
the font files is fetched at runtime, and those have system fallback stacks.

`assets/brandpane.jpg` is the dusk photograph behind the wizard's brand pane. The source
was a 1.79 MB PNG; it is re-encoded here to a 1200 px JPEG at **57 KB** — a 31× saving,
which matters because the pane paints the moment the wizard opens. The pane declares
`background-size:cover` with a bottom-weighted scrim so the sky reads at the top and the
headline, subhead and step list sit on near-black. The image is only requested at ≥1000 px,
since `.brandpane` is `display:none` below that.

### Background pattern

The backdrop is the *Elegant Dark Pattern* component (a React/Tailwind component from
21st.dev), ported to plain CSS in `css/styles.css` under **ELEGANT DARK PATTERN**. It
layers a corner-lit gradient, five 45°-skewed light streaks with staggered gradient
masks, film grain, a dot grid and a starfield. It is the only background layer.

Three deliberate changes from the original:

- **The single cyan streak colour became the app icon's spectrum.** Each of the five
  beams takes its own stop — blue, violet, magenta, coral, orange — so they sweep across
  the page the way the icon's gradient sweeps across its square, and the corner light is
  tinted to match (blue top-left, magenta centre, orange bottom-right).
- **A starfield was added**, because the icon is speckled with stars.
- **The grain texture is an inline SVG `feTurbulence`** instead of the component's
  `cdn.21st.dev` PNG — no network dependency, so the texture cannot silently fail.

The wizard's form column sits on a frosted scrim (`rgba(0,0,0,.42)` plus a backdrop blur,
deepening to `.72` from 700 px) so the pattern stays visible behind the fields without
ever competing with a label.

### Colour roles

The palette comes from the app icon: `--c-blue #2B36C4`, `--c-violet #6B3BD6`,
`--c-pink #E8479B`, `--c-orange #FF7A33`, combined in `--grad` for the success badge,
the avatar and the active progress segment.

The call to action is **violet**, `--brand #7C5CFF`, and interactive states (focus rings,
links, the live step marker) use a lighter tint of it, `--accent #8B72FF`. Violet rather
than the icon's pink middle: pink sits about 27° from the error red on the colour wheel,
so a pink focus ring and a red error field read as the same state — especially for anyone
with a colour-vision difference. Violet keeps the four roles distinct: violet focus and
CTA, red error, green valid, spectrum for celebration.

The primary button is a violet pill in sentence case through the terms sheet, the wizard
and the success screen. The landing hero keeps an uppercase **white** pill, because there
it sits on photography where violet-on-photo would lose contrast.
