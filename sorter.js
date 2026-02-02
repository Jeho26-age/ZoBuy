/**
 * ZoBuy Sorter Engine - V2 (Corrected Click Logic)
 */

let allProducts = []; 

// --- 1. THE MAIN LISTENER ---
db.collection("products").orderBy("serialNumber", "desc").onSnapshot((snapshot) => {
    allProducts = []; 
    snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id; 
        allProducts.push(data);
    });
    renderHome(allProducts); 
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

    Object.values(sections).forEach(s => {
        if(s.grid) s.grid.innerHTML = '';
        if(s.container) s.container.classList.add('hidden-section');
    });

    const bannerBox = document.getElementById('promoBanner');
    if (bannerBox) bannerBox.innerHTML = '';

    products.forEach(p => {
        const cardHTML = buildCard(p);
        
        if (p.isFeatured && bannerBox) {
            renderBanner(p, bannerBox);
        }

        if (sections.new.grid) {
            sections.new.grid.innerHTML += cardHTML;
            sections.new.container.classList.remove('hidden-section');
        }

        if (p.oldPrice > p.price && sections.discount.grid) {
            sections.discount.grid.innerHTML += cardHTML;
            sections.discount.container.classList.remove('hidden-section');
        }

        if (p.sectionTag === "trending" && sections.trending.grid) {
            sections.trending.grid.innerHTML += cardHTML;
            sections.trending.container.classList.remove('hidden-section');
        }
        if (p.sectionTag === "best" && sections.best.grid) {
            sections.best.grid.innerHTML += cardHTML;
            sections.best.container.classList.remove('hidden-section');
        }

        const interest = localStorage.getItem('userInterest');
        if (interest && p.categoryPath === interest && sections.foryou.grid) {
            sections.foryou.grid.innerHTML += cardHTML;
            sections.foryou.container.classList.remove('hidden-section');
        }
    });
}

// --- 3. SEARCH BAR LOGIC ---
document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const banner = document.getElementById('banner-section');
    
    if (query.length > 0) {
        if(banner) banner.style.display = 'none'; 
        const filtered = allProducts.filter(p => 
            p.name.toLowerCase().includes(query)
        );
        renderHome(filtered);
    } else {
        if(banner) banner.style.display = 'block'; 
        renderHome(allProducts);
    }
});

// --- 4. WISHLIST & CLICK VIEW ---
function buildCard(p) {
    const wishlist = JSON.parse(localStorage.getItem('myWishlist') || '[]');
    const isLiked = wishlist.includes(p.id) ? 'active' : '';

    let discountBadge = '';
    if (p.oldPrice && p.oldPrice > p.price) {
        const percent = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
        discountBadge = `<div class="discount-tag">${percent}% OFF</div>`;
    }

    // Escaping the category path to prevent single-quote errors
    const safeCategory = p.categoryPath ? p.categoryPath.replace(/'/g, "\\'") : '';

    return `
        <div class="product-card" onclick="viewProduct('${p.id}', '${safeCategory}')">
            <div class="product-image">
                ${discountBadge} 
                <div class="wishlist-btn ${isLiked}" onclick="toggleWishlist(event, '${p.id}')">
                    <i class="fa fa-heart"></i>
                </div>
                <img src="${p.imageURL}">
            </div>
            <div class="product-info">
                <div class="product-brand">${p.categoryPath}</div>
                <div class="product-name">${p.name}</div>
                <div class="price-container">
                    <span class="new-price">₹${p.price}</span>
                    ${p.oldPrice ? `<span class="old-price">₹${p.oldPrice}</span>` : ''}
                </div>
            </div>
        </div>`;
}

function toggleWishlist(event, productId) {
    event.stopPropagation(); 
    let wishlist = JSON.parse(localStorage.getItem('myWishlist') || '[]');
    const btn = event.currentTarget;

    if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        btn.classList.add('active');
        db.collection("products").doc(productId).update({
            wishlistCount: firebase.firestore.FieldValue.increment(1)
        });
    } else {
        wishlist = wishlist.filter(id => id !== productId);
        btn.classList.remove('active');
        db.collection("products").doc(productId).update({
            wishlistCount: firebase.firestore.FieldValue.increment(-1)
        });
    }
    localStorage.setItem('myWishlist', JSON.stringify(wishlist));
}

function viewProduct(id, category) {
    if (!id) return;
    localStorage.setItem('userInterest', category); 
    window.location.href = `item-view.html?id=${id}`;
}

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
