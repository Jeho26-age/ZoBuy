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

    const isInternalAuthPage = ["account.html", "signin.html", "createaccount.html", "gateway.html", "store-setup.html"].includes(currentPage);
    if (isInternalAuthPage) return;

    if (currentPage === "store.html" || currentPage === "item.html") {
        try {
            const userDoc = await db.collection("user_data").doc(user.uid).get();
            
            if (!userDoc.exists) {
                window.location.href = "gateway.html";
                return;
            }

            const userData = userDoc.data();

            // 1. If plan is false, kick them out
            if (userData.hasPlan === false) {
                window.location.href = "gateway.html";
                return;
            }

            // 2. Plan Calculation & String Generation
            if (userData.planExpiry) {
                const now = new Date();
                const expiryDate = new Date(userData.planExpiry);
                const joinedDate = userData.joinedAt ? new Date(userData.joinedAt) : now;
                
                // Calculate total duration in days
                const diffTime = Math.abs(expiryDate - joinedDate);
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                // Determine what the name SHOULD be
                let targetName = "";
                if (diffDays !== 28) {
                    targetName = "Admin Plan (Testing)";
                } else {
                    // Use existing name (Bronze/Silver/Elite) or default to Pro
                    targetName = userData.planName || "Pro Seller Plan";
                }

                // SYNC STEP: If the string is missing in Firestore, write it now
                if (userData.planName !== targetName) {
                    await db.collection("user_data").doc(user.uid).update({
                        planName: targetName
                    });
                }

                // 3. Expiry Kill Switch
                if (now > expiryDate) {
                    await db.collection("user_data").doc(user.uid).update({
                        hasPlan: false,
                        planName: "Expired"
                    });
                    window.location.href = "gateway.html";
                    return;
                }

                // 4. Update UI if elements exist on the page
                const remainingDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                if (document.getElementById('planDisplay')) {
                    document.getElementById('planDisplay').innerText = targetName;
                }
                if (document.getElementById('daysLeft')) {
                    document.getElementById('daysLeft').innerText = remainingDays + " days left";
                }

            }

            // 5. Store Setup Check
            if (!userData.storeName || !userData.upiId) {
                window.location.href = "store-setup.html";
                return;
            }

        } catch (error) {
            console.error("Auth Guard Error:", error);
        }
    }
});
