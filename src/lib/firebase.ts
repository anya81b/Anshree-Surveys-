import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAM_SQ9_Mo-sW-howtGGuGEEyn3ScHBNtk",
  authDomain: "anshree-surveys.firebaseapp.com",
  projectId: "anshree-surveys",
  storageBucket: "anshree-surveys.firebasestorage.app",
  messagingSenderId: "914152454749",
  appId: "1:914152454749:web:b8cb01a48dfbb30927ebb4",
  measurementId: "G-7MZT10L9RH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
