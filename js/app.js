/* Ascent Story — standalone app around the story card code (story-*.js).
   Activities come from Strava (OAuth) or from GPX/FIT files read in the
   browser. Either way they end up in `acts` in the shape of Strava's
   activity objects, which is what the story code draws from. */

let acts = [];

// Google Analytics event (no-op if gtag is blocked). Only action names, the
// template and the image size are sent — never file contents or activity data.
function track(name, params) { try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch {} }
// Templates whose elements overlap on shorter cards are only offered as stories.
const LAYOUT_NOT_AT = { 1350: ['hero', 'graphic'], 1080: ['hero', 'graphic', 'map', 'column', 'street'] };
function layoutFits(id) { const c = document.getElementById('storyCanvas'); return !(LAYOUT_NOT_AT[c ? c.height : 1920] || []).includes(id); }
const cardInfo = () => ({ template: activeLayout, size: (document.getElementById('ratioPicker') || {}).value });
const fileStreams = {}; // streams for activities read from files, by id

/* ── Strava auth ── */
const tok = {
  get access() { return localStorage.getItem('strava_access_token'); },
  get refresh() { return localStorage.getItem('strava_refresh_token'); },
  get expires() { return +localStorage.getItem('strava_expires_at') || 0; },
  save(d) {
    localStorage.setItem('strava_access_token', d.access_token);
    localStorage.setItem('strava_refresh_token', d.refresh_token);
    localStorage.setItem('strava_expires_at', d.expires_at);
  },
  clear() { ['strava_access_token', 'strava_refresh_token', 'strava_expires_at'].forEach(k => localStorage.removeItem(k)); },
};

async function connectStrava() {
  const r = await fetch('/api/config');
  const { clientId } = r.ok ? await r.json() : {};
  if (!clientId) { showError(tr('Strava login is not configured on this server. You can still upload a GPX or FIT file.')); return; }
  const q = new URLSearchParams({
    client_id: clientId, response_type: 'code', approval_prompt: 'auto',
    redirect_uri: location.origin + '/callback.html', scope: 'read,activity:read_all',
  });
  location.href = 'https://www.strava.com/oauth/authorize?' + q;
}

async function refreshToken() {
  const r = await fetch('/api/strava-token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: tok.refresh }),
  });
  if (!r.ok) { tok.clear(); throw new Error(tr('Strava session expired — connect again')); }
  tok.save(await r.json());
}

/* The story code calls api('/activities/{id}') and api('/activities/{id}/streams?…').
   Activities read from a file are answered locally; the rest go to Strava. */
async function api(ep, retry = false) {
  const m = ep.match(/^\/activities\/(file-[\w-]+)(\/streams)?/);
  if (m) {
    if (m[2]) return fileStreams[m[1]] || {};
    return acts.find(a => a.id === m[1]) || {};
  }
  if (!tok.access) throw new Error(tr('Not connected to Strava'));
  if (tok.expires * 1000 < Date.now() + 60000) await refreshToken();
  const r = await fetch('https://www.strava.com/api/v3' + ep, { headers: { Authorization: 'Bearer ' + tok.access } });
  if (r.status === 401 && !retry) { await refreshToken(); return api(ep, true); }
  if (!r.ok) throw new Error('Strava API ' + r.status);
  return r.json();
}

async function loadStravaActivities() {
  setStatus(tr('Loading your Strava activities…'));
  const list = [];
  for (let page = 1; page <= 2; page++) {
    const batch = await api(`/athlete/activities?per_page=100&page=${page}`);
    list.push(...batch);
    if (batch.length < 100) break;
  }
  return list;
}

