const CONFIG = {
  calendlyBig: "https://calendly.com/alamiya8hr/training-room",
  calendlySmall: "https://calendly.com/alamiya7hr/meeting-room",
  phone: "+9647835795996",
  email: "muntathar.satar@alamiyaco.com",
  apiUrl: "https://script.google.com/macros/s/AKfycbwAtBZJC5vhJOfwHrBgbP1Z9AJJI6QRkV9m8ZGttDYGJzfFlp5y0tGGWVpgP8zJFJXelw/exec",
  applyFormUrl: "https://forms.gle/UM28RJXSiH8pwrRG8",
  adminPassword: "20261100"
};

const FALLBACK_ANNOUNCEMENTS = [
  {
    title: "مرحباً بكم في بوابة الموارد البشرية",
    body: "سيتم عرض الإعلانات هنا عند توفرها.",
    date: "",
    tag: "تنبيه",
    isActive: true,
    priority: 1,
    linkUrl: "#",
    linkText: ""
  }
];

let ANNOUNCEMENTS = [];

function esc(str){
  return (str || "").toString().replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function toBool(v){
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function toNum(v, fallback = 9999){
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const header = document.getElementById("header");
window.addEventListener("scroll", () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 45);
});

function injectConfig(){
  const hrPhoneEl = document.getElementById("hrPhone");
  if (hrPhoneEl) hrPhoneEl.textContent = CONFIG.phone;

  const hrEmail = document.getElementById("hrEmail");
  if (hrEmail){
    hrEmail.textContent = CONFIG.email;
    hrEmail.href = "mailto:" + CONFIG.email;
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const applyBtn = document.getElementById("applyFormBtn");
  if (applyBtn) applyBtn.href = CONFIG.applyFormUrl || "#";

  const applyQuick = document.getElementById("applyFormQuick");
  if (applyQuick) applyQuick.href = CONFIG.applyFormUrl || "#";
}

const annList = document.getElementById("annList");

function renderAnnouncements(){
  if (!annList) return;
  annList.innerHTML = "";

  const active = (ANNOUNCEMENTS || []).filter(a => toBool(a.isActive ?? true));

  const sorted = [...active].sort((a, b) => {
    const pa = toNum(a.priority, 9999);
    const pb = toNum(b.priority, 9999);
    if (pa !== pb) return pa - pb;
    return String(b.date || "").localeCompare(String(a.date || ""));
  });

  if (sorted.length === 0){
    annList.innerHTML = `
      <div class="card ann-item">
        <div class="card-body">
          <div class="ann-title">لا توجد إعلانات حالياً</div>
          <div class="ann-text">سيتم عرض أي إعلان جديد هنا عند إضافته من لوحة التحكم.</div>
        </div>
      </div>`;
    return;
  }

  sorted.forEach(a => {
    const wrap = document.createElement("div");
    wrap.className = "card ann-item reveal visible";
    wrap.innerHTML = `
      <div class="card-body">
        <div class="ann-title">${esc(a.title)}</div>
        <div class="ann-text">${esc(a.body || "")}</div>
        <div class="ann-meta">
          <span class="pill"><span>📅</span><span>${esc(a.date || "-")}</span></span>
          <span class="pill gray"><span>🏷️</span><span>${esc(a.tag || "إعلان")}</span></span>
        </div>
        ${(a.linkUrl && a.linkUrl !== "#") ? `
          <div class="ann-actions">
            <a class="btn btn-primary btn-sm" href="${esc(a.linkUrl)}" target="_blank" rel="noopener">${esc(a.linkText || "رابط")}</a>
          </div>
        ` : ``}
      </div>
    `;
    annList.appendChild(wrap);
  });
}

async function loadAnnouncementsFromApi(){
  const res = await fetch(CONFIG.apiUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("API HTTP " + res.status);

  const data = await res.json();
  const arr = Array.isArray(data) ? data : (data.announcements || []);

  ANNOUNCEMENTS = arr.map(x => ({
    id: x.id ?? x.ID ?? "",
    title: x.title ?? x.Title ?? "",
    body: x.body ?? x.Body ?? "",
    tag: x.tag ?? x.Tag ?? "",
    date: x.date ?? x.Date ?? "",
    linkText: x.linkText ?? x.link_text ?? x.LinkText ?? "",
    linkUrl: x.linkUrl ?? x.link_url ?? x.LinkUrl ?? "#",
    isActive: x.isActive ?? x.active ?? x.IsActive ?? true,
    priority: x.priority ?? x.Priority ?? 9999
  }));

  renderAnnouncements();
}

const calModal = document.getElementById("calModal");
const calFrame = document.getElementById("calFrame");
const calTitle = document.getElementById("calTitle");

function openCalendly(which){
  const url = which === "big" ? CONFIG.calendlyBig : CONFIG.calendlySmall;
  if (calTitle) calTitle.textContent = which === "big" ? "حجز القاعة الكبيرة" : "حجز القاعة الصغيرة";
  if (calFrame) calFrame.src = url;
  if (calModal){
    calModal.classList.add("show");
    calModal.setAttribute("aria-hidden", "false");
  }
}

function closeCalModal(){
  if (calFrame) calFrame.src = "about:blank";
  if (calModal){
    calModal.classList.remove("show");
    calModal.setAttribute("aria-hidden", "true");
  }
}

if (calModal){
  calModal.addEventListener("click", e => {
    if (e.target === calModal) closeCalModal();
  });
}

const adminLoginModal = document.getElementById("adminLoginModal");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginError = document.getElementById("adminLoginError");

function openAdminLogin(){
  if (adminLoginModal){
    adminLoginModal.classList.add("show");
    adminLoginModal.setAttribute("aria-hidden", "false");
  }

  if (adminPasswordInput){
    adminPasswordInput.value = "";
    setTimeout(() => adminPasswordInput.focus(), 100);
  }

  if (adminLoginError) adminLoginError.textContent = "";
}

function closeAdminLogin(){
  if (adminLoginModal){
    adminLoginModal.classList.remove("show");
    adminLoginModal.setAttribute("aria-hidden", "true");
  }

  if (adminPasswordInput) adminPasswordInput.value = "";
  if (adminLoginError) adminLoginError.textContent = "";
}

function submitAdminLogin(){
  const entered = (adminPasswordInput?.value || "").trim();

  if (entered === CONFIG.adminPassword){
    sessionStorage.setItem("admin_auth", "true");
    window.location.href = "admin.html";
  } else {
    if (adminLoginError) adminLoginError.textContent = "كلمة المرور غير صحيحة";
  }
}

if (adminPasswordInput){
  adminPasswordInput.addEventListener("keydown", e => {
    if (e.key === "Enter") submitAdminLogin();
  });
}

if (adminLoginModal){
  adminLoginModal.addEventListener("click", e => {
    if (e.target === adminLoginModal) closeAdminLogin();
  });
}

function setupReveal(){
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)){
    els.forEach(el => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", async () => {
  injectConfig();
  setupReveal();

  ANNOUNCEMENTS = [...FALLBACK_ANNOUNCEMENTS];
  renderAnnouncements();

  try {
    await loadAnnouncementsFromApi();
  } catch (err) {
    console.warn("Announcements API failed, using fallback.", err);
  }
});
