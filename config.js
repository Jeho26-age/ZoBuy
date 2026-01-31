// --- ZoBuy MASTER CONFIGURATION (Firestore Focus) ---
const firebaseConfig = {
    apiKey: "AIzaSyBSKCAAu4BRhYwOmDoStr7WtkV0YCcQlS8",
    authDomain: "zobuy-95fdb.firebaseapp.com",
    projectId: "zobuy-95fdb",
    storageBucket: "zobuy-95fdb.firebasestorage.app",
    messagingSenderId: "480926307536",
    appId: "1:480926307536:web:5489ed80f237aa49e43ad5"
    // databaseURL removed to avoid confusion with Firestore
};

const cloudinaryConfig = {
    cloudName: "duj2rx73z",
    uploadPreset: "zobuy_preset"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global variables for your other files to use
var db = firebase.firestore();
var auth = firebase.auth();

console.log("ZoBuy Backend: Firestore Connected.");
