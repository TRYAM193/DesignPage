// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDX21jlh5Bpqe1_RUzo9Uoj585l-T07Tfg",
  authDomain: "tryam-5bff4.firebaseapp.com",
  projectId: "tryam-5bff4",
  databaseURL: "https://tryam-5bff4-default-rtdb.firebaseio.com/",
  storageBucket: "tryam-5bff4.firebasestorage.app",
  messagingSenderId: "786672387224",
  appId: "1:786672387224:web:7333b8011f9d9e831efced",
  measurementId: "G-VR1FW6LD6Y"
};

const app = initializeApp(firebaseConfig);

export const firestore = getFirestore(app);
