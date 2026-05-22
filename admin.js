if (sessionStorage.getItem("admin_auth") !== "true") {
  window.location.href = "index.html";
}

const ADMIN_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbx-OHXVHE04HwudHzROJrdSWLQ1zGiNU2BbGyry0AkOSg9LQAimv8cpcUhe9LwjV9EvHw/exec"
};

const cardsContainer = document.getElementById("adminCardsList");

function esc(str) {
  return (str || "").toString().replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function toBool(v) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}
function toNum(v, fallback = 9999) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function logoutAdmin() {
  sessionStorage.removeItem("admin_auth");
  window.location.href = "index.html";
}

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
      </div>`;
    return;
  }
  activeCards.forEach(card => {
    const item = document.createElement("div");
    item.className = "admin-card";
    item.innerHTML = `
      <div class="admin-card-tag">${esc(card.tag || "عام")}</div>
      <h3 class="admin-card-title">${esc(card.title || "بدون عنوان")}</h3>
      <p class="admin-card-desc">${esc(card.description || "")}</p>
      <div class="admin-card-actions">
        <a class="admin-card-btn" href="${esc(card.linkUrl || "#")}" target="_blank" rel="noopener">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          ${esc(card.linkText || "الدخول")}
        </a>
      </div>`;
    cardsContainer.appendChild(item);
  });
}

async function loadAdminCards() {
  try {
    const res = await fetch(`${ADMIN_CONFIG.apiUrl}?type=admincards`, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    renderCards(data.adminCards || []);
  } catch (err) {
    console.error(err);
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="empty-state">
          <h3>تعذر تحميل البطاقات</h3>
          <p>راجع رابط السكربت وإعادة النشر.</p>
        </div>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", loadAdminCards);