/* ── GPX / FIT ── */
const R = 6371000, rad = d => d * Math.PI / 180;
function haversine(a, b) {
  const dLa = rad(b.lat - a.lat), dLn = rad(b.lng - a.lng);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Keep at most `max` points, evenly spaced, for the summary polyline.
const thin = (pts, max) => pts.length <= max ? pts : Array.from({ length: max }, (_, i) => pts[Math.round(i * (pts.length - 1) / (max - 1))]);

/** Build a Strava-like activity (and its streams) from track points:
    [{lat, lng, ele, time (ms), hr, cad, power}] plus optional summary values. */
function activityFromPoints(id, name, type, pts, summary = {}) {
  pts = pts.filter(p => isFinite(p.lat) && isFinite(p.lng) && !(p.lat === 0 && p.lng === 0));
  if (pts.length < 2) throw new Error(tr('No GPS track in this file'));
  let dist = 0, moving = 0, maxSpeed = 0, gain = 0, lastEle = null;
  const dStream = [0], vStream = [0];
  for (let i = 1; i < pts.length; i++) {
    const d = haversine(pts[i - 1], pts[i]);
    const dt = (pts[i].time - pts[i - 1].time) / 1000;
    dist += d; dStream.push(dist);
    const v = dt > 0 ? d / dt : 0;
    vStream.push(v);
    if (dt > 0 && dt < 30 && v > 0.5) moving += dt; // pauses and stops don't count as moving
  }
  // max speed over a 5-point window, so single GPS jumps don't count
  for (let i = 4; i < vStream.length; i++) maxSpeed = Math.max(maxSpeed, (vStream[i] + vStream[i - 1] + vStream[i - 2] + vStream[i - 3] + vStream[i - 4]) / 5);
  // elevation gain with a 2 m deadband against GPS/barometer noise
  for (const p of pts) {
    if (p.ele == null) continue;
    if (lastEle == null) lastEle = p.ele;
    else if (p.ele - lastEle > 2) { gain += p.ele - lastEle; lastEle = p.ele; }
    else if (lastEle - p.ele > 2) lastEle = p.ele;
  }
  const avg = k => { const v = pts.map(p => p[k]).filter(x => x > 0); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const max = k => { const v = pts.map(p => p[k]).filter(x => x > 0); return v.length ? v.reduce((m, x) => x > m ? x : m, 0) : null; };
  const t0 = pts[0].time, t1 = pts[pts.length - 1].time;
  const elapsed = t0 && t1 ? Math.round((t1 - t0) / 1000) : 0;
  if (!moving) moving = elapsed;
  dist = summary.distance || dist;
  moving = summary.moving_time || moving;
  const act = {
    id, name, type, sport_type: type,
    start_date: new Date(t0 || Date.now()).toISOString(),
    start_date_local: new Date(t0 || Date.now()).toISOString(),
    distance: dist, moving_time: Math.round(moving), elapsed_time: summary.elapsed_time || elapsed,
    total_elevation_gain: Math.round(summary.total_elevation_gain || gain),
    average_speed: moving ? dist / moving : 0,
    max_speed: summary.max_speed || maxSpeed,
    average_heartrate: summary.average_heartrate || avg('hr'),
    max_heartrate: summary.max_heartrate || max('hr'),
    average_cadence: summary.average_cadence || avg('cad'),
    average_watts: summary.average_watts || avg('power'),
    calories: summary.calories || null,
    start_latlng: [pts[0].lat, pts[0].lng],
    map: { summary_polyline: encodePolyline(thin(pts, 1500).map(p => [p.lat, p.lng])) },
    _detailed: true, _fromFile: true,
    _noTime: !elapsed && !summary.moving_time, // a planned route: no timestamps
  };
  const s = thin(pts.map((p, i) => ({ ...p, d: dStream[i], v: vStream[i] })), 2000);
  const streams = { distance: { data: s.map(p => p.d) }, velocity_smooth: { data: s.map(p => p.v) } };
  if (s.some(p => p.ele != null)) streams.altitude = { data: s.map(p => p.ele ?? 0) };
  if (s.some(p => p.hr)) streams.heartrate = { data: s.map(p => p.hr || 0) };
  if (s.some(p => p.cad)) streams.cadence = { data: s.map(p => p.cad || 0) };
  fileStreams[id] = streams;
  return act;
}

const GPX_TYPES = { running: 'Run', run: 'Run', trail_running: 'TrailRun', walking: 'Walk', hiking: 'Hike', mountain_biking: 'MountainBikeRide', gravel_cycling: 'GravelRide' };
function parseGpx(text, id, fileName) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error(tr('Not a valid GPX file'));
  const pick = (el, tag) => { const n = el.getElementsByTagNameNS('*', tag)[0]; return n ? parseFloat(n.textContent) : null; };
  const pts = [...doc.getElementsByTagNameNS('*', 'trkpt'), ...doc.getElementsByTagNameNS('*', 'rtept')].map(el => {
    const time = el.getElementsByTagNameNS('*', 'time')[0];
    return {
      lat: parseFloat(el.getAttribute('lat')), lng: parseFloat(el.getAttribute('lon')),
      ele: pick(el, 'ele'), time: time ? Date.parse(time.textContent) : 0,
      hr: pick(el, 'hr'), cad: pick(el, 'cad'), power: pick(el, 'power'),
    };
  });
  const trk = doc.getElementsByTagNameNS('*', 'trk')[0];
  const nameEl = trk && trk.getElementsByTagNameNS('*', 'name')[0];
  const typeEl = trk && trk.getElementsByTagNameNS('*', 'type')[0];
  const t = typeEl ? typeEl.textContent.trim() : '';
  const type = GPX_TYPES[t.toLowerCase()] || (/^[A-Z]/.test(t) ? t : 'Ride');
  return activityFromPoints(id, nameEl ? nameEl.textContent.trim() : fileName.replace(/\.\w+$/, ''), type, pts);
}

const FIT_SPORTS = { cycling: 'Ride', running: 'Run', walking: 'Walk', hiking: 'Hike', swimming: 'Swim', eBiking: 'EBikeRide' };
const FIT_SUB = { mountain: 'MountainBikeRide', gravelCycling: 'GravelRide', trail: 'TrailRun', virtualActivity: 'VirtualRide', indoorCycling: 'VirtualRide' };
async function parseFit(buf, id, fileName) {
  const { Decoder, Stream } = await import('https://cdn.jsdelivr.net/npm/@garmin/fitsdk@21/+esm');
  const decoder = new Decoder(Stream.fromArrayBuffer(buf));
  if (!decoder.isFIT()) throw new Error(tr('Not a valid FIT file'));
  const { messages, errors } = decoder.read();
  if (errors && errors.length && !(messages.recordMesgs || []).length) throw new Error(tr('Could not read this FIT file'));
  const semi = v => v * (180 / 2 ** 31);
  const pts = (messages.recordMesgs || []).filter(r => r.positionLat != null && r.positionLong != null).map(r => ({
    lat: semi(r.positionLat), lng: semi(r.positionLong),
    ele: r.enhancedAltitude ?? r.altitude ?? null, time: r.timestamp ? new Date(r.timestamp).getTime() : 0,
    hr: r.heartRate || null, cad: r.cadence || null, power: r.power || null,
  }));
  const ses = (messages.sessionMesgs || [])[0] || {};
  const type = FIT_SUB[ses.subSport] || FIT_SPORTS[ses.sport] || 'Ride';
  return activityFromPoints(id, fileName.replace(/\.\w+$/, ''), type, pts, {
    distance: ses.totalDistance, moving_time: ses.totalTimerTime, elapsed_time: ses.totalElapsedTime,
    total_elevation_gain: ses.totalAscent, max_speed: ses.enhancedMaxSpeed ?? ses.maxSpeed,
    average_heartrate: ses.avgHeartRate, max_heartrate: ses.maxHeartRate, average_cadence: ses.avgCadence,
    average_watts: ses.avgPower, calories: ses.totalCalories,
  });
}

let fileSeq = 0;
async function readFiles(files) {
  const added = [];
  for (const f of files) {
    const id = 'file-' + Date.now().toString(36) + '-' + (fileSeq++);
    try {
      if (/\.gpx$/i.test(f.name)) { added.push(parseGpx(await f.text(), id, f.name)); track('file_import', { file_type: 'gpx' }); }
      else if (/\.fit$/i.test(f.name)) { added.push(await parseFit(await f.arrayBuffer(), id, f.name)); track('file_import', { file_type: 'fit' }); }
      else throw new Error(tr('Use a .gpx or .fit file'));
    } catch (e) { showError(`${f.name}: ${e.message}`); track('file_import_error', { reason: e.message.slice(0, 80) }); }
  }
  if (!added.length) return;
  setStatus(added.length === 1 ? trf('Loaded {0}', added[0].name) : trf('Loaded {0} files', added.length));
  addActivities(added);
}

// A file only has the stats it recorded (a planned route has no times at all),
// so leave off the ones it lacks instead of drawing 0 or a dash.
const _statApplies = statApplies;
statApplies = (s, a) => {
  if (!_statApplies(s, a)) return false;
  if (!a || !a._fromFile) return true;
  const field = s.key === 'pace' ? 'average_speed' : s.key;
  return !!a[field] && !(a._noTime && ['moving_time', 'pace', 'average_speed', 'max_speed'].includes(s.key));
};

/* ── UI ── */
const $ = id => document.getElementById(id);
function setStatus(msg) { $('status').textContent = msg || ''; $('error').textContent = ''; }
function showError(msg) { $('error').textContent = msg; $('status').textContent = ''; }

// A made-up loop so the preview is never empty before real data arrives.
function sampleActivity() {
  const t0 = Date.now() - 3 * 3600e3, pts = [];
  for (let i = 0; i <= 360; i++) {
    const a = i / 360 * 2 * Math.PI;
    pts.push({ lat: -8.28 + 0.05 * Math.sin(a) + 0.012 * Math.sin(5 * a), lng: 115.16 + 0.07 * Math.cos(a) + 0.01 * Math.cos(3 * a),
      ele: 300 + 180 * Math.max(0, Math.sin(a - 1)), time: t0 + i * 20e3, hr: 138 + Math.round(14 * Math.sin(2 * a)), cad: 86 });
  }
  const act = activityFromPoints('file-sample', tr('Sample ride'), 'Ride', pts);
  act._sample = true;
  return act;
}

// (Re)build the editor for the current `acts`, selecting `index`.
function showActivities(index = 0) {
  openStoryModal();
  const picker = $('activityPicker');
  const pick = picker.onchange;
  picker.onchange = async () => { await pick(); syncName(); };
  if (index > 0 && picker.options[index]) { picker.value = String(index); picker.onchange(); } else syncName();
}

const currentAct = () => acts[parseInt($('activityPicker').value) || 0] || {};
function syncName() { $('actName').value = currentAct().name || ''; }

function addActivities(list, select) {
  acts = [...list, ...acts.filter(a => !a._sample && !list.includes(a))].sort((a, b) => b.start_date.localeCompare(a.start_date));
  showActivities(Math.max(0, acts.indexOf(select || list[0])));
}

function renderSource() {
  const connected = !!tok.access;
  $('connectBtn').hidden = connected;
  $('stravaRow').hidden = !connected;
}

function setSourceTab(name) {
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.src === name));
  document.querySelectorAll('.src-pane').forEach(p => { p.hidden = p.dataset.pane !== name; });
  try { localStorage.setItem('story_src', name); } catch {}
}

