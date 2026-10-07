/* Formatting and sport helpers the story card code relies on.
   Distances are metres and speeds m/s internally, as in the Strava API. */

function decodePolyline(enc) {
  const pts=[]; let i=0,lat=0,lng=0;
  while(i<enc.length){
    let s=0,r=0,b; do{b=enc.charCodeAt(i++)-63;r|=(b&31)<<s;s+=5;}while(b>=32);
    lat+=(r&1)?~(r>>1):(r>>1);
    s=r=0; do{b=enc.charCodeAt(i++)-63;r|=(b&31)<<s;s+=5;}while(b>=32);
    lng+=(r&1)?~(r>>1):(r>>1);
    pts.push([lat/1e5,lng/1e5]);
  }
  return pts;
}

// Google polyline encoding, for routes read from GPX/FIT files.
function encodePolyline(pts) {
  let out='', pLat=0, pLng=0;
  const enc=v=>{ v=v<0?~(v<<1):(v<<1); let s=''; while(v>=0x20){ s+=String.fromCharCode((0x20|(v&0x1f))+63); v>>=5; } return s+String.fromCharCode(v+63); };
  for (const [la,ln] of pts) {
    const lat=Math.round(la*1e5), lng=Math.round(ln*1e5);
    out+=enc(lat-pLat)+enc(lng-pLng); pLat=lat; pLng=lng;
  }
  return out;
}

/* ── UNITS (km / mi toggle) ── */
let useImperial = (() => { try { return localStorage.getItem('units') === 'mi'; } catch { return false; } })();
const _MI = 1.60934, _FT = 3.28084;
const distUnit  = () => useImperial ? 'mi' : 'km';
const elevUnit  = () => useImperial ? 'ft' : 'm';
const speedUnit = () => useImperial ? 'mph' : 'km/h';
const elevVal = m  => useImperial ? m*_FT : m;
const kmh     = ms => +(ms * (useImperial ? 2.23694 : 3.6)).toFixed(1);
function setUnits(imperial){
  useImperial = !!imperial;
  try { localStorage.setItem('units', useImperial ? 'mi' : 'km'); } catch {}
}

const cleanMax = a => { const v = a && a.max_speed; return v > 0 ? v : 0; };
const fmtPace = ms => {
  if (!ms || ms <= 0) return '—';
  const spu = (useImperial ? _MI*1000 : 1000) / ms;
  const m = Math.floor(spu/60), s = Math.round(spu%60);
  const mm = s===60 ? m+1 : m, ss = s===60 ? 0 : s;
  return `${mm}:${String(ss).padStart(2,'0')} /${distUnit()}`;
};
const fmtD = m => {
  if (useImperial) { const mi=(m/1000)/_MI; return mi>=0.1 ? mi.toFixed(1)+' mi' : Math.round(m*_FT)+' ft'; }
  return m >= 1000 ? (m/1000).toFixed(1)+' km' : Math.round(m)+' m';
};
const fmtElev = m => Math.round(elevVal(m)).toLocaleString() + ' ' + elevUnit();
const fmtT  = s => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}m`:`${m}m`; };
const fmtDt = d => new Date(d).toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short'});

const isRide = a => ['Ride','VirtualRide','EBikeRide','GravelRide','MountainBikeRide'].includes(a.type);
function isRun(a){ return a.type==='Run'||a.type==='VirtualRun'||a.type==='TrailRun'; }
function isWalk(a){ return a.type==='Walk'||a.type==='Hike'; }
function isSwim(a){ return a.type==='Swim'||a.type==='OpenWaterSwim'; }
function _swimPace(speed){ if(!speed) return '—'; const sec=Math.round(100/speed); return `${Math.floor(sec/60)}:${String(Math.round(sec%60)).padStart(2,'0')}`; }

// The story code calls tr()/trf() for labels; this app is English only.
const tr = s => s;
const trf = (s, ...v) => s.replace(/\{(\d+)\}/g, (_, i) => v[i] ?? '');
