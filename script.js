// ==========================
// CAMPUS MARKET JS (FIXED)
// ==========================

// --------------------------
// SUPABASE CONNECTION
// --------------------------

const supabaseUrl = "https://pijtfjagtqtetcgsslpo.supabase.co";
const supabaseKey = "YOUR_ANON_KEY"; // keep your real key here

let client = null;

if (window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase client connected");
} else {
    console.log("❌ Supabase library not loaded");
}

// Detect page safely
const page = window.location.pathname;

// ==========================
// LOAD ITEMS (HOME PAGE)
// ==========================

async function loadItems() {

    const grid = document.querySelector(".product-grid");
    if (!grid || !client) return;

    console.log("🔄 Loading items...");

    const { data, error } = await client
        .from("items")
        .select("*");

    if (error) {
        console.log("❌ Supabase Error:", error.message);
        return;
    }

    grid.innerHTML = "";

    if (!data || data.length === 0) {
        console.log("⚠️ No items found");
        return;
    }

    data.forEach(item => {

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img src="${item.image_url || 'https://picsum.photos/300/200'}">
            <h3>${item.title}</h3>
            <p class="price">K${item.price}</p>
            <p class="location">${item.category || ''}</p>
            <button onclick="openItem('${item.id}')">View</button>
        `;

        grid.appendChild(card);
    });

    console.log("✅ Items loaded");
}

// Run ONLY on homepage
if (page.includes("index.html") || page === "/" || page === "") {
    loadItems();
}

// ==========================
// OPEN ITEM PAGE
// ==========================

function openItem(id) {
    window.location.href = `item.html?id=${id}`;
}

// ==========================
// ITEM PAGE LOADER
// ==========================

async function loadItemPage() {

    const box = document.getElementById("itemBox");
    if (!box || !client) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        box.innerHTML = "<p>Item not found</p>";
        return;
    }

    const { data, error } = await client
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        box.innerHTML = "<p>Error loading item</p>";
        return;
    }

    box.innerHTML = `
        <img src="${data.image_url}" style="width:100%;max-width:400px;">
        <h2>${data.title}</h2>
        <p><b>Price:</b> K${data.price}</p>
        <p><b>Category:</b> ${data.category}</p>
        <p>${data.description}</p>
    `;
}

// Run ONLY on item page
if (page.includes("item.html")) {
    loadItemPage();
}

// ==========================
// SELL PAGE
// ==========================

if (page.includes("sell.html")) {

    document.addEventListener("DOMContentLoaded", () => {

        const form = document.getElementById("sellForm");
        if (!form || !client) return;

        form.addEventListener("submit", async (e) => {

            e.preventDefault();

            const title = document.getElementById("title").value;
            const price = document.getElementById("price").value;
            const category = document.getElementById("category").value;
            const image_url = document.getElementById("image").value;
            const description = document.getElementById("description").value;

            const msg = document.getElementById("msg");

            const { error } = await client
                .from("items")
                .insert([
                    { title, price, category, image_url, description }
                ]);

            if (error) {
                msg.innerText = "❌ " + error.message;
            } else {
                msg.innerText = "✅ Item posted successfully!";
                form.reset();
            }

        });

    });
}

// ==========================
// SEARCH FILTER (HOME ONLY)
// ==========================

if (page.includes("index.html")) {

    const searchInput = document.querySelector(".search-box input");

    if (searchInput) {

        searchInput.addEventListener("keyup", function () {

            const value = searchInput.value.toLowerCase();

            document.querySelectorAll(".card").forEach(card => {

                const title = card.querySelector("h3")?.textContent.toLowerCase();

                card.style.display =
                    title && title.includes(value) ? "block" : "none";
            });

        });
    }
}

// ==========================
// CATEGORY CLICK (HOME ONLY)
// ==========================

if (page.includes("index.html")) {

    document.querySelectorAll(".category").forEach(category => {

        category.addEventListener("click", () => {
            alert("Category: " + category.innerText);
        });

    });
}

// ==========================
// AUTH SYSTEM
// ==========================

async function signup() {

    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;
    const msg = document.getElementById("msg");

    if (!client) return;

    const { error } = await client.auth.signUp({
        email,
        password
    });

    msg.innerText = error ? "❌ " + error.message : "✅ Account created!";
}

async function login() {

    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;
    const msg = document.getElementById("msg");

    if (!client) return;

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        msg.innerText = "❌ " + error.message;
    } else {
        msg.innerText = "✅ Logged in!";
        console.log("User:", data.user);
    }
}