async function openStrava() {
  try {
    const list = await loadStravaActivities();
    setStatus(list.length ? trf('{0} activities loaded from Strava', list.length) : '');
    if (!list.length) { showError(tr('No activities found on your Strava account.')); return; }
    acts = acts.filter(a => a._fromFile && !a._sample); // keep uploaded files, drop the sample
    addActivities(list);
  } catch (e) { showError(e.message); renderSource(); }
}

// Render the PNG without the drag guides of the editable layouts.
function exportCanvas(done) {
  const canvas = $('storyCanvas');
  const editable = activeLayout === 'custom' || activeLayout === 'collage';
  const wasEditing = customEditMode;
  if (editable && wasEditing) { customEditMode = false; drawStoryCanvas(); }
  canvas.toBlob(blob => {
    if (editable && wasEditing) { customEditMode = true; drawStoryCanvas(); }
    if (blob) done(blob);
  }, 'image/png');
}

// Stat labels are drawn on the cards too, so they follow the language.
function localizeStats() { STAT_DEFS.forEach(d => { if (d._en == null) d._en = d.label; d.label = tr(d._en); }); }

document.addEventListener('DOMContentLoaded', () => {
  applyLang(); localizeStats();
  document.querySelectorAll('.lang-btn').forEach(b => b.onclick = () => {
    if (b.dataset.lang === window.LANG) return;
    setLang(b.dataset.lang); localizeStats(); track('language_select', { language: b.dataset.lang });
    const sample = acts.find(a => a._sample); if (sample) sample.name = tr('Sample ride');
    showActivities(parseInt($('activityPicker').value) || 0);
    if (acts.length === 1 && sample) setStatus(tr('Showing a sample ride. Add your own file to replace it.'));
  });
  renderSource();
  $('connectBtn').onclick = () => { track('strava_connect_start'); connectStrava(); };
  $('layoutPicker').addEventListener('click', e => { const b = e.target.closest('.layout-btn'); if (b) track('template_select', { template: b.dataset.layout }); });
  $('stravaBtn').onclick = openStrava;
  $('logoutBtn').onclick = () => { tok.clear(); renderSource(); setStatus(tr('Disconnected from Strava')); };
  document.querySelectorAll('.seg-btn').forEach(b => b.onclick = () => setSourceTab(b.dataset.src));
  let tab = 'file'; try { tab = localStorage.getItem('story_src') || tab; } catch {}
  setSourceTab(tab);

  // image size: the canvas stays 1080 wide, only the height changes
  const setRatio = h => {
    $('storyCanvas').height = h;
    if (!layoutFits(activeLayout)) activeLayout = 'strava';
    document.querySelector('.story-preview').style.aspectRatio = `1080 / ${h}`;
    $('ratioPicker').value = String(h);
    try { localStorage.setItem('story_h', String(h)); } catch {}
  };
  let savedH = 1920; try { savedH = +localStorage.getItem('story_h') || 1920; } catch {}
  setRatio([1920, 1350, 1080].includes(savedH) ? savedH : 1920);
  $('ratioPicker').onchange = e => { setRatio(+e.target.value); track('size_select', { size: e.target.selectedOptions[0].text }); showActivities(parseInt($('activityPicker').value) || 0); };

  $('unitToggle').value = useImperial ? 'mi' : 'km';
  $('unitToggle').onchange = e => { setUnits(e.target.value === 'mi'); showActivities(parseInt($('activityPicker').value) || 0); };
  $('actName').oninput = e => { currentAct().name = e.target.value; drawStoryCanvas(); };

  const input = $('fileInput');
  input.onchange = () => { readFiles([...input.files]); input.value = ''; };
  // a GPX/FIT dropped anywhere on the page is imported (not opened by the browser);
  // photos dropped elsewhere are left alone
  const drop = $('dropZone');
  const hasFiles = e => [...(e.dataTransfer && e.dataTransfer.types || [])].includes('Files');
  window.addEventListener('dragover', e => { if (hasFiles(e)) { e.preventDefault(); drop.classList.add('over'); } });
  window.addEventListener('dragleave', e => { if (!e.relatedTarget) drop.classList.remove('over'); });
  window.addEventListener('drop', e => {
    drop.classList.remove('over');
    const files = [...(e.dataTransfer && e.dataTransfer.files || [])].filter(f => /\.(gpx|fit)$/i.test(f.name));
    if (!files.length) { if (hasFiles(e) && !e.target.closest('input[type=file]')) e.preventDefault(); return; }
    e.preventDefault(); setSourceTab('file'); readFiles(files);
  });

  $('downloadBtn').onclick = () => exportCanvas(blob => {
    const a = document.createElement('a');
    a.download = 'story.png'; a.href = URL.createObjectURL(blob); a.click();
    track('story_download', cardInfo());
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  if (navigator.clipboard && window.ClipboardItem) {
    $('copyBtn').onclick = () => exportCanvas(async blob => {
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); setStatus(tr('Image copied')); track('story_copy', cardInfo()); }
      catch { showError(tr('Copy is not allowed here — use Download')); }
    });
  } else $('copyBtn').hidden = true;
  // Web Share (Instagram / WhatsApp / …) where the browser can share files, mostly mobile
  let canShareFiles = false;
  try { canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [new File([new Blob()], 'x.png', { type: 'image/png' })] })); } catch {}
  if (canShareFiles) {
    $('shareStoryBtn').style.display = '';
    $('shareStoryBtn').onclick = () => exportCanvas(async blob => {
      try { await navigator.share({ files: [new File([blob], 'story.png', { type: 'image/png' })], title: 'My activity' }); track('story_share', cardInfo()); } catch {}
    });
  }

  acts = [sampleActivity()];
  showActivities(0);
  setStatus(tr('Showing a sample ride. Add your own file to replace it.'));
  const q = new URLSearchParams(location.search);
  if (q.has('connected')) { track('login', { method: 'Strava' }); history.replaceState(null, '', '/'); }
  if (tok.access) openStrava();
});
