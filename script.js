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
// FAVORITES SYSTEM
// ==========================

window.toggleFavorite = async function(itemId) {
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
};

async function isFavorite(itemId) {
    const { data: { session } } = await client.auth.getSession();

    if (!session) return false;

    const { data } = await client
        .from("favorites")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("item_id", itemId)
        .maybeSingle();

    return !!data;
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

        const { data } = await client
            .from("items")
            .select("*")
            .order("created_at", { ascending: false });

        grid.innerHTML = "";

        data.forEach(item => {
            grid.innerHTML += `
                <div class="card">
                    <img src="${item.image_url}">
                    <h3>${item.title}</h3>
                    <p>K${item.price}</p>
                    <button onclick="openItem('${item.id}')">View</button>
                </div>
            `;
        });
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
            let query = client.from("items").select("*");

            if (category?.value) {
                query = query.eq("category", category.value);
            }

            if (searchInput?.value) {
                query = query.ilike("title", `%${searchInput.value}%`);
            }

            const { data } = await query;

            grid.innerHTML = "";

            data.forEach(item => {
                grid.innerHTML += `
                    <div class="card">
                        <img src="${item.image_url}">
                        <h3>${item.title}</h3>
                        <p>K${item.price}</p>
                        <button onclick="openItem('${item.id}')">View</button>
                    </div>
                `;
            });
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
            const id = new URLSearchParams(window.location.search).get("id");

            const { data } = await client
                .from("items")
                .select("*")
                .eq("id", id)
                .single();

            if (!data) {
                box.innerHTML = "Item not found";
                return;
            }

            box.innerHTML = `
                <img src="${data.image_url}" style="max-width:100%">
                <h2>${data.title}</h2>
                <p>K${data.price}</p>
                <p>${data.description}</p>
                <a target="_blank"
                   href="https://wa.me/${data.contact_number}?text=Hi I'm interested in ${encodeURIComponent(data.title)}"
                   style="background:#25D366;color:white;padding:10px;display:inline-block;border-radius:6px;">
                   Contact Seller
                </a>
            `;
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

            msg.innerText = "Uploading...";

            const file = document.getElementById("image").files[0];
            const title = document.getElementById("title").value;
            const price = document.getElementById("price").value;
            const category = document.getElementById("category").value;
            const description = document.getElementById("description").value;
            const contact = document.getElementById("contact").value;

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

            msg.innerText = "Item posted successfully!";
            form.reset();
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

        msg.innerText = error ? error.message : "Account created! Check email.";
    };

    window.login = async function () {
        const msg = document.getElementById("msg");

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const { error } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            msg.innerText = error.message;
        } else {
            window.location.href = "profile.html";
        }
    };

    window.logout = async function () {
        await client.auth.signOut();
        window.location.href = "index.html";
    };
}
