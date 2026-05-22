const CONFIG = {
  calendlyBig: "https://calendly.com/alamiya8hr/training-room",
  calendlySmall: "https://calendly.com/alamiya7hr/meeting-room",
  phone: "+9647835795996",
  email: "muntathar.satar@alamiyaco.com",
  apiUrl: "https://script.google.com/macros/s/AKfycbzF4Vpg8YkDodFwr-eSD4CnrfGxDJvDEYyXqfsR3-bHZF4Xqx3ox4b_rkcndNAp4u9k7g/exec",
  applyFormUrl: "https://forms.gle/UM28RJXSiH8pwrRG8",
  adminPassword: "20261100"
};

const FALLBACK_ANNOUNCEMENTS = [
  {
    title: "مرحباً بكم في بوابة الموارد البشرية",
    body: "سيتم عرض الإعلانات هنا عند توفرها من قسم الموارد البشرية.",
    date: "",
    tag: "تنبيه",
    isActive: true,
    priority: 9999,
    linkUrl: "#",
    linkText: ""
  }
];

let ANNOUNCEMENTS = [];

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

function formatDisplayDate(dateValue) {
  if (!dateValue) return "-";

  const raw = String(dateValue).trim();

  if (!raw) return "-";

  if (raw.includes("T")) {
    const d = new Date(raw);

    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("ar-IQ", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
  }

  const parts = raw.split("-");

  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    const d = new Date(year, month, day);

    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("ar-IQ", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
  }

  return raw;
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
   Header Scroll
========================= */

const header = document.getElementById("header");

window.addEventListener("scroll", () => {
  if (!header) return;

  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

/* =========================
   Inject Config
========================= */

function injectConfig() {
  const hrPhoneEl = document.getElementById("hrPhone");

  if (hrPhoneEl) {
    hrPhoneEl.textContent = CONFIG.phone;
  }

  const hrEmail = document.getElementById("hrEmail");

  if (hrEmail) {
    hrEmail.textContent = CONFIG.email;
    hrEmail.href = "mailto:" + CONFIG.email;
  }

  const yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const applyBtn = document.getElementById("applyFormBtn");

  if (applyBtn) {
    applyBtn.href = CONFIG.applyFormUrl || "#";
  }
}

/* =========================
   Announcements
========================= */

const annList = document.getElementById("annList");

function renderAnnouncements() {
  if (!annList) return;

  annList.innerHTML = "";

  const active = (ANNOUNCEMENTS || []).filter(a => toBool(a.isActive ?? true));

  const sorted = [...active].sort((a, b) => {
    const pa = toNum(a.priority, 9999);
    const pb = toNum(b.priority, 9999);

    if (pa !== pb) return pa - pb;

    return String(b.date || "").localeCompare(String(a.date || ""));
  });

  if (sorted.length === 0) {
    annList.innerHTML = `
      <div class="empty-state">
        <h3>لا توجد إعلانات حالياً</h3>
        <p>سيتم عرض الإعلانات هنا عند توفرها من قسم الموارد البشرية.</p>
      </div>
    `;
    return;
  }

  sorted.forEach(a => {
    const hasLink = a.linkUrl && a.linkUrl !== "#";
    const displayDate = formatDisplayDate(a.date);

    const wrap = document.createElement("article");
    wrap.className = "card ann-item";

    wrap.innerHTML = `
      <div class="card-body announcement-card-body">

        <div class="announcement-top">
          <span class="announcement-tag">
            🏷️ ${esc(a.tag || "إعلان")}
          </span>

          <span class="announcement-date">
            📅 ${esc(displayDate)}
          </span>
        </div>

        <h3 class="ann-title">
          ${esc(a.title || "بدون عنوان")}
        </h3>

        <p class="ann-text">
          ${esc(a.body || "")}
        </p>

        ${hasLink ? `
          <div class="ann-actions">
            <a class="btn btn-primary btn-sm" href="${esc(a.linkUrl)}" target="_blank" rel="noopener">
              ${esc(a.linkText || "عرض التفاصيل")}
            </a>
          </div>
        ` : ``}

      </div>
    `;

    annList.appendChild(wrap);
  });
}

async function loadAnnouncementsFromApi() {
  let data;

  try {
    const res = await fetch(CONFIG.apiUrl, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("API HTTP " + res.status);
    }

    data = await res.json();
  } catch (fetchError) {
    console.warn("Fetch failed, trying JSONP fallback:", fetchError);
    data = await loadJsonp(CONFIG.apiUrl);
  }

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

/* =========================
   Calendly Modal
========================= */

const calModal = document.getElementById("calModal");
const calFrame = document.getElementById("calFrame");
const calTitle = document.getElementById("calTitle");

function openCalendly(which) {
  const url = which === "big" ? CONFIG.calendlyBig : CONFIG.calendlySmall;

  if (calTitle) {
    calTitle.textContent = which === "big" ? "حجز القاعة الكبيرة" : "حجز القاعة الصغيرة";
  }

  if (calFrame) {
    calFrame.src = url;
  }

  if (calModal) {
    calModal.classList.add("show");
    calModal.setAttribute("aria-hidden", "false");
  }
}

function closeCalModal() {
  if (calFrame) {
    calFrame.src = "about:blank";
  }

  if (calModal) {
    calModal.classList.remove("show");
    calModal.setAttribute("aria-hidden", "true");
  }
}

if (calModal) {
  calModal.addEventListener("click", e => {
    if (e.target === calModal) {
      closeCalModal();
    }
  });
}

/* =========================
   Admin Login Modal
========================= */

const adminLoginModal = document.getElementById("adminLoginModal");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginError = document.getElementById("adminLoginError");

function openAdminLogin() {
  if (adminLoginModal) {
    adminLoginModal.classList.add("show");
    adminLoginModal.setAttribute("aria-hidden", "false");
  }

  if (adminPasswordInput) {
    adminPasswordInput.value = "";
    setTimeout(() => adminPasswordInput.focus(), 100);
  }

  if (adminLoginError) {
    adminLoginError.textContent = "";
  }
}

function closeAdminLogin() {
  if (adminLoginModal) {
    adminLoginModal.classList.remove("show");
    adminLoginModal.setAttribute("aria-hidden", "true");
  }

  if (adminPasswordInput) {
    adminPasswordInput.value = "";
  }

  if (adminLoginError) {
    adminLoginError.textContent = "";
  }
}

function submitAdminLogin() {
  const entered = (adminPasswordInput?.value || "").trim();

  if (entered === CONFIG.adminPassword) {
    sessionStorage.setItem("admin_auth", "true");
    window.location.href = "admin.html";
  } else {
    if (adminLoginError) {
      adminLoginError.textContent = "كلمة المرور غير صحيحة";
    }
  }
}

if (adminPasswordInput) {
  adminPasswordInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      submitAdminLogin();
    }
  });
}

if (adminLoginModal) {
  adminLoginModal.addEventListener("click", e => {
    if (e.target === adminLoginModal) {
      closeAdminLogin();
    }
  });
}

/* =========================
   Reveal Animation
========================= */

function initRevealAnimation() {
  const items = document.querySelectorAll(".reveal");

  if (!items.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12
  });

  items.forEach(item => observer.observe(item));
}

/* =========================
   Keyboard Shortcuts
========================= */

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeCalModal();
    closeAdminLogin();
  }
});

/* =========================
   Init
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  injectConfig();
  initRevealAnimation();

  ANNOUNCEMENTS = FALLBACK_ANNOUNCEMENTS;
  renderAnnouncements();

  try {
    await loadAnnouncementsFromApi();
  } catch (err) {
    console.error("تعذر تحميل الإعلانات من Google Sheet:", err);

    ANNOUNCEMENTS = FALLBACK_ANNOUNCEMENTS;
    renderAnnouncements();
  }
});
