// Helper to yield control back to the browser for instant UI painting
const yieldToMain = () => {
    if ('scheduler' in window && 'yield' in scheduler) {
        return scheduler.yield();
    }
    return new Promise((resolve) => setTimeout(resolve, 0));
};


// ==========================================
// CAMPUS MARKET JS (CLEANED & UNIFIED)
// ==========================================

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
// SAFE SESSION CHECK
// ==========================
async function getUserSafe() {
    const { data, error } = await client.auth.getSession();
    if (error) return null;
    return data.session?.user || null;
}

// ==========================================
// START APP (RECONSTRUCTED ROUTER)
// ==========================================
async function startApp() {
    const page = getPage();
    console.log("Current page loaded:", page);

    // 🔴 1. Start your global notification listener
    startGlobalNotificationListener();

    // 🔴 2. Route to the correct page-specific function
    try {
        if (page === "index.html" || page === "") {
            if (typeof loadItems === "function") await loadItems();
        } 
        else if (page === "marketplace.html") {
            if (typeof loadItems === "function") await loadItems();
            if (typeof setupFilters === "function") setupFilters();
        } 
        else if (page === "profile.html") {
            if (typeof loadProfile === "function") await loadProfile();
        } 
        else if (page === "messages.html") {
            if (typeof initChatSystem === "function") await initChatSystem();
        } 
        else if (page === "sell.html") {
            if (typeof setupSellForm === "function") setupSellForm();
        }
    } catch (error) {
        console.error("Error loading page features:", error);
    }
}




    // ==========================
    // PROFILE PAGE PROCESSING
    // ==========================
    if (page === "profile.html") {
        const myItemsGrid = document.getElementById("myItemsGrid");
        const savedGrid = document.getElementById("savedGrid");
        const userEmailHeader = document.getElementById("userEmail");
        const userRoleBadge = document.getElementById("userRoleBadge");
        const listingsCount = document.getElementById("listingsCount");

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

                // Fetch & Render Profile Dynamic Trust Badge
                if (userRoleBadge) {
                    try {
                        const { data: profile, error: profileErr } = await client
                            .from("profiles")
                            .select("role")
                            .eq("id", user.id)
                            .single();

                        if (profileErr) throw profileErr;

                        if (profile && profile.role === "student") {
                            userRoleBadge.innerHTML = `
                                <p style="margin: 0; font-size: 0.9rem; color: #6b7280;">University of Zambia</p>
                                <span class="role-badge role-student">
                                    <i class="fa-solid fa-graduation-cap"></i> Verified Student
                                </span>
                            `;
                        } else {
                            userRoleBadge.innerHTML = `
                                <p style="margin: 0; font-size: 0.9rem; color: #6b7280;">Lusaka Community</p>
                                <span class="role-badge role-community">
                                    <i class="fa-solid fa-briefcase"></i> Community Seller
                                </span>
                            `;
                        }
                    } catch (badgeErr) {
                        console.error("Error loading role badge:", badgeErr);
                        userRoleBadge.innerHTML = `
                            <p style="margin: 0; font-size: 0.9rem; color: #6b7280;">Campus Member</p>
                            <span class="role-badge role-community">Campus Member</span>
                        `;
                    }
                }

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

                // Render user's items & Set up Profile Tabs dynamically
                if (myItemsGrid) {
                    // Convert static HTML headers into modern dynamic tabs
                    if (!document.getElementById('profileTabs')) {
                        const listingsHeader = myItemsGrid.parentElement.querySelector('h2');
                        if (listingsHeader) {
                            listingsHeader.style.display = 'none';
                        }

                        const savedSection = document.getElementById('savedGrid')?.parentElement;
                        if (savedSection) {
                            savedSection.style.marginTop = '0';
                            savedSection.style.paddingTop = '0';
                            savedSection.style.borderTop = 'none';
                            const savedHeader = savedSection.querySelector('h2');
                            if (savedHeader) savedHeader.style.display = 'none';
                        }

                        const tabsHTML = `
                            <div id="profileTabs" style="display: flex; gap: 8px; margin: 0 0 25px 0; border-bottom: 1px solid #2e303f; padding-bottom: 8px; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                                <button id="tab-listings" onclick="switchProfileTab('listings')" style="background: none; border: none; color: #fff; font-size: 1rem; font-weight: 600; padding: 8px 16px; border-bottom: 2px solid #4f46e5; cursor: pointer; transition: 0.2s; white-space: nowrap;">
                                    My Listings
                                </button>
                                <button id="tab-saved" onclick="switchProfileTab('saved')" style="background: none; border: none; color: #a6adc8; font-size: 1rem; font-weight: 600; padding: 8px 16px; cursor: pointer; transition: 0.2s; white-space: nowrap;">
                                    Saved Items
                                </button>
                            </div>
                        `;
                        myItemsGrid.parentElement.insertBefore(
                            document.createRange().createContextualFragment(tabsHTML), 
                            myItemsGrid
                        );
                    }

                    // Render dynamic listings cards
                    myItemsGrid.innerHTML = "";
                    if (!myItems || myItems.length === 0) {
                        myItemsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px;">You haven't listed any items for sale yet.</p>`;
                    } else {
                        myItems.forEach(item => {
                            myItemsGrid.innerHTML += `
                                <div class="card" id="item-card-${item.id}" style="background: #1e1e2e; border: 1px solid #2e303f; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                    <img src="${item.image_url || ''}" alt="${item.title}" style="width: 100%; height: 140px; object-fit: cover;">
                                    <div style="padding: 12px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
                                        <div>
                                            <h3 style="margin: 0 0 4px 0; font-size: 1rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title || 'Untitled'}</h3>
                                            <p style="margin: 0; font-size: 0.95rem; color: #a6adc8; font-weight: bold;">K${item.price || '0'}</p>
                                        </div>
                                        
                                        <div style="display: flex; flex-direction: column; gap: 8px;">
                                            <button onclick="openItem('${item.id}')" style="width: 100%; padding: 8px; background: #313244; color: #cdd6f4; border: 1px solid #45475a; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
                                                View Listing
                                            </button>
                                            <div style="display: flex; gap: 8px; width: 100%;">
                                                <button onclick="openEditModal('${item.id}', '${item.title.replace(/'/g, "\\\\'")}', ${item.price}, '${item.image_url || ''}')" style="flex: 1; padding: 8px; background: rgba(79, 70, 229, 0.15); color: #818cf8; border: 1px solid rgba(79, 70, 229, 0.3); border-radius: 6px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer;">
                                                    <i class="fa-solid fa-pen" style="font-size: 0.75rem;"></i> Edit
                                                </button>
                                                <button onclick="deleteItem('${item.id}')" style="flex: 1; padding: 8px; background: rgba(220, 38, 38, 0.15); color: #f87171; border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 6px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer;">
                                                    <i class="fa-solid fa-trash" style="font-size: 0.75rem;"></i> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                    }
                }

                // 2. FETCH SAVED ITEMS 
                if (savedGrid) {
                    await fetchSavedItems();
                }

            } catch (err) {
                console.error("Error setting up profile components:", err);
            }
        }

        loadProfileData();
    }

    // ==========================
    // MESSAGES / CHAT PAGE PROCESSING
    // ==========================
    if (page === "messages.html") {
        const roomsList = document.getElementById("roomsList");
        const noChatSelected = document.getElementById("noChatSelected");
        const activeChatBox = document.getElementById("activeChatBox");
        const chatPartnerEmail = document.getElementById("chatPartnerEmail");
        const chatItemTitle = document.getElementById("chatItemTitle");
        const chatMessages = document.getElementById("chatMessages");
        const chatForm = document.getElementById("chatForm");
        const messageInput = document.getElementById("messageInput");

        let currentUser = null;
        let activeRoomId = new URLSearchParams(window.location.search).get("room");
        let activeChannel = null;

        async function initChatPage() {
            currentUser = await getUserSafe();
            if (!currentUser) {
                alert("Please log in to access your inbox.");
                window.location.href = "login.html";
                return;
            }

            await loadChatRooms();

            if (activeRoomId) {
                await openChatRoom(activeRoomId);
            }
        }

        async function loadChatRooms() {
            if (!roomsList) return;

            try {
                const { data: rooms, error } = await client
                    .from("chat_rooms")
                    .select(`
                        id,
                        buyer_id,
                        seller_id,
                        items ( title )
                    `)
                    .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`);

                if (error) throw error;

                if (!rooms || rooms.length === 0) {
                    roomsList.innerHTML = `<p class="chat-status">No active conversations yet.</p>`;
                    return;
                }

                roomsList.innerHTML = "";

                for (const room of rooms) {
                    const otherUserId = room.buyer_id === currentUser.id ? room.seller_id : room.buyer_id;
                    const { data: otherProfile } = await client
                        .from("profiles")
                        .select("email, role")
                        .eq("id", otherUserId)
                        .single();

                    const partnerEmail = otherProfile?.email || "Unknown User";
                    const isStudent = otherProfile?.role === "student";
                    const badgeIcon = isStudent ? "🎓" : "💼";
                    const isActive = room.id === activeRoomId ? "active" : "";

                    roomsList.innerHTML += `
                        <div class="room-item ${isActive}" onclick="window.location.href='messages.html?room=${room.id}'">
                            <div class="room-avatar"><i class="fa-solid fa-user"></i></div>
                            <div class="room-details">
                                <h4>${badgeIcon} ${partnerEmail.split('@')[0]}</h4>
                                <p>${room.items?.title || "Discussing item"}</p>
                            </div>
                        </div>
                    `;
                }
            } catch (err) {
                console.error("Error loading chat rooms:", err);
                roomsList.innerHTML = `<p class="chat-status" style="color:var(--text-danger);">Error loading inbox.</p>`;
            }
        }

        async function openChatRoom(roomId) {
            activeRoomId = roomId;
            if (noChatSelected) noChatSelected.style.display = "none";
            if (activeChatBox) activeChatBox.style.display = "flex";

            try {
                const { data: room, error: roomErr } = await client
                    .from("chat_rooms")
                    .select(`
                        buyer_id,
                        seller_id,
                        items ( title )
                    `)
                    .eq("id", roomId)
                    .single();

                if (roomErr) throw roomErr;

                const otherUserId = room.buyer_id === currentUser.id ? room.seller_id : room.buyer_id;
                
                const { data: otherUser } = await client
                    .from("profiles")
                    .select("email")
                    .eq("id", otherUserId)
                    .single();

                if (chatPartnerEmail) chatPartnerEmail.innerText = otherUser?.email || "Campus Seller";
                if (chatItemTitle) chatItemTitle.innerText = `Discussing: ${room.items?.title || "Product"}`;

                const { data: messages, error: msgErr } = await client
                    .from("messages")
                    .select("*")
                    .eq("room_id", roomId)
                    .order("created_at", { ascending: true });

                if (msgErr) throw msgErr;

                if (chatMessages) {
                    chatMessages.innerHTML = "";
                    messages.forEach(appendMessage);
                    scrollToBottom();
                }

                if (activeChannel) {
                    client.removeChannel(activeChannel);
                }

                activeChannel = client
                    .channel(`room-${roomId}`)
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
                        (payload) => {
                            appendMessage(payload.new);
                            scrollToBottom();
                        }
                    )
                    .subscribe();

            } catch (err) {
                console.error("Error launching active chat box:", err);
            }
        }

        function appendMessage(msg) {
            if (!chatMessages) return;

            const isSentByMe = msg.sender_id === currentUser.id;
            const msgClass = isSentByMe ? "sent" : "received";

            chatMessages.innerHTML += `
                <div class="msg-wrapper ${msgClass}">
                    <div class="bubble">
                        ${msg.text}
                    </div>
                </div>
            `;
        }

        function scrollToBottom() {
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        chatForm?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const text = messageInput.value.trim();
            if (!text || !activeRoomId || !currentUser) return;

            messageInput.value = "";

            try {
                const { error } = await client
                    .from("messages")
                    .insert({
                        room_id: activeRoomId,
                        sender_id: currentUser.id,
                        text: text
                    });

                if (error) throw error;
            } catch (err) {
                console.error("Failed to deliver message:", err);
            }
        });

        initChatPage();
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
            return false;
        }
    }

    // ==========================
    // GLOBAL FUNCTION
    // ==========================
    window.openItem = (id) => {
        window.location.href = "item.html?id=" + id;
    };

    // ==========================
    // HOME PAGE
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
    // LOAD HOME ITEMS (WITH TRUST BADGES)
    // ==========================
    async function loadHomeItems() {
        const grid = document.querySelector(".product-grid");
        if (!grid) return;

        try {
            const { data, error } = await client
                .from("items")
                .select("*, profiles(role)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (!data) return;

            grid.innerHTML = "";

            for (const item of data) {
                if (!item.id) continue; 
                
                const saved = await isFavorite(item.id);

                let cardBadgeHTML = "";
                if (item.profiles) {
                    if (item.profiles.role === "student") {
                        cardBadgeHTML = `
                            <span class="role-badge role-student" style="margin: 0 15px 12px; display: inline-flex;">
                                <i class="fa-solid fa-graduation-cap"></i> Student
                            </span>
                        `;
                    } else if (item.profiles.role === "community") {
                        cardBadgeHTML = `
                            <span class="role-badge role-community" style="margin: 0 15px 12px; display: inline-flex;">
                                <i class="fa-solid fa-briefcase"></i> Vendor
                            </span>
                        `;
                    }
                }

                grid.innerHTML += `
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <img src="${item.image_url || ''}" alt="${item.title || 'Item'}">
                            <h3>${item.title || 'No Title'}</h3>
                            <p>K${item.price || '0'}</p>
                            ${cardBadgeHTML}
                        </div>
                        <div class="card-buttons" style="padding: 12px 15px;">
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
                let query = client.from("items").select("*, profiles(role)");

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

                    let cardBadgeHTML = "";
                    if (item.profiles) {
                        if (item.profiles.role === "student") {
                            cardBadgeHTML = `
                                <span class="role-badge role-student" style="margin: 0 15px 12px; display: inline-flex;">
                                    <i class="fa-solid fa-graduation-cap"></i> Student
                                </span>
                            `;
                        } else if (item.profiles.role === "community") {
                            cardBadgeHTML = `
                                <span class="role-badge role-community" style="margin: 0 15px 12px; display: inline-flex;">
                                    <i class="fa-solid fa-briefcase"></i> Vendor
                                </span>
                            `;
                        }
                    }

                    grid.innerHTML += `
                        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <img src="${item.image_url || ''}" alt="${item.title || 'Item'}">
                                <h3>${item.title || 'No Title'}</h3>
                                <p>K${item.price || '0'}</p>
                                ${cardBadgeHTML}
                            </div>
                            <div class="card-buttons" style="padding: 12px 15px;">
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
    // ITEM PAGE (WITH BOTH APP CHAT & WHATSAPP)
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
                    .select("*, profiles(role)")
                    .eq("id", id)
                    .single();

                if (error || !data) {
                    box.innerHTML = "Item not found";
                    return;
                }

                const saved = await isFavorite(data.id);

                let sellerBadgeHTML = "";
                if (data.profiles) {
                    if (data.profiles.role === "student") {
                        sellerBadgeHTML = `
                            <div style="margin-bottom: 15px;">
                                <span class="role-badge role-student">
                                    <i class="fa-solid fa-graduation-cap"></i> Verified Student Seller
                                </span>
                            </div>
                        `;
                    } else if (data.profiles.role === "community") {
                        sellerBadgeHTML = `
                            <div style="margin-bottom: 15px;">
                                <span class="role-badge role-community">
                                    <i class="fa-solid fa-briefcase"></i> Community Seller
                                </span>
                            </div>
                        `;
                    }
                }

                box.innerHTML = `
                    <img src="${data.image_url || ''}" style="max-width:100%">
                    <h2>${data.title || 'No Title'}</h2>
                    ${sellerBadgeHTML}
                    <p><strong>K${data.price || '0'}</strong></p>
                    <p>${data.description || 'No description provided.'}</p>
                    <button class="favorite-btn" onclick="toggleFavorite('${data.id}')">
                        ${saved ? "❤️ Saved" : "🤍 Save"}
                    </button>
                    <br><br>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="startInAppChat('${data.id}')" style="background: var(--accent-emerald); color: #0f1115; flex: 1; min-width: 150px; font-weight: 600;">
                            <i class="fa-solid fa-comments"></i> Chat in App
                        </button>
                        <a target="_blank"
                           href="https://wa.me/${data.contact_number || ''}?text=Hi I'm interested in ${encodeURIComponent(data.title || 'this item')}"
                           style="background:#25D366; color:white; padding:12px 18px; border-radius:10px; text-decoration:none; display:inline-flex; align-items:center; gap:8px; justify-content:center; flex: 1; min-width: 150px; font-weight:600;">
                           <i class="fa-brands fa-whatsapp"></i> WhatsApp
                        </a>
                    </div>
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

// ==========================
// GLOBAL CHAT TRIGGER FUNCTION
// ==========================
window.startInAppChat = async function(itemId) {
    try {
        if (!client) {
            alert("Database is connecting, please try again in a moment.");
            return;
        }

        const { data, error } = await client.auth.getSession();
        const user = data.session?.user || null;

        if (error || !user) {
            alert("Please log in to chat with the seller.");
            window.location.href = "login.html";
            return;
        }

        const { data: item, error: itemErr } = await client
            .from("items")
            .select("user_id")
            .eq("id", itemId)
            .single();

        if (itemErr || !item) {
            alert("Error loading item details.");
            return;
        }

        if (item.user_id === user.id) {
            alert("You cannot start a chat on your own listing!");
            return;
        }

        let { data: room, error: roomErr } = await client
            .from("chat_rooms")
            .select("id")
            .eq("item_id", itemId)
            .eq("buyer_id", user.id)
            .maybeSingle();

        if (roomErr) throw roomErr;

        if (!room) {
            const { data: newRoom, error: createErr } = await client
                .from("chat_rooms")
                .insert({
                    item_id: itemId,
                    buyer_id: user.id,
                    seller_id: item.user_id
                })
                .select("id")
                .single();

            if (createErr) throw createErr;
            room = newRoom;
        }

        window.location.href = `messages.html?room=${room.id}`;
    } catch (err) {
        console.error("Error starting chat session:", err);
        alert("Failed to initialize chat. Please check the developer console.");
    }
};

// ==========================================
// ITEM MANAGEMENT (EDIT & DELETE FUNCTIONS)
// ==========================================

// 1. DELETE LISTING FUNCTION
window.deleteItem = async function(itemId) {
    const confirmDelete = confirm("Are you sure you want to delete this listing? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
        const { data, error: sessionErr } = await client.auth.getSession();
        const user = data.session?.user || null;

        if (sessionErr || !user) {
            alert("Your session has expired. Please log in again.");
            window.location.href = "login.html";
            return;
        }

        const { error } = await client
            .from("items")
            .delete()
            .eq("id", itemId)
            .eq("user_id", user.id); 

        if (error) throw error;

        const card = document.getElementById(`item-card-${itemId}`);
        if (card) card.remove();

        const countBadge = document.getElementById("listingsCount");
        if (countBadge) {
            const currentCount = parseInt(countBadge.innerText) || 0;
            countBadge.innerText = Math.max(0, currentCount - 1);
        }

        alert("🗑️ Listing deleted successfully.");
    } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete listing.");
    }
};

// 2. QUICK EDIT TITLE/PRICE FUNCTION
window.editItemPrompt = async function(itemId, currentTitle, currentPrice) {
    const newTitle = prompt("Update Item Title:", currentTitle);
    if (newTitle === null) return; 
    
    const newPriceStr = prompt("Update Item Price (K):", currentPrice);
    if (newPriceStr === null) return; 

    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0) {
        alert("Please enter a valid price.");
        return;
    }

    try {
        const { data, error: sessionErr } = await client.auth.getSession();
        const user = data.session?.user || null;

        if (sessionErr || !user) {
            alert("Session expired. Please log in.");
            window.location.href = "login.html";
            return;
        }

        const { error } = await client
            .from("items")
            .update({
                title: newTitle.trim(),
                price: newPrice
            })
            .eq("id", itemId)
            .eq("user_id", user.id);

        if (error) throw error;

        alert("✨ Listing updated successfully!");
        location.reload(); 

    } catch (err) {
        console.error("Update failed:", err);
        alert("Failed to update listing.");
    }
};

// ==========================================
// PROFESSIONAL EDIT MODAL SYSTEM
// ==========================================

// 1. Inject Modal HTML & CSS into the page dynamically
const modalHTML = `
<div id="editModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:1000; justify-content:center; align-items:center; padding:20px; box-sizing:border-box;">
    <div style="background:#1e1e2e; color:#fff; width:100%; max-width:450px; padding:24px; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.5); font-family:sans-serif; position:relative;">
        <h3 style="margin-top:0; margin-bottom:16px; font-size:1.3rem;">Edit Your Listing</h3>
        
        <form id="editForm" style="display:flex; flex-direction:column; gap:14px;">
            <input type="hidden" id="editItemId">
            
            <div>
                <label style="display:block; font-size:0.85rem; color:#a6adc8; margin-bottom:4px;">Item Title</label>
                <input type="text" id="editTitle" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #45475a; background:#313244; color:#fff; box-sizing:border-box;">
            </div>

            <div>
                <label style="display:block; font-size:0.85rem; color:#a6adc8; margin-bottom:4px;">Price (ZMK)</label>
                <input type="number" id="editPrice" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #45475a; background:#313244; color:#fff; box-sizing:border-box;">
            </div>

            <div>
                <label style="display:block; font-size:0.85rem; color:#a6adc8; margin-bottom:4px;">Current Image Preview</label>
                <img id="editImagePreview" src="" style="width:100px; height:100px; object-fit:cover; border-radius:8px; margin-bottom:8px; display:block; border:1px solid #45475a;">
                
                <label style="display:block; font-size:0.85rem; color:#a6adc8; margin-bottom:4px;">Upload New Image (Optional)</label>
                <input type="file" id="editImageFile" accept="image/*" style="width:100%; color:#a6adc8; font-size:0.85rem;">
            </div>

            <div style="display:flex; gap:10px; margin-top:10px;">
                <button type="button" onclick="closeEditModal()" style="flex:1; padding:10px; border-radius:8px; border:none; background:#45475a; color:#fff; font-weight:bold; cursor:pointer;">Cancel</button>
                <button type="submit" style="flex:1; padding:10px; border-radius:8px; border:none; background:#4f46e5; color:#fff; font-weight:bold; cursor:pointer;">Save Changes</button>
            </div>
        </form>
    </div>
</div>
`;

document.body.insertAdjacentHTML('beforeend', modalHTML);

// 2. Open Modal & Populate fields
window.openEditModal = function(itemId, title, price, imageUrl) {
    document.getElementById('editItemId').value = itemId;
    document.getElementById('editTitle').value = title;
    document.getElementById('editPrice').value = price;
    
    const imgPreview = document.getElementById('editImagePreview');
    if (imageUrl) {
        imgPreview.src = imageUrl;
        imgPreview.style.display = 'block';
    } else {
        imgPreview.style.display = 'none';
    }
    
    document.getElementById('editImageFile').value = "";
    document.getElementById('editModal').style.display = 'flex';
};

// 3. Close Modal
window.closeEditModal = function() {
    document.getElementById('editModal').style.display = 'none';
};

// 4. Handle Form Submit (Upload image & Save to DB)
document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('editItemId').value;
    const title = document.getElementById('editTitle').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const fileInput = document.getElementById('editImageFile');
    const file = fileInput.files[0];
    
    if (isNaN(price) || price <= 0) {
        alert("Please enter a valid price.");
        return;
    }

    try {
        const { data, error: sessionErr } = await client.auth.getSession();
        const user = data.session?.user || null;

        if (sessionErr || !user) {
            alert("Session expired. Please log in.");
            window.location.href = "login.html";
            return;
        }

        let imageUrl = document.getElementById('editImagePreview').src;

        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadErr } = await client.storage
                .from('item-images') 
                .upload(fileName, file, { upsert: true });

            if (uploadErr) throw uploadErr;

            const { data: urlData } = client.storage
                .from('item-images')
                .getPublicUrl(fileName);

            imageUrl = urlData.publicUrl;
        }

        const { error: updateErr } = await client
            .from('items')
            .update({
                title: title,
                price: price,
                image_url: imageUrl
            })
            .eq('id', itemId)
            .eq('user_id', user.id);

        if (updateErr) throw updateErr;

        alert("✨ Listing updated successfully!");
        closeEditModal();
        location.reload(); 

    } catch (err) {
        console.error("Update failed:", err);
        alert("An error occurred while updating your listing.");
    }
});

// ==========================================
// OPTIMIZED PROFILE TAB TOGGLE (0ms INP Delay)
// ==========================================
window.switchProfileTab = async function(tabName) {
    const tabListings = document.getElementById('tab-listings');
    const tabSaved = document.getElementById('tab-saved');
    
    const sectionListings = document.getElementById('myItemsGrid')?.parentElement;
    const sectionSaved = document.getElementById('savedGrid')?.parentElement;

    const resetTab = (tab) => {
        if (tab) {
            tab.style.color = '#a6adc8';
            tab.style.borderBottom = 'none';
        }
    };

    const activeTab = (tab) => {
        if (tab) {
            tab.style.color = '#fff';
            tab.style.borderBottom = '2px solid #4f46e5';
        }
    };

    resetTab(tabListings);
    resetTab(tabSaved);

    if (sectionListings) sectionListings.style.display = 'none';
    if (sectionSaved) sectionSaved.style.display = 'none';

    if (tabName === 'listings') {
        activeTab(tabListings);
        if (sectionListings) sectionListings.style.display = 'block';
    } else if (tabName === 'saved') {
        activeTab(tabSaved);
        if (sectionSaved) sectionSaved.style.display = 'block';
    }

    await new Promise(resolve => setTimeout(resolve, 0));

    if (tabName === 'listings') {
        // Handled dynamically during page load initialization
    } else if (tabName === 'saved') {
        if (typeof fetchSavedItems === 'function') {
            fetchSavedItems();
        }
    }
};

// ==========================================
// 2. DIAGNOSTIC FETCH & RENDER SAVED ITEMS
// ==========================================
async function fetchSavedItems() {
    const savedGrid = document.getElementById("savedGrid");
    if (!savedGrid) return;

    try {
        const { data: sessionData, error: sessionErr } = await client.auth.getSession();
        const user = sessionData.session?.user || null;

        if (sessionErr || !user) {
            savedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px;">Please log in to view your saved items.</p>`;
            return;
        }

        const { data: favData, error: favError } = await client
            .from("favorites") 
            .select("item_id")
            .eq("user_id", user.id);

        if (favError) {
            savedGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #f87171; padding: 20px;">
                    <p><strong>Database Error:</strong> ${favError.message}</p>
                    <p style="font-size: 0.8rem; color: #a6adc8;">Hint: Double-check if your Supabase table is named "favorites" or something else.</p>
                </div>
            `;
            return;
        }

        if (!favData || favData.length === 0) {
            savedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px;">You haven't saved any items yet. 🤍</p>`;
            return;
        }

        const itemIds = favData.map(fav => fav.item_id);

        const { data: savedItems, error: itemsError } = await client
            .from("items")
            .select("*")
            .in("id", itemIds);

        if (itemsError) throw itemsError;

        savedGrid.innerHTML = "";
        if (!savedItems || savedItems.length === 0) {
            savedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px;">The items you saved are no longer available.</p>`;
        } else {
            savedItems.forEach(item => {
                savedGrid.innerHTML += `
                    <div class="card" id="saved-card-${item.id}" style="background: #1e1e2e; border: 1px solid #2e303f; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <img src="${item.image_url || ''}" alt="${item.title}" style="width: 100%; height: 140px; object-fit: cover;">
                        <div style="padding: 12px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
                            <div>
                                <h3 style="margin: 0 0 4px 0; font-size: 1rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title || 'Untitled'}</h3>
                                <p style="margin: 0; font-size: 0.95rem; color: #a6adc8; font-weight: bold;">K${item.price || '0'}</p>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <button onclick="openItem('${item.id}')" style="width: 100%; padding: 8px; background: #313244; color: #cdd6f4; border: 1px solid #45475a; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
                                    View Listing
                                </button>
                                <button onclick="toggleFavorite('${item.id}')" style="width: 100%; padding: 8px; background: rgba(220, 38, 38, 0.15); color: #f87171; border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 6px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer;">
                                    <i class="fa-solid fa-heart-broken"></i> Unsave
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    } catch (err) {
        console.error("Error fetching saved items:", err);
        savedGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #e78284; padding: 20px;">An unexpected error occurred.</p>`;
    }
}
// ==========================================
// REAL-TIME NEW MESSAGE ALERTS
// ==========================================
async function startGlobalNotificationListener() {
    // 1. Ensure client is ready and user is logged in
    if (!client) return;
    
    try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) return; // User isn't logged in

        const chatBadge = document.getElementById("chatBadge");
        if (!chatBadge) return; // Not on a page with the nav bar badge

        // 2. Clear badge automatically if we are currently on the messages page
        if (window.location.pathname.includes("messages.html")) {
            chatBadge.style.display = "none";
        }

        // 3. Listen for any new messages sent in the database
        client
            .channel('global-message-alerts')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMessage = payload.new;

                    // 4. If the message is from someone else, light up the red dot!
                    if (newMessage.sender_id !== user.id) {
                        // Only show the badge if we aren't already viewing this chat room
                        const isCurrentlyOnChatPage = window.location.pathname.includes("messages.html");
                        
                        if (isCurrentlyOnChatPage && typeof activeRoomId !== 'undefined' && activeRoomId === newMessage.room_id) {
                            return; 
                        }

                        // Show the notification dot
                        chatBadge.style.display = "block";

                        // Play a soft notification ping!
                        try {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
                            audio.volume = 0.3;
                            audio.play();
                        } catch (e) {
                            // Browser blocked autoplay; fails silently
                        }
                    }
                }
            )
            .subscribe();
    } catch (err) {
        console.error("Notification listener error:", err);
    }
}
