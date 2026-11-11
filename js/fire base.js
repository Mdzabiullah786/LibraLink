// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCc2ibzfCmuEtMlFW6HwwBmJUrguaNgwHo",
  authDomain: "libralink-dae66.firebaseapp.com",
  projectId: "libralink-dae66",
  storageBucket: "libralink-dae66.firebasestorage.app",
  messagingSenderId: "620578680070",
  appId: "1:620578680070:web:bb356f630feb2ba0340287",
  measurementId: "G-V03S1QR8GJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
export { db };