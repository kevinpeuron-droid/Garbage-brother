import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import crypto from "crypto";

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
    if (data.bins) {
      const seen = new Set();
      let changed = false;
      data.bins = data.bins.map(bin => {
        if (seen.has(bin.id)) {
          console.log("Fixing duplicate bin:", bin.id);
          bin.id = crypto.randomUUID();
          changed = true;
        }
        seen.add(bin.id);
        return bin;
      });
      if (changed) {
        await setDoc(docRef, { bins: data.bins }, { merge: true });
        console.log("Fixed duplicates");
      } else {
        console.log("No duplicates found");
      }
    }
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
