// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBjA3tg9rsaAkp92fR235ss5t7RSkTPh5s",
  authDomain: "victory-little-angels.firebaseapp.com",
  projectId: "victory-little-angels",
  storageBucket: "victory-little-angels.firebasestorage.app",
  messagingSenderId: "575132420385",
  appId: "1:575132420385:web:77d17fe11fec0ab4eb9660",
  measurementId: "G-F2YTKJNM29"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("✅ Firebase connected");