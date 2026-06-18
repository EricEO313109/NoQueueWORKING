const url = process.argv[2] || process.env.APP_URL;
if (!url) {
  console.error('Usage: node scripts/verify-health.mjs https://your-app.vercel.app');
  process.exit(1);
}
const base = url.replace(/\/$/, '');
const res = await fetch(`${base}/api/health`);
const json = await res.json();
console.log(JSON.stringify(json, null, 2));
if (json.status !== 'ok') process.exit(1);
console.log('\n✓ Production health OK');
