# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Riders and runners anywhere who want a better-looking share card for an activity than the one
their tracking app gives them. They arrive from search, a shared card, GitHub or the Ascent
dashboard, usually on a phone right after an activity, and want a finished image for an Instagram
story or post within a minute. Most are not technical and won't read instructions.

## Product Purpose

Ascent Story turns one activity (a ride, run, hike, walk or swim) into a 1080-wide image: Story
9:16, Portrait 4:5 or Square 1:1. The user picks a template, theme and stats, optionally adds a
photo, and downloads, copies or shares the PNG.

Success means, in this order of evidence:
- cards actually downloaded and shared (GA4 events `story_download`, `story_copy`, `story_share`);
- recognition as an open-source project (GitHub stars and forks on doniwirawan/ascent-story);
- traffic into the Ascent dashboard (https://ascent-analytics.doniwirawan.xyz/);
- support from users (Ko-fi).

## Positioning

Free, no sign-up, and fully in the browser: GPX and FIT files are read on the device and never
uploaded, and Strava data goes straight from Strava's API into the page. It works without Strava
at all, so it isn't capped by Strava's athlete limit. Open source under MIT. The templates are the
same ones that power the Story card in the Ascent dashboard.

## Operating Context

- Typical session: phone, outdoors or just home, activity just finished; file picked from the
  device or dropped on desktop. Sharing goes through the OS share sheet (Web Share) or a download.
- Data sources: Strava OAuth (same Strava API app as Ascent), or GPX/FIT exported from Strava,
  Garmin Connect, Wahoo, Coros, Huawei, Komoot and similar.
- Hosted on Vercel at https://story.doniwirawan.xyz; the GitHub repo deploys on push.

## Capabilities and Constraints

- Static site, no build step, no framework: `index.html`, `js/*.js`, `css/*.css`, two Vercel
  functions in `api/` (Strava token exchange, public config). Keep it that way.
- 43 canvas templates in `js/story-layouts.js`, shared with the Ascent repo's copy; a template
  added here should be added there too. Each must scale with `S = W/1080`, work at heights 1920,
  1350 and 1080 (or be listed in `LAYOUT_NOT_AT`), honour the hide toggles, and use only the ticked
  stats.
- A "Custom" template allows dragging, resizing, flipping and hiding card elements.
- Strava login: the Strava app is capped at 10 connected athletes (full) and its callback domain
  is `ascent-analytics.doniwirawan.xyz`, so Strava connect does not work on this domain yet. The
  owner has chosen not to change that for now; the file upload is the primary path.
- Never use "Strava" in the product name or as a wordmark on cards (Strava brand rules, and they
  block the API review that lifts the athlete cap). "Works with Strava" in descriptions is fine.
- Analytics: GA4 property G-Y4VRDE800Q. Events carry only action names, template and size — never
  activity data or file contents.
- English and Bahasa Indonesia (EN / ID switch; browser language picks the default). UI strings and
  card stat labels and dates follow the language; template names and activity types stay English.
  New UI text needs a `TR_ID` entry in `js/i18n.js`.

## Brand Commitments

- Name: "Ascent Story" (owner decision; keep). Part of the Ascent family; the cards carry an
  "ASCENT" watermark that users can hide.
- Ascent's orange (#FC4C02) is the accent.
- Plain, direct copy that states what happens to the user's data.

## Evidence on Hand

- Live product and repo: https://story.doniwirawan.xyz, https://github.com/doniwirawan/ascent-story.
- Share preview image: `og.png` (rendered from the app's own templates).
- Ko-fi page: https://ko-fi.com/L7T7234BJ2 (linked from the Ascent README).
- No testimonials, user counts, press or download numbers exist yet — do not invent any.

## Product Principles

1. A finished card in under a minute: the template choice and download come first, settings later.
2. The user's data stays with the user; say so plainly, and never send activity data to analytics.
3. Works for everyone without Strava; Strava is a convenience, not a requirement.
4. Every template must look finished with any data — missing stats, no photo, no elevation, any size.
5. Open and forkable: no build step, no secrets in the browser, clear README.

## Accessibility & Inclusion

Text in the editor meets WCAG AA contrast (4.5:1 body, 3:1 large). Controls are usable by keyboard
and on touch screens; the phone layout has no horizontal scroll.
