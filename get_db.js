import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import config from "./firebase-applet-config.json" assert { type: "json" };

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
      const ids = data.bins.map(b => b.id);
      console.log("total bins:", ids.length);
      const unique = new Set(ids);
      console.log("unique bins:", unique.size);
      
      const counts = {};
      ids.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
      for (const id in counts) {
        if (counts[id] > 1) {
          console.log("duplicate:", id, "count:", counts[id]);
        }
      }
    }
  }
}
run().catch(console.error);
