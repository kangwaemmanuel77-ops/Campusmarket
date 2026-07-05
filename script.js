// ==========================
// CAMPUS MARKET JS (CLEAN FIX)
// ==========================

const supabaseUrl = "https://pijtfjagtqtetcgsslpo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpanRmamFndHF0ZXRjZ3NzbHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5ODU2OTYsImV4cCI6MjA5ODU2MTY5Nn0.q4BsxoOZeC3OWl7hqvNiSlqmlYBiT5xty9tgcdbxbC0";

let client = null;

// ==========================
// INIT SUPABASE SAFELY
// ==========================
function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
        client = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("✅ Supabase Ready");
        startApp();
    } else {
        setTimeout(initSupabase, 50);
    }
}

initSupabase();

// ==========================
// GET PAGE NAME
// ==========================
function getPage() {
    const path = window.location.pathname.split("/").pop();
    return path || "index.html";
}

// ==========================
// SAFE SESSION CHECK (IMPORTANT FIX)
// ==========================
async function getUserSafe() {
    const { data, error } = await client.auth.getSession();
    if (error) return null;
    return data.session?.user || null;
}

// ==========================
// START APP
// ==========================
function startApp() {
    const page = getPage();

            // ==========================
    // PROFILE PAGE PROCESSING
    // ==========================
    if (page === "profile.html") {
        const myItemsGrid = document.getElementById("myItemsGrid");
        const savedGrid = document.getElementById("savedGrid");
        const userEmailHeader = document.getElementById("userEmail");
        const listingsCount = document.getElementById("listingsCount"); // Clean direct selector

        async function loadProfileData() {
            try {
                const user = await getUserSafe();
                if (!user) {
                    alert("Please log in to see your profile.");
                    window.location.href = "login.html";
                    return;
                }

                // Show email
                if (userEmailHeader) userEmailHeader.innerText = user.email;

                // 1. FETCH USER'S OWN LISTINGS
                const { data: myItems, error: myItemsError } = await client
                    .from("items")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (myItemsError) throw myItemsError;

                // Live update the posted listings count!
                if (listingsCount) {
                    listingsCount.innerText = myItems ? myItems.length : "0";
                }

                // Render user's items
                if (myItemsGrid) {
                    myItemsGrid.innerHTML = "";
                    if (!myItems || myItems.length === 0) {
                        myItemsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">You haven't listed any items for sale yet.</p>`;
                    } else {
                        myItems.forEach(item => {
                            myItemsGrid.innerHTML += `
                                <div class="card">
                                    <img src="${item.image_url || ''}" alt="${item.title}">
                                    <h3>${item.title || 'Untitled'}</h3>
                                    <p>K${item.price || '0'}</p>
                                    <div class="card-buttons">
                                        <button onclick="openItem('${item.id}')">View</button>
                                    </div>
                                </div>
                            `;
                        });
                    }
                }

                // 2. FETCH SAVED ITEMS 
                if (savedGrid) {
                    const { data: favData, error: favError } = await client
                        .from("favorites")
                        .select("item_id")
                        .eq("user_id", user.id);

                    if (favError) throw favError;

                    if (!favData || favData.length === 0) {
                        savedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">You haven't saved any items yet. 🤍</p>`;
                        return;
                    }

                    const itemIds = favData.map(fav => fav.item_id);

                    const { data: savedItems, error: savedItemsError } = await client
                        .from("items")
                        .select("*")
                        .in("id", itemIds);

                    if (savedItemsError) throw savedItemsError;

                    savedGrid.innerHTML = "";
                    if (!savedItems || savedItems.length === 0) {
                        savedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">Saved items are no longer available.</p>`;
                    } else {
                        for (const item of savedItems) {
                            savedGrid.innerHTML += `
                                <div class="card">
                                    <img src="${item.image_url || ''}" alt="${item.title}">
                                    <h3>${item.title || 'Untitled'}</h3>
                                    <p>K${item.price || '0'}</p>
                                    <div class="card-buttons">
                                        <button onclick="openItem('${item.id}')">View</button>
                                        <button class="favorite-btn" onclick="toggleFavorite('${item.id}')">
                                            ❤️ Saved
                                        </button>
                                    </div>
                                </div>
                            `;
                        }
                    }
                }

            } catch (err) {
                console.error("Error setting up profile components:", err);
            }
        }

        loadProfileData();
    }



    // ==========================
    // FAVORITES SYSTEM
    // ==========================
    window.toggleFavorite = async function(itemId) {
        try {
            const { data: { session } } = await client.auth.getSession();

            if (!session) {
                alert("Please log in to save favorites.");
                return;
            }

            const userId = session.user.id;

            const { data: existing } = await client
                .from("favorites")
                .select("id")
                .eq("user_id", userId)
                .eq("item_id", itemId)
                .maybeSingle();

            if (existing) {
                await client
                    .from("favorites")
                    .delete()
                    .eq("id", existing.id);

                alert("💔 Removed from favorites");
            } else {
                await client
                    .from("favorites")
                    .insert({
                        user_id: userId,
                        item_id: itemId
                    });

                alert("❤️ Added to favorites");
            }

            location.reload();
        } catch (err) {
            console.error("Error toggling favorite:", err);
        }
    };

    async function isFavorite(itemId) {
        try {
            const { data: { session } } = await client.auth.getSession();
            if (!session) return false;

            const { data } = await client
                .from("favorites")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("item_id", itemId)
                .maybeSingle();

            return !!data;
        } catch (err) {
            console.error("Error checking favorite status:", err);
            return false; // Fail silently so items still load
        }
    }

    // ==========================
    // GLOBAL FUNCTION
    // ==========================
    window.openItem = (id) => {
        window.location.href = "item.html?id=" + id;
    };

    // ==========================
    // HOME PAGE (NO AUTH CHECK HERE!)
    // ==========================
    if (page === "index.html" || page === "") {
        loadHomeItems();

        const input = document.querySelector(".search-box input");
        const btn = document.querySelector(".search-box button");

        function goSearch() {
            const val = input?.value.trim();
            if (val) {
                window.location.href =
                    "marketplace.html?search=" + encodeURIComponent(val);
            }
        }

        btn?.addEventListener("click", goSearch);
        input?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") goSearch();
        });
    }

    // ==========================
    // LOAD HOME ITEMS
    // ==========================
    async function loadHomeItems() {
        const grid = document.querySelector(".product-grid");
        if (!grid) return;

        try {
            const { data, error } = await client
                .from("items")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (!data) return;

            grid.innerHTML = "";

            for (const item of data) {
                // If item ID is missing or bad, skip it cleanly instead of crashing everything
                if (!item.id) continue; 
                
                const saved = await isFavorite(item.id);

                grid.innerHTML += `
                    <div class="card">
                        <img src="${item.image_url || ''}" alt="${item.title || 'Item'}">
                        <h3>${item.title || 'No Title'}</h3>
                        <p>K${item.price || '0'}</p>
                        <div class="card-buttons">
                            <button onclick="openItem('${item.id}')">View</button>
                            <button class="favorite-btn" onclick="toggleFavorite('${item.id}')">
                                ${saved ? "❤️ Saved" : "🤍 Save"}
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error("Error loading home items:", err);
        }
    }

    // ==========================
    // MARKETPLACE PAGE
    // ==========================
    if (page === "marketplace.html") {
        const grid = document.getElementById("marketGrid");
        const searchInput = document.getElementById("searchInput");
        const category = document.getElementById("categoryFilter");
        const searchBtn = document.getElementById("searchBtn");

        async function loadMarket() {
            if (!grid) return;

            try {
                let query = client.from("items").select("*");

                if (category?.value) {
                    query = query.eq("category", category.value);
                }

                if (searchInput?.value) {
                    query = query.ilike("title", `%${searchInput.value}%`);
                }

                const { data, error } = await query;

                if (error) throw error;
                if (!data) return;

                grid.innerHTML = "";

                for (const item of data) {
                    if (!item.id) continue;

                    const saved = await isFavorite(item.id);

                    grid.innerHTML += `
                        <div class="card">
                            <img src="${item.image_url || ''}" alt="${item.title || 'Item'}">
                            <h3>${item.title || 'No Title'}</h3>
                            <p>K${item.price || '0'}</p>
                            <div class="card-buttons">
                                <button onclick="openItem('${item.id}')">View</button>
                                <button class="favorite-btn" onclick="toggleFavorite('${item.id}')">
                                    ${saved ? "❤️ Saved" : "🤍 Save"}
                                </button>
                            </div>
                        </div>
                    `;
                }
            } catch (err) {
                console.error("Error loading marketplace items:", err);
            }
        }

        searchBtn?.addEventListener("click", loadMarket);
        category?.addEventListener("change", loadMarket);
        searchInput?.addEventListener("keypress", e => {
            if (e.key === "Enter") loadMarket();
        });

        loadMarket();
    }

    // ==========================
    // ITEM PAGE
    // ==========================
    if (page === "item.html") {
        const box = document.getElementById("itemBox");

        async function loadItem() {
            if (!box) return;

            try {
                const id = new URLSearchParams(window.location.search).get("id");
                if (!id) {
                    box.innerHTML = "No item selected.";
                    return;
                }

                const { data, error } = await client
                    .from("items")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error || !data) {
                    box.innerHTML = "Item not found";
                    return;
                }

                const saved = await isFavorite(data.id);

                box.innerHTML = `
                    <img src="${data.image_url || ''}" style="max-width:100%">
                    <h2>${data.title || 'No Title'}</h2>
                    <p><strong>K${data.price || '0'}</strong></p>
                    <p>${data.description || 'No description provided.'}</p>
                    <button class="favorite-btn" onclick="toggleFavorite('${data.id}')">
                        ${saved ? "❤️ Saved" : "🤍 Save"}
                    </button>
                    <br><br>
                    <a target="_blank"
                       href="https://wa.me/${data.contact_number || ''}?text=Hi I'm interested in ${encodeURIComponent(data.title || 'this item')}"
                       style="background:#25D366;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;">
                       Contact Seller
                    </a>
                `;
            } catch (err) {
                console.error("Error loading single item page:", err);
            }
        }

        loadItem();
    }

    // ==========================
    // SELL PAGE (PROTECTED ONLY HERE)
    // ==========================
    if (page === "sell.html") {
        const form = document.getElementById("sellForm");
        const msg = document.getElementById("msg");

        let user = null;

        (async () => {
            user = await getUserSafe();

            if (!user) {
                alert("Login required to sell items");
                window.location.href = "login.html";
            }
        })();

        form?.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!user) return;

            if (msg) msg.innerText = "Uploading...";

            try {
                const file = document.getElementById("image").files[0];
                const title = document.getElementById("title").value;
                const price = document.getElementById("price").value;
                const category = document.getElementById("category").value;
                const description = document.getElementById("description").value;
                const contact = document.getElementById("contact").value;

                if (!file) {
                    if (msg) msg.innerText = "Please select an image.";
                    return;
                }

                const fileName = Date.now() + file.name;

                await client.storage
                    .from("item-images")
                    .upload("products/" + fileName, file);

                const { data: urlData } = client.storage
                    .from("item-images")
                    .getPublicUrl("products/" + fileName);

                await client.from("items").insert({
                    title,
                    price,
                    category,
                    description,
                    contact_number: contact,
                    image_url: urlData.publicUrl,
                    user_id: user.id
                });

                if (msg) msg.innerText = "Item posted successfully!";
                form.reset();
            } catch (err) {
                console.error("Upload error:", err);
                if (msg) msg.innerText = "Failed to post item.";
            }
        });
    }

    // ==========================
    // AUTH (UNCHANGED BUT STABLE)
    // ==========================
    window.signup = async function () {
        const msg = document.getElementById("msg");
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const { error } = await client.auth.signUp({ email, password });
        if (msg) msg.innerText = error ? error.message : "Account created! Check email.";
    };

    window.login = async function () {
        const msg = document.getElementById("msg");
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const { error } = await client.auth.signInWithPassword({ email, password });

        if (error) {
            if (msg) msg.innerText = error.message;
        } else {
            window.location.href = "profile.html";
        }
    };

    window.logout = async function () {
        await client.auth.signOut();
        window.location.href = "index.html";
    };
}

