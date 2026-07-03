// ==========================
// CAMPUS MARKET JS (FULLY RIGGED)
// ==========================

const supabaseUrl = "https://pijtfjagtqtetcgsslpo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpanRmamFndHF0ZXRjZ3NzbHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5ODU2OTYsImV4cCI6MjA5ODU2MTY5Nn0.q4BsxoOZeC3OWl7hqvNiSlqmlYBiT5xty9tgcdbxbC0";

let client = null;

function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
        client = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("✅ Supabase initialized");
        startApp();
    } else {
        setTimeout(initSupabase, 50);
    }
}

initSupabase();

function startApp() {
    const pathSegments = window.location.pathname.split("/");
    const page = pathSegments[pathSegments.length - 1];

    window.openItem = function(id) {
        window.location.href = "item.html?id=" + id;
    };

    // ==========================
    // LOAD ITEMS (INDEX PAGE)
    // ==========================
    async function loadItems() {
        const grid = document.querySelector(".product-grid");
        if (!grid || !client) return;

        const { data, error } = await client
            .from("items")
            .select("*")
            .order('created_at', { ascending: false });

        if (error) return console.log(error.message);

        grid.innerHTML = "";

        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = "<img src='" + item.image_url + "' alt='" + item.title + "'>" +
                             "<h3>" + item.title + "</h3>" +
                             "<p>K" + item.price + "</p>" +
                             "<button onclick=\"openItem('" + item.id + "')\">View</button>";
            grid.appendChild(card);
        });
    }

    // HOMEPAGE ROUTING AND REDIRECT SYSTEM FOR SEARCH
    if (page === "index.html" || page === "" || window.location.pathname === "/") {
        loadItems();

        const homeSearchInput = document.querySelector(".search-box input");
        const homeSearchBtn = document.querySelector(".search-box button");

        function redirectSearch() {
            const val = homeSearchInput ? homeSearchInput.value.trim() : "";
            if (val !== "") {
                window.location.href = "marketplace.html?search=" + encodeURIComponent(val);
            }
        }

        homeSearchBtn?.addEventListener("click", redirectSearch);
        homeSearchInput?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") redirectSearch();
        });
    }

    // ==========================
    // MARKETPLACE SYSTEM (WITH HOMEPAGE URL LINKING)
    // ==========================
    if (page === "marketplace.html") {
        const marketGrid = document.getElementById("marketGrid");
        const searchInput = document.getElementById("searchInput");
        const categoryFilter = document.getElementById("categoryFilter");
        const searchBtn = document.getElementById("searchBtn");

        // Grab query parameters if coming from the homepage search box
        const urlParams = new URLSearchParams(window.location.search);
        const homeSearchQuery = urlParams.get("search");
        if (homeSearchQuery && searchInput) {
            searchInput.value = homeSearchQuery;
        }

        async function fetchFilteredMarketplace() {
            if (!marketGrid || !client) return;
            marketGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #888;'>Searching items...</p>";

            const searchVal = searchInput ? searchInput.value.trim() : "";
            const catVal = categoryFilter ? categoryFilter.value : "";

            let query = client.from("items").select("*").order('created_at', { ascending: false });

            if (catVal !== "") {
                query = query.eq("category", catVal);
            }

            if (searchVal !== "") {
                query = query.ilike("title", "%" + searchVal + "%");
            }

            const { data: filteredItems, error } = await query;

            if (error) {
                marketGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: red;'>Error: " + error.message + "</p>";
                return;
            }

            if (!filteredItems || filteredItems.length === 0) {
                marketGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #888;'>No matching campus items found.</p>";
                return;
            }

            marketGrid.innerHTML = "";

            filteredItems.forEach(item => {
                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = "<img src='" + item.image_url + "' alt='" + item.title + "'>" +
                                 "<h3>" + item.title + "</h3>" +
                                 "<p class='price'>K" + item.price + "</p>" +
                                 "<button onclick=\"openItem('" + item.id + "')\">View</button>";
                marketGrid.appendChild(card);
            });
        }

        categoryFilter?.addEventListener("change", fetchFilteredMarketplace);
        searchBtn?.addEventListener("click", fetchFilteredMarketplace);
        searchInput?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") fetchFilteredMarketplace();
        });

        fetchFilteredMarketplace();
    }

    // ==========================
    // ITEM DETAILS PAGE SYSTEM
    // ==========================
    async function loadItemPage() {
        const box = document.getElementById("itemBox");
        if (!box) return;

        const id = new URLSearchParams(window.location.search).get("id");
        if (!id) {
            box.innerHTML = "<p>Item not found</p>";
            return;
        }

        const { data, error } = await client
            .from("items")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            box.innerHTML = "<p>Could not load item</p>";
            return;
        }

        const cleanNumber = data.contact_number ? data.contact_number.replace(/\s+/g, '') : '';

        box.innerHTML = "<img src='" + data.image_url + "' style='width:100%;max-width:400px;' alt='" + data.title + "'>" +
                         "<h2>" + data.title + "</h2>" +
                         "<p><b>Price:</b> K" + data.price + "</p>" +
                         "<p><b>Category:</b> " + data.category + "</p>" +
                         "<p>" + data.description + "</p>" +
                         "<div style='margin-top: 25px;'>" +
                         "<a href='https://wa.me/" + cleanNumber + "?text=Hi,%20I''m%20interested%20in%20your%20listing%20''" + encodeURIComponent(data.title) + "''%20on%20Campus%20Market.' target='_blank' style='display: inline-flex; align-items: center; gap: 8px; background: #25D366; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-family: ''Poppins'', sans-serif;'>" +
                         "<i class='fa-brands fa-whatsapp' style='font-size: 1.2rem;'></i> Contact Seller via WhatsApp</a></div>";
    }

    if (page === "item.html") {
        loadItemPage();
    }

    // ==========================
    // SELL PAGE SYSTEM
    // ==========================
    if (page === "sell.html") {
        const msg = document.getElementById("msg");
        let currentUser = null;

        async function checkUserAuth() {
            const { data: { session }, error } = await client.auth.getSession();
            if (!session || error) {
                alert("🔒 You must be logged in to sell items on Campus Market!");
                window.location.href = "login.html"; 
                return null;
            }
            return session.user;
        }

        checkUserAuth().then(user => {
            currentUser = user;
        });

        const form = document.getElementById("sellForm");
        form?.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!currentUser) {
                msg.innerText = "❌ Session expired or user not authorized. Please log in again.";
                return;
            }

            msg.innerText = "⏳ Uploading photo and processing product details...";

            const title = document.getElementById("title").value;
            const price = document.getElementById("price").value;
            const category = document.getElementById("category").value;
            const description = document.getElementById("description").value;
            const contact_number = document.getElementById("contact").value;
            const file = document.getElementById("image").files[0];

            if (!file) {
                msg.innerText = "❌ Please select a product image.";
                return;
            }

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = Date.now() + "-" + Math.random().toString(36).substring(2, 7) + "." + fileExt;
                const filePath = "products/" + fileName;

                const { error: uploadError } = await client.storage
                    .from("item-images")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = client.storage
                    .from("item-images")
                    .getPublicUrl(filePath);

                const { error: dbError } = await client.from("items").insert([
                    { 
                        title, 
                        price, 
                        category, 
                        image_url: urlData.publicUrl, 
                        description,
                        user_id: currentUser.id,
                        contact_number
                    }
                ]);

                if (dbError) throw dbError;
                msg.innerText = "✅ Item posted successfully!";
                form.reset();
            } catch (error) {
                console.error(error);
                msg.innerText = "❌ Error: " + error.message;
            }
        });
    }

    // ==========================
    // PROFILE PAGE SYSTEM
    // ==========================
    if (page === "profile.html") {
        const emailText = document.getElementById("userEmail");
        const grid = document.getElementById("myItemsGrid");
        const profileMsg = document.getElementById("profileMsg");
        const avatarInput = document.getElementById("avatarInput");
        const profileDisplayImg = document.getElementById("profileDisplayImg");
        const defaultAvatarIcon = document.getElementById("defaultAvatarIcon");

        async function loadProfileData() {
            const { data: { session } } = await client.auth.getSession();
            if (!session) {
                alert("🔒 Access Denied. Please log in first.");
                window.location.href = "login.html";
                return;
            }

            if (emailText) emailText.innerText = session.user.email;
            
            const savedAvatar = localStorage.getItem("avatar_" + session.user.id);
            if (savedAvatar && profileDisplayImg) {
                profileDisplayImg.src = savedAvatar;
                profileDisplayImg.style.display = "block";
                if (defaultAvatarIcon) defaultAvatarIcon.style.display = "none";
            }

            avatarInput?.addEventListener("change", async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (profileMsg) profileMsg.innerText = "⏳ Uploading avatar picture...";

                try {
                    const fileExt = file.name.split('.').pop();
                    const filePath = "avatars/" + session.user.id + "." + fileExt;

                    const { error: uploadError } = await client.storage
                        .from("item-images")
                        .upload(filePath, file, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: urlData } = client.storage
                        .from("item-images")
                        .getPublicUrl(filePath);

                    localStorage.setItem("avatar_" + session.user.id, urlData.publicUrl);

                    if (profileDisplayImg) {
                        profileDisplayImg.src = urlData.publicUrl;
                        profileDisplayImg.style.display = "block";
                    }
                    if (defaultAvatarIcon) defaultAvatarIcon.style.display = "none";
                    if (profileMsg) profileMsg.innerText = "✅ Profile photo updated!";
                } catch (err) {
                    console.error(err);
                    if (profileMsg) profileMsg.innerText = "❌ Photo upload failed: " + err.message;
                }
            });

            if (!grid) return;

            const { data: items, error } = await client
                .from("items")
                .select("*")
                .eq("user_id", session.user.id);

            if (error) return console.error(error.message);

            if (!items || items.length === 0) {
                grid.innerHTML = "<p style='grid-column: 1/-1; color:#888;'>You haven't listed any items for sale yet.</p>";
                return;
            }

            grid.innerHTML = "";
            items.forEach(item => {
                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = "<img src='" + item.image_url + "' alt='" + item.title + "'>" +
                                 "<h3>" + item.title + "</h3>" +
                                 "<p>K" + item.price + "</p>" +
                                 "<div style='display: flex; gap: 5px; margin-top: 10px;'>" +
                                 "<button onclick=\"openItem('" + item.id + "')\" style='flex: 1;'>View</button>" +
                                 "<button onclick=\"deleteItem('" + item.id + "')\" style='background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;'>" +
                                 "<i class='fa-solid fa-trash'></i></button></div>";
                grid.appendChild(card);
            });
        }

        window.deleteItem = async function(id) {
            if (!confirm("Are you sure you want to remove this listing?")) return;
            if (profileMsg) profileMsg.innerText = "⏳ Deleting item...";
            
            const { error } = await client.from("items").delete().eq("id", id);
            if (error) {
                if (profileMsg) profileMsg.innerText = "❌ Error: " + error.message;
            } else {
                if (profileMsg) profileMsg.innerText = "✅ Listing removed!";
                loadProfileData();
            }
        };

        loadProfileData();
    }

    // ==========================
    // AUTH SYSTEM
    // ==========================
    window.signup = async function () {
        const msgElement = document.getElementById("msg");
        if (!msgElement) return;

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        msgElement.style.color = "var(--text-primary)";
        msgElement.innerText = "⏳ Creating your student account...";

        const { data, error: signUpErr } = await client.auth.signUp({ email, password });

        if (signUpErr) {
            msgElement.style.color = "var(--text-danger)";
            msgElement.innerText = "❌ " + signUpErr.message;
            return;
        }

        if (data.user && data.session === null) {
            msgElement.style.color = "var(--accent-emerald)";
            msgElement.innerText = "✅ Account created! Check your inbox to verify, then log in.";
        } else {
            msgElement.style.color = "var(--accent-emerald)";
            msgElement.innerText = "✅ Account created successfully! Logging you in...";
            setTimeout(() => { window.location.href = "index.html"; }, 2000);
        }
    };

    window.login = async function () {
        const msgElement = document.getElementById("msg");
        if (!msgElement) return;

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        msgElement.style.color = "var(--text-primary)";
        msgElement.innerText = "⏳ Verifying credentials...";

        const { error } = await client.auth.signInWithPassword({ email, password });

        if (error) {
            msgElement.style.color = "var(--text-danger)";
            msgElement.innerText = "❌ " + error.message;
            return;
        }

        msgElement.style.color = "var(--accent-emerald)";
        msgElement.innerText = "✅ Success! Redirecting to campus dashboard...";
        setTimeout(() => { window.location.href = "profile.html"; }, 1500);
    };

    window.logout = async function () {
        const { error } = await client.auth.signOut();
        if (error) {
            alert("Error logging out: " + error.message);
        } else {
            alert("👋 Logged out successfully!");
            window.location.href = "index.html";
        }
    };
}

