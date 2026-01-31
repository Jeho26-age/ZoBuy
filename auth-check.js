// auth-check.js
firebase.auth().onAuthStateChanged(async (user) => {
    const path = window.location.pathname;
    const currentPage = path.split("/").pop();

    // 1. Redirect if not logged in
    if (!user) {
        if (currentPage === "store.html" || currentPage === "item.html") {
            window.location.href = "signin.html";
        }
        return; 
    }

    // 2. Skip checks for profile/auth pages to prevent redirect loops
    const isInternalAuthPage = ["account.html", "signin.html", "createaccount.html"].includes(currentPage);
    if (isInternalAuthPage) return;

    // 3. Protected Page Logic (Store & Items)
    if (currentPage === "store.html" || currentPage === "item.html") {
        try {
            // Get user data from Firestore
            const userDoc = await firebase.firestore().collection("user_data").doc(user.uid).get();
            
            // Check if user exists and has an active plan flag
            if (!userDoc.exists || !userDoc.data().hasPlan) {
                window.location.href = "gateway.html";
                return;
            }

            const userData = userDoc.data();
            const now = Date.now();
            const expiry = userData.planExpiry ? new Date(userData.planExpiry).getTime() : 0;

            // THE KILL SWITCH: If current time is past expiry
            if (now > expiry) {
                // IMPORTANT: Tell the database the plan is dead
                await firebase.firestore().collection("user_data").doc(user.uid).update({
                    hasPlan: false
                });
                
                // Redirect to renewal page
                window.location.href = "renew.html";
                return;
            }

        } catch (error) {
            console.error("Auth Guard Error:", error);
            // If there's a database error, play it safe and stay on page or redirect
        }
    }
});
