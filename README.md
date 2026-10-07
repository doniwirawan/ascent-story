# Ascent Story

Turn a ride, run or walk into a 1080×1920 story image for Instagram, WhatsApp
and friends. Pick an activity from Strava, or drop a GPX or FIT file.

**Live:** https://story.doniwirawan.xyz

- 35 templates: map + stats cards, elevation and pace charts, splits, a free-placement
  "Custom" layout you can drag around, and a collage of your longest rides
- Themes, accent colour, your own background photo, and which stats to show
- Download, copy, or share straight to other apps on a phone
- Everything runs in the browser. GPX/FIT files are never uploaded; Strava data
  is fetched straight from Strava's API into the page.

This is the story card from [Ascent](https://ascent-analytics.doniwirawan.xyz/),
a personal Strava dashboard, pulled out into its own app.

## How it works

It is a static site: no build step, no framework.

| File | What it does |
|---|---|
| `index.html` | The editor page |
| `js/app.js` | Strava login, GPX/FIT reading, and the `api()` shim the story code calls |
| `js/utils.js` | Formatting and unit helpers (km/mi) |
| `js/story-core.js` | Templates list, themes, stat definitions, saved settings |
| `js/story-draw.js` | Route and icon drawing |
| `js/story-layouts.js` | Every template, drawn with the Canvas 2D API |
| `js/story-ui.js` | The editor controls and drag-to-place editing |
| `api/strava-token.js` | Exchanges and refreshes Strava tokens (keeps the client secret on the server) |
| `api/config.js` | Hands the public Strava client id to the browser |

Activities from either source end up in the same shape as Strava's activity
objects, so the templates don't care where the data came from. FIT files are
decoded with Garmin's [FIT JavaScript SDK](https://github.com/garmin/fit-javascript-sdk),
loaded from jsDelivr only when you open a FIT file.

## Run it yourself

1. Create a Strava API application at https://www.strava.com/settings/api and
   set its *Authorization Callback Domain* to your domain (`localhost` for local work).
2. Deploy to Vercel (or anything that serves static files plus Node functions in `api/`)
   with these environment variables:
   ```
   STRAVA_CLIENT_ID=
   STRAVA_CLIENT_SECRET=
   ```
3. For local development: `vercel dev`. File upload works without any
   setup; only Strava login needs the variables.

New Strava API applications can only be connected by a small number of
athletes until Strava reviews them. GPX/FIT upload has no such limit.

## License

MIT, see [LICENSE](LICENSE). Not affiliated with or endorsed by Strava.
