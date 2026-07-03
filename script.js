// ==========================
// CAMPUS MARKET JS (FIXED + STABLE)
// ==========================

const supabaseUrl = "https://pijtfjagtqtetcgsslpo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpanRmamFndHF0ZXRjZ3NzbHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5ODU2OTYsImV4cCI6MjA5ODU2MTY5Nn0.q4BsxoOZeC3OWl7hqvNiSlqmlYBiT5xty9tgcdbxbC0";

let client = null;

// Wait until Supabase library is ready
function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
        client = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("✅ Supabase ready");
        startApp();
    } else {
        setTimeout(initSupabase, 50);
    }
}

initSupabase();

function getPage() {
    const path = window.location.pathname.split("/").pop();
    return path || "index.html";
}

function startApp() {
    const page = getPage();

    // ==========================
    // GLOBAL NAV FUNCTION
    // ==========================
    window.openItem = function (id) {
        window.location.href = "item.html?id=" + id;
    };

    // ==========================
    // LOAD HOME ITEMS
    // ==========================
    async function loadHomeItems() {
        const grid = document.querySelector(".product-grid");
        if (!grid) return;

        const { data, error } = await client
            .from("items")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error.message);
            return;
        }

        grid.innerHTML = "";

        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <img src="${item.image_url}">
                <h3>${item.title}</h3>
                <p>K${item.price}</p>
                <button onclick="openItem('${item.id}')">View</button>
            `;
            grid.appendChild(card);
        });
    }

    // ==========================
    // INDEX PAGE
    // ==========================
    if (page === "index.html" || page === "") {
        loadHomeItems();

        const input = document.querySelector(".search-box input");
        const btn = document.querySelector(".search-box button");

        function goSearch() {
            if (!input) return;
            const val = input.value.trim();
            if (val) {
                window.location.href = "marketplace.html?search=" + encodeURIComponent(val);
            }
        }

        btn?.addEventListener("click", goSearch);
        input?.addEventListener("keypress", e => {
            if (e.key === "Enter") goSearch();
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

        const params = new URLSearchParams(window.location.search);
        if (searchInput) {
            searchInput.value = params.get("search") || "";
        }

        async function loadMarket() {
            if (!grid) return;

            grid.innerHTML = "Loading...";

            let query = client.from("items").select("*").order("created_at", { ascending: false });

            if (category?.value) {
                query = query.eq("category", category.value);
            }

            if (searchInput?.value) {
                query = query.ilike("title", `%${searchInput.value}%`);
            }

            const { data, error } = await query;

            if (error) {
                grid.innerHTML = "Error loading items";
                return;
            }

            if (!data.length) {
                grid.innerHTML = "No items found";
                return;
            }

            grid.innerHTML = "";

            data.forEach(item => {
                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = `
                    <img src="${item.image_url}">
                    <h3>${item.title}</h3>
                    <p>K${item.price}</p>
                    <button onclick="openItem('${item.id}')">View</button>
                `;
                grid.appendChild(card);
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
            if (!id) return;

            const { data, error } = await client
                .from("items")
                .select("*")
                .eq("id", id)
                .single();

            if (error || !data) {
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
    // SELL PAGE (FIXED AUTH FLOW)
    // ==========================
    if (page === "sell.html") {
        const form = document.getElementById("sellForm");
        const msg = document.getElementById("msg");

        let user = null;

        async function getUser() {
            const { data } = await client.auth.getSession();
            return data.session?.user || null;
        }

        (async () => {
            user = await getUser();
            if (!user) {
                alert("Login required");
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

            const { error: uploadError } = await client.storage
                .from("item-images")
                .upload("products/" + fileName, file);

            if (uploadError) {
                msg.innerText = uploadError.message;
                return;
            }

            const { data: urlData } = client.storage
                .from("item-images")
                .getPublicUrl("products/" + fileName);

            const { error } = await client.from("items").insert({
                title,
                price,
                category,
                description,
                contact_number: contact,
                image_url: urlData.publicUrl,
                user_id: user.id
            });

            if (error) {
                msg.innerText = error.message;
            } else {
                msg.innerText = "Posted successfully!";
                form.reset();
            }
        });
    }

    // ==========================
    // AUTH (FIXED)
    // ==========================
    window.signup = async function () {
        const msg = document.getElementById("msg");

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        msg.innerText = "Creating account...";

        const { error } = await client.auth.signUp({ email, password });

        if (error) {
            msg.innerText = error.message;
        } else {
            msg.innerText = "Account created! Check email or login.";
        }
    };

    window.login = async function () {
        const msg = document.getElementById("msg");

        const email = document.getElementById("email").value.trim();
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
