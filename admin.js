if (sessionStorage.getItem("admin_auth") !== "true") {
  window.location.href = "index.html";
}

const ADMIN_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbzF4Vpg8YkDodFwr-eSD4CnrfGxDJvDEYyXqfsR3-bHZF4Xqx3ox4b_rkcndNAp4u9k7g/exec"
};

const cardsContainer = document.getElementById("adminCardsList");

/* =========================
   Helpers
========================= */

function esc(str) {
  return (str || "").toString().replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function toBool(v) {
  if (typeof v === "boolean") return v;

  const s = String(v ?? "").trim().toLowerCase();

  return (
    s === "true" ||
    s === "1" ||
    s === "yes" ||
    s === "y" ||
    s === "نعم"
  );
}

function toNum(v, fallback = 9999) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function buildUrlWithParam(url, key, value) {
  const separator = url.includes("?") ? "&" : "?";
  return url + separator + encodeURIComponent(key) + "=" + encodeURIComponent(value);
}

function loadJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = "jsonpCallback_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

    let script;

    window[callbackName] = function(data) {
      resolve(data);

      delete window[callbackName];

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    script = document.createElement("script");
    script.src = buildUrlWithParam(url, "callback", callbackName);
    script.async = true;

    script.onerror = function() {
      delete window[callbackName];

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }

      reject(new Error("JSONP load failed"));
    };

    document.body.appendChild(script);
  });
}

/* =========================
   Admin Actions
========================= */

function logoutAdmin() {
  sessionStorage.removeItem("admin_auth");
  window.location.href = "index.html";
}

/* =========================
   Render Cards
========================= */

function renderCards(cards) {
  if (!cardsContainer) return;

  cardsContainer.innerHTML = "";

  const activeCards = (cards || [])
    .filter(card => toBool(card.isActive ?? true))
    .sort((a, b) => toNum(a.sortOrder, 9999) - toNum(b.sortOrder, 9999));

  if (activeCards.length === 0) {
    cardsContainer.innerHTML = `
      <div class="empty-state">
        <h3>لا توجد بطاقات حالياً</h3>
        <p>قم بإضافة بيانات داخل شيت AdminCards.</p>
      </div>
    `;
    return;
  }

  activeCards.forEach(card => {
    const item = document.createElement("div");
    item.className = "admin-card";

    item.innerHTML = `
      <div class="admin-card-tag">
        ${esc(card.tag || "عام")}
      </div>

      <h3 class="admin-card-title">
        ${esc(card.title || "بدون عنوان")}
      </h3>

      <p class="admin-card-desc">
        ${esc(card.description || "")}
      </p>

      <div class="admin-card-actions">
        <a class="admin-card-btn" href="${esc(card.linkUrl || "#")}" target="_blank" rel="noopener">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          ${esc(card.linkText || "الدخول")}
        </a>
      </div>
    `;

    cardsContainer.appendChild(item);
  });
}

/* =========================
   Load Admin Cards
========================= */

async function loadAdminCards() {
  const url = buildUrlWithParam(ADMIN_CONFIG.apiUrl, "type", "admincards");

  try {
    let data;

    try {
      const res = await fetch(url, {
        cache: "no-store"
      });

      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }

      data = await res.json();
    } catch (fetchError) {
      console.warn("Admin fetch failed, trying JSONP fallback:", fetchError);
      data = await loadJsonp(url);
    }

    const cards = data.adminCards || [];
    renderCards(cards);

  } catch (err) {
    console.error("تعذر تحميل بطاقات الأدمن:", err);

    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="empty-state">
          <h3>تعذر تحميل البطاقات</h3>
          <p>راجع رابط السكربت وإعادة النشر.</p>
        </div>
      `;
    }
  }
}

/* =========================
   Init
========================= */

document.addEventListener("DOMContentLoaded", loadAdminCards);
