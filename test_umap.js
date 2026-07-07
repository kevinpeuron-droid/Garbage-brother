const https = require('https');
https.get("https://umap.vieillescharrues.bzh/fr/map/recap-container_20?datalayers=none", (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.length > 0 ? "Got response" : "Empty"));
}).on('error', err => console.log(err));
