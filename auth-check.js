// auth-check.js
var db = db || firebase.firestore(); 

firebase.auth().onAuthStateChanged(async (user) => {
    const path = window.location.pathname;
    const currentPage = path.split("/").pop();

    if (!user) {
        if (currentPage === "store.html" || currentPage === "item.html") {
            window.location.href = "signin.html";
        }
        return; 
    }

    const isInternalAuthPage = ["account.html", "signin.html", "createaccount.html", "gateway.html"].includes(currentPage);
    if (isInternalAuthPage) return;

    if (currentPage === "store.html" || currentPage === "item.html") {
        try {
            const userDoc = await db.collection("user_data").doc(user.uid).get();
            
            if (!userDoc.exists) {
                window.location.href = "gateway.html";
                return;
            }

            const userData = userDoc.data();

            // 1. If hasPlan is already false, stop here.
            if (userData.hasPlan === false) {
                window.location.href = "gateway.html";
                return;
            }

            // 2. Date Validation Logic
            const now = Date.now();
            
            // Safety: If there is no expiry date string at all
            if (!userData.planExpiry) {
                console.warn("No expiry date found. Plan remains active for now.");
                return; 
            }

            const expiryDate = new Date(userData.planExpiry);
            const expiryTime = expiryDate.getTime();

            // 3. The "Invalid Date" Protection
            // If the date format is wrong, DO NOT reset to false. Just log it.
            if (isNaN(expiryTime)) {
                console.error("Firebase planExpiry format is wrong! Update it to an ISO string.");
                return; 
            }

            // 4. THE KILL SWITCH
            // Only runs if the date is valid AND it is truly in the past.
            if (now > expiryTime) {
                console.log("Plan expired. Moving to false...");
                await db.collection("user_data").doc(user.uid).update({
                    hasPlan: false
                });
                window.location.href = "gateway.html";
            }

        } catch (error) {
            console.error("Auth Guard Error:", error);
        }
    }
});
