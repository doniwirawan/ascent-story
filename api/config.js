// Public settings for the browser. The Strava client id is not a secret (it is
// part of the authorize URL); it lives in an env var so forks can use their own.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({ clientId: (process.env.STRAVA_CLIENT_ID || '').replace(/\s+/g, '') || null });
};
