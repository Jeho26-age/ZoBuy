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
    const isInternalAuthPage = ["account.html", "signin.html", "createaccount.html", "gateway.html"].includes(currentPage);
    if (isInternalAuthPage) return;

    // 3. Protected Page Logic (Store & Items)
    if (currentPage === "store.html" || currentPage === "item.html") {
        try {
            // Get user data from Firestore
            const userDoc = await firebase.firestore().collection("user_data").doc(user.uid).get();
            
            if (!userDoc.exists) {
                window.location.href = "gateway.html";
                return;
            }

            const userData = userDoc.data();

            // If hasPlan is already false, go to gateway
            if (!userData.hasPlan) {
                window.location.href = "gateway.html";
                return;
            }

            // DATE VALIDATION
            const now = Date.now();
            const expiryDate = new Date(userData.planExpiry);
            const expiryTime = expiryDate.getTime();

            // Check if the date is valid (Not NaN)
            if (isNaN(expiryTime)) {
                console.error("Invalid Date in Firebase! Please check planExpiry format.");
                return; // Stop here so we don't accidentally kill the plan
            }

            // THE KILL SWITCH: Only triggers if we are CERTAIN time is up
            if (now > expiryTime) {
                console.log("Plan expired. Updating database...");
                await firebase.firestore().collection("user_data").doc(user.uid).update({
                    hasPlan: false
                });
                
                // Redirect to renewal page (or gateway if you don't have renew.html)
                window.location.href = "gateway.html"; 
                return;
            }

            console.log("Plan is active. Expires at:", expiryDate.toLocaleString());

        } catch (error) {
            console.error("Auth Guard Error:", error);
        }
    }
});
