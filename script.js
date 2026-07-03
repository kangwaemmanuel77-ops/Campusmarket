// ==========================
// CAMPUS MARKET JS (FIXED + VERCEL SAFE)
// ==========================

const supabaseUrl = "https://pijtfjagtqtetcgsslpo.supabase.co";
const supabaseKey = "YOUR_ANON_KEY_HERE";

const client = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================
// ROUTING
// ==========================
const page = window.location.pathname.split("/").pop();

window.openItem = (id) => {
    window.location.href = "item.html?id=" + id;
};

// ==========================
// LOAD ITEMS (HOME)
// ==========================
async function loadItems() {
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
        grid.innerHTML += `
            <div class="card">
                <img src="${item.image_url}" alt="${item.title}">
                <h3>${item.title}</h3>
                <p>K${item.price}</p>
                <button onclick="openItem('${item.id}')">View</button>
            </div>
        `;
    });
}

// ==========================
// HOME SEARCH
// ==========================
if (page === "index.html" || page === "" || window.location.pathname === "/") {
    loadItems();

    const input = document.querySelector(".search-box input");
    const btn = document.querySelector(".search-box button");

    const go = () => {
        if (!input.value.trim()) return;
        window.location.href =
            "marketplace.html?search=" + encodeURIComponent(input.value.trim());
    };

    btn?.addEventListener("click", go);
    input?.addEventListener("keypress", e => {
        if (e.key === "Enter") go();
    });
}

// ==========================
// MARKETPLACE
// ==========================
if (page === "marketplace.html") {
    const grid = document.getElementById("marketGrid");
    const searchInput = document.getElementById("searchInput");
    const category = document.getElementById("categoryFilter");

    const url = new URLSearchParams(window.location.search);
    if (searchInput && url.get("search")) {
        searchInput.value = url.get("search");
    }

    async function loadMarket() {
        if (!grid) return;

        let q = client.from("items").select("*");

        if (category.value) q = q.eq("category", category.value);
        if (searchInput.value.trim())
            q = q.ilike("title", `%${searchInput.value.trim()}%`);

        const { data, error } = await q.order("created_at", { ascending: false });

        if (error) {
            grid.innerHTML = "<p>Error loading items</p>";
            return;
        }

        if (!data.length) {
            grid.innerHTML = "<p>No items found</p>";
            return;
        }

        grid.innerHTML = data.map(item => `
            <div class="card">
                <img src="${item.image_url}">
                <h3>${item.title}</h3>
                <p>K${item.price}</p>
                <button onclick="openItem('${item.id}')">View</button>
            </div>
        `).join("");
    }

    document.getElementById("searchBtn")?.addEventListener("click", loadMarket);
    searchInput?.addEventListener("keypress", e => e.key === "Enter" && loadMarket());
    category?.addEventListener("change", loadMarket);

    loadMarket();
}

// ==========================
// ITEM PAGE
// ==========================
if (page === "item.html") {
    const box = document.getElementById("itemBox");
    const id = new URLSearchParams(window.location.search).get("id");

    async function loadItem() {
        const { data, error } = await client
            .from("items")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            box.innerHTML = "<p>Item not found</p>";
            return;
        }

        const number = (data.contact_number || "").replace(/\s/g, "");

        box.innerHTML = `
            <img src="${data.image_url}" style="max-width:400px;width:100%">
            <h2>${data.title}</h2>
            <p><b>Price:</b> K${data.price}</p>
            <p><b>Category:</b> ${data.category}</p>
            <p>${data.description}</p>

            <a target="_blank"
               href="https://wa.me/${number}?text=Hi%20I'm%20interested%20in%20${encodeURIComponent(data.title)}"
               style="display:inline-block;margin-top:15px;padding:12px;background:#25D366;color:white;border-radius:8px;text-decoration:none;">
               WhatsApp Seller
            </a>
        `;
    }

    loadItem();
}

// ==========================
// SELL PAGE
// ==========================
if (page === "sell.html") {
    const form = document.getElementById("sellForm");
    const msg = document.getElementById("msg");

    let user = null;

    client.auth.getSession().then(({ data }) => {
        user = data.session?.user;
    });

    form?.addEventListener("submit", async e => {
        e.preventDefault();

        if (!user) {
            msg.innerText = "Login required";
            return;
        }

        const title = title.value;
        const price = price.value;
        const category = category.value;
        const description = description.value;
        const contact = contact.value;
        const file = image.files[0];

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

        await client.from("items").insert([
            {
                title,
                price,
                category,
                description,
                contact_number: contact,
                image_url: urlData.publicUrl,
                user_id: user.id
            }
        ]);

        msg.innerText = "Item posted!";
        form.reset();
    });
}

// ==========================
// PROFILE
// ==========================
if (page === "profile.html") {
    const grid = document.getElementById("myItemsGrid");

    client.auth.getSession().then(async ({ data }) => {
        const user = data.session?.user;
        if (!user) return (window.location = "login.html");

        const { data } = await client
            .from("items")
            .select("*")
            .eq("user_id", user.id);

        grid.innerHTML = data.map(item => `
            <div class="card">
                <img src="${item.image_url}">
                <h3>${item.title}</h3>
                <p>K${item.price}</p>
            </div>
        `).join("");
    });
}

// ==========================
// AUTH
// ==========================
window.signup = async () => {
    const email = email.value;
    const password = password.value;

    const { error } = await client.auth.signUp({ email, password });

    msg.innerText = error ? error.message : "Check your email!";
};

window.login = async () => {
    const { error } = await client.auth.signInWithPassword({
        email: email.value,
        password: password.value
    });

    if (error) return (msg.innerText = error.message);

    window.location = "profile.html";
};

window.logout = async () => {
    await client.auth.signOut();
    window.location = "index.html";
};
