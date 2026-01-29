// --- ZoBuy MASTER CONFIGURATION ---
// This file connects your GitHub site to Firebase and Cloudinary.

const firebaseConfig = {
    apiKey: "AIzaSyBSKCAAu4BRhYwOmDoStr7WtkV0YCcQlS8",
    authDomain: "zobuy-95fdb.firebaseapp.com",
    projectId: "zobuy-95fdb",
    storageBucket: "zobuy-95fdb.firebasestorage.app",
    messagingSenderId: "480926307536",
    appId: "1:480926307536:web:5489ed80f237aa49e43ad5",
    databaseURL: "https://zobuy-95fdb-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const cloudinaryConfig = {
    cloudName: "duj2rx73z",
    uploadPreset: "zobuy_preset"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global variables for use in other scripts
const db = firebase.firestore();
const rtdb = firebase.database();
const auth = firebase.auth();

console.log("ZoBuy Backend: Successfully Connected.");
