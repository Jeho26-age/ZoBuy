/**
 * ZoBuy Sorter Engine - V2 (Full Feature Integration)
 * Requirements: Search, Wishlist + Seller Tracking, Item-View Redirection.
 */

const db = firebase.firestore();
let allProducts = []; // Stores products for instant search

// --- 1. THE MAIN LISTENER ---
db.collection("products").orderBy("serialNumber", "desc").onSnapshot((snapshot) => {
    allProducts = []; // Reset local storage
    snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id; // Add Firebase ID for wishlist tracking
        allProducts.push(data);
    });
    renderHome(allProducts); // Initial Render
});

// --- 2. THE RENDER ENGINE ---
function renderHome(products) {
    const sections = {
        new: { grid: document.getElementById('new-grid'), container: document.getElementById('new-container') },
        discount: { grid: document.getElementById('discount-grid'), container: document.getElementById('discount-container') },
        trending: { grid: document.getElementById('trending-grid'), container: document.getElementById('trending-container') },
        best: { grid: document.getElementById('best-grid'), container: document.getElementById('best-container') },
        foryou: { grid: document.getElementById('foryou-grid'), container: document.getElementById('foryou-container') }
    };

    // Clear and Hide everything initially
    Object.values(sections).forEach(s => {
        if(s.grid) s.grid.innerHTML = '';
        if(s.container) s.container.classList.add('hidden-section');
    });

    const bannerBox = document.getElementById('promoBanner');
    if (bannerBox) bannerBox.innerHTML = '';

    products.forEach(p => {
        const cardHTML = buildCard(p);
        
        // FEATURED BANNER
        if (p.isFeatured && bannerBox) {
            renderBanner(p, bannerBox);
        }

        // NEW ARRIVAL (Always shows if products exist)
        if (sections.new.grid) {
            sections.new.grid.innerHTML += cardHTML;
            sections.new.container.classList.remove('hidden-section');
        }

        // DISCOUNT LOGIC
        if (p.oldPrice > p.price && sections.discount.grid) {
            sections.discount.grid.innerHTML += cardHTML;
            sections.discount.container.classList.remove('hidden-section');
        }

        // TRENDING & BEST SELL (Manual Tags)
        if (p.sectionTag === "trending" && sections.trending.grid) {
            sections.trending.grid.innerHTML += cardHTML;
            sections.trending.container.classList.remove('hidden-section');
        }
        if (p.sectionTag === "best" && sections.best.grid) {
            sections.best.grid.innerHTML += cardHTML;
            sections.best.container.classList.remove('hidden-section');
        }

        // FOR YOU (Category Interest)
        const interest = localStorage.getItem('userInterest');
        if (interest && p.categoryPath === interest && sections.foryou.grid) {
            sections.foryou.grid.innerHTML += cardHTML;
            sections.foryou.container.classList.remove('hidden-section');
        }
    });
}

// --- 3. #1: SEARCH BAR LOGIC ---
document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const banner = document.getElementById('banner-section');
    
    if (query.length > 0) {
        if(banner) banner.style.display = 'none'; // Hide banner during search
        const filtered = allProducts.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.brand.toLowerCase().includes(query)
        );
        renderHome(filtered);
    } else {
        if(banner) banner.style.display = 'block'; // Show banner when search cleared
        renderHome(allProducts);
    }
});

// --- 4. #2: WISHLIST (HEART) & #4: CLICK VIEW ---
function buildCard(p) {
    // Check if this item is already in user's wishlist (locally)
    const wishlist = JSON.parse(localStorage.getItem('myWishlist') || '[]');
    const isLiked = wishlist.includes(p.id) ? 'active' : '';

    return `
        <div class="product-card">
            <div class="product-image">
                ${p.oldPrice ? `<div class="discount-tag">OFF</div>` : ''}
                <div class="wishlist-btn ${isLiked}" onclick="toggleWishlist(event, '${p.id}')">
                    <i class="fa fa-heart"></i>
                </div>
                <img src="${p.imageURL}" onclick="viewProduct('${p.id}', '${p.categoryPath}')">
            </div>
            <div class="product-info" onclick="viewProduct('${p.id}', '${p.categoryPath}')">
                <div class="product-brand">${p.brand}</div>
                <div class="product-name">${p.name}</div>
                <div class="price-container">
                    ${p.oldPrice ? `<span class="old-price">₹${p.oldPrice}</span>` : ''}
                    <span class="new-price">₹${p.price}</span>
                </div>
            </div>
        </div>`;
}

// #2: Heart Toggle & Seller Data Tracking
function toggleWishlist(event, productId) {
    event.stopPropagation(); // Prevents clicking the whole card
    let wishlist = JSON.parse(localStorage.getItem('myWishlist') || '[]');
    const btn = event.currentTarget;

    if (!wishlist.includes(productId)) {
        // ADD TO WISHLIST
        wishlist.push(productId);
        btn.classList.add('active');
        // Update Seller Data in Firebase (+1 Heart)
        db.collection("products").doc(productId).update({
            wishlistCount: firebase.firestore.FieldValue.increment(1)
        });
    } else {
        // REMOVE FROM WISHLIST
        wishlist = wishlist.filter(id => id !== productId);
        btn.classList.remove('active');
        // Update Seller Data (-1 Heart)
        db.collection("products").doc(productId).update({
            wishlistCount: firebase.firestore.FieldValue.increment(-1)
        });
    }
    localStorage.setItem('myWishlist', JSON.stringify(wishlist));
}

// #4: View Product Redirection
function viewProduct(id, category) {
    localStorage.setItem('userInterest', category); // Save interest for "For You"
    window.location.href = `item-view.html?id=${id}`;
}

// Banner Helper
function renderBanner(p, container) {
    const slide = document.createElement('div');
    slide.className = 'banner';
    slide.onclick = () => viewProduct(p.id, p.categoryPath);
    slide.innerHTML = `
        <img src="${p.imageURL}">
        <div class="banner-overlay">
            <div class="promo-badge">FEATURED</div>
            <h2>${p.name}</h2>
            <p>Shop Now</p>
        </div>`;
    container.appendChild(slide);
}
