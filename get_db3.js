import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const app = initializeApp({
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  measurementId: config.measurementId
});
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const docRef = doc(db, "maps", "clean_v1");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    const ids = data.bins.map(b => b.id);
    const counts = {};
    ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    for (const id in counts) {
      if (counts[id] > 1) {
        console.log("duplicate bin id:", id, counts[id]);
      }
    }
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
