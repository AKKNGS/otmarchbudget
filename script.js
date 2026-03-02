const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8egbJLZlZM7Nbv55r0uyMyRon8xE0kSl1logxqg8DJyuYBtNYG3KKGtty-0HMGZzObQ/exec";

let globalData = { teachers: [], students: [] };
let currentView = "teachers"; // teachers | students
let lastTeachersRendered = [];
let lastStudentsRendered = [];

// ---------- Helpers ----------
function $(id) { return document.getElementById(id); }

function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function parseMoney(val) {
  const digits = String(val ?? "0").replace(/[^\d]/g, "");
  return parseInt(digits, 10) || 0;
}

function formatRiel(n) {
  return `${(n || 0).toLocaleString()} ៛`;
}

// key ភេទ = "ភេទ" (Male/Female)
function isFemale(obj) {
  const g = String(obj?.["ភេទ"] ?? "").trim().toLowerCase();
  return g === "female" || g === "f" || g.includes("ស្រី");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- Navigation ----------
function setActivePage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $(`${page}-page`).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  (page === "home" ? $("nav-data") : $("nav-profile")).classList.add("active");

  // ចុច "ទិន្នន័យ" => default "គ្រូ"
  if (page === "home") setTab("teachers", true);
}

function setTab(type, forceRender = false) {
  const tabTeachers = $("tab-teachers");
  const tabStudents = $("tab-students");

  tabTeachers.classList.toggle("active", type === "teachers");
  tabStudents.classList.toggle("active", type === "students");

  tabTeachers.setAttribute("aria-selected", type === "teachers" ? "true" : "false");
  tabStudents.setAttribute("aria-selected", type === "students" ? "true" : "false");

  currentView = type;
  $("search-input").value = "";

  if (forceRender) type === "teachers" ? renderTeachers() : renderStudents();
}

// ---------- Modal (Detail) ----------
function openModal() {
  const m = $("detail-modal");
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const m = $("detail-modal");
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setDetail(title, sub, html) {
  $("detail-title").textContent = title;
  $("detail-sub").textContent = sub;
  $("detail-content").innerHTML = html;
  openModal();
}

function openTeacherDetail(t) {
  const name = t["ឈ្មោះគ្រូ"] || "-";
  const gender = t["ភេទ"] || "-";
  const month = t["ខែ"] || "-";
  const studentsCount = t["ចំនួនសិស្ស"] ?? "-";

  const b100 = t["ថវិកាប្រមូលបាន"] ?? "-";
  const b80  = t["ថវិកាគ្រូ 80%"] ?? "-";
  const b20  = t["ថវិកាសាលា20%"] ?? "-";

  const html = `
    <div class="detail-grid">
      <div class="detail-item wide">
        <div class="detail-label">ឈ្មោះគ្រូ</div>
        <div class="detail-value">${escapeHtml(name)}</div>
      </div>

      <div class="detail-item">
        <div class="detail-label">ភេទ</div>
        <div class="detail-value">${escapeHtml(gender)}</div>
      </div>

      <div class="detail-item">
        <div class="detail-label">ចំនួនសិស្ស</div>
        <div class="detail-value">${escapeHtml(studentsCount)}</div>
      </div>

      <div class="detail-item wide">
        <div class="detail-label">ខែ</div>
        <div class="detail-value">${escapeHtml(month)}</div>
      </div>

      <div class="detail-item">
        <div class="detail-label">ថវិកា 100%</div>
        <div class="detail-value">${escapeHtml(b100)}</div>
      </div>

      <div class="detail-item">
        <div class="detail-label">ថវិកា 80%</div>
        <div class="detail-value">${escapeHtml(b80)}</div>
      </div>

      <div class="detail-item wide">
        <div class="detail-label">ថវិកា 20%</div>
        <div class="detail-value">${escapeHtml(b20)}</div>
      </div>
    </div>
  `;

  setDetail("ព័ត៌មានលម្អិត (គ្រូ)", `គ្រូ៖ ${name}`, html);
}

function openStudentDetail(s) {
  const name = s["ឈ្មោះសិស្ស"] || "-";
  const gender = s["ភេទ"] || "-";
  const grade = s["ថ្នាក់"] || "-";
  const teacher = s["ឈ្មោះគ្រូ"] || "-";

  const fee = s["តម្លៃសិក្សា"] ?? "-";
  const b80 = s["ថវិកាគ្រូ 80%"] ?? "-";
  const b20 = s["ថវិកាសិស្ស 20%"] ?? "-";

  const html = `
    <div class="detail-grid">
      <div class="detail-item wide">
        <div class="detail-label">ឈ្មោះសិស្ស</div>
        <div class="detail-value">${escapeHtml(name)}</div>
      </div>

      <div class="detail-item">
        <div class="detail-label">ភេទ</div>
        <div class="detail-value">${escapeHtml(gender)}</div>
      </div>

      <div class="detail-item">
        <div class="detail-label">ថ្នាក់</div>
        <div class="detail-value">${escapeHtml(grade)}</div>
      </div>

      <div class="detail-item wide">
        <div class="detail-label">គ្រូ</div>
        <div class="detail-value">${escapeHtml(teacher)}</div>
      </div>

      <div class="detail-item wide">
        <div class="detail-label">តម្លៃសិក្សា</div>
        <div class="detail-value">${escapeHtml(fee)}</div>
      </div>

      <div class="detail-item">
        <div class="detail-label">ថវិកា 80%</div>
        <div class="detail-value">${escapeHtml(b80)}</div>
      </div>

      <div class="detail-item">
        <div class="detail-label">ថវិកា 20%</div>
        <div class="detail-value">${escapeHtml(b20)}</div>
      </div>
    </div>
  `;

  setDetail("ព័ត៌មានលម្អិត (សិស្ស)", `សិស្ស៖ ${name}`, html);
}

// ---------- Data Loading ----------
async function loadAllData() {
  $("data-list").innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <div>កំពុងទាញទិន្នន័យ...</div>
    </div>
  `;

  try {
    const res = await fetch(SCRIPT_URL, { cache: "no-store" });
    globalData = await res.json();

    const teachers = Array.isArray(globalData.teachers) ? globalData.teachers : [];
    const students = Array.isArray(globalData.students) ? globalData.students : [];

    // Counts
    $("total-teachers").innerText = `${teachers.length} នាក់`;
    $("total-students").innerText = `${students.length} នាក់`;

    const femaleTeachers = teachers.reduce((c, t) => c + (isFemale(t) ? 1 : 0), 0);
    const femaleStudents = students.reduce((c, s) => c + (isFemale(s) ? 1 : 0), 0);
    $("female-teachers").innerText = `${femaleTeachers} នាក់`;
    $("female-students").innerText = `${femaleStudents} នាក់`;

    // Budget totals (from teachers)
    const total100 = teachers.reduce((sum, t) => sum + parseMoney(t["ថវិកាប្រមូលបាន"]), 0);
    const total80  = teachers.reduce((sum, t) => sum + parseMoney(t["ថវិកាគ្រូ 80%"]), 0);
    const total20  = teachers.reduce((sum, t) => sum + parseMoney(t["ថវិកាសាលា20%"]), 0);

    $("total-budget").innerText = formatRiel(total100);
    $("total-80").innerText = formatRiel(total80);
    $("total-20").innerText = formatRiel(total20);

    renderTeachers();
    showToast("ទាញទិន្នន័យរួចរាល់ ✅");
  } catch (err) {
    $("data-list").innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-wifi"></i>
        <div>ការតភ្ជាប់មានបញ្ហា!</div>
        <div style="margin-top:6px; font-size:12px;">សូមពិនិត្យអ៊ីនធឺណិត រឺ Script URL</div>
      </div>
    `;
  }
}

// ---------- Render ----------
function renderTeachers(filter = "") {
  currentView = "teachers";
  const container = $("data-list");

  const q = filter.trim().toLowerCase();
  const filtered = (globalData.teachers || []).filter(t =>
    (t["ឈ្មោះគ្រូ"] || "").toLowerCase().includes(q)
  );

  lastTeachersRendered = filtered;

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-magnifying-glass"></i>
        <div>រកមិនឃើញទិន្នន័យ</div>
        <div style="margin-top:6px; font-size:12px;">សូមសាកល្បងវាយពាក្យផ្សេង</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((t, idx) => `
    <div class="row" data-kind="teacher" data-index="${idx}">
      <div class="row-top">
        <div class="row-title">${escapeHtml(t["ឈ្មោះគ្រូ"] || "-")}</div>
        <div class="badge">${escapeHtml(t["ចំនួនសិស្ស"] || 0)} សិស្ស</div>
      </div>

      <div class="grid3">
        <div class="box">
          <small>១០០%</small>
          <b>${escapeHtml(t["ថវិកាប្រមូលបាន"] || "-")}</b>
        </div>
        <div class="box" style="border-color: rgba(52,211,153,.25); background: rgba(52,211,153,.06);">
          <small>៨០%</small>
          <b class="green">${escapeHtml(t["ថវិកាគ្រូ 80%"] || "-")}</b>
        </div>
        <div class="box" style="border-color: rgba(251,146,60,.25); background: rgba(251,146,60,.06);">
          <small>២០%</small>
          <b class="orange">${escapeHtml(t["ថវិកាសាលា20%"] || "-")}</b>
        </div>
      </div>
    </div>
  `).join("");

  bindRowClicks();
}

function renderStudents(filter = "") {
  currentView = "students";
  const container = $("data-list");

  const q = filter.trim().toLowerCase();
  const filtered = (globalData.students || []).filter(s =>
    (s["ឈ្មោះសិស្ស"] || "").toLowerCase().includes(q)
  );

  lastStudentsRendered = filtered;

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-magnifying-glass"></i>
        <div>រកមិនឃើញទិន្នន័យ</div>
        <div style="margin-top:6px; font-size:12px;">សូមសាកល្បងវាយពាក្យផ្សេង</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((s, idx) => `
    <div class="row" data-kind="student" data-index="${idx}" style="border-color: rgba(99,102,241,.20);">
      <div class="row-top">
        <div>
          <div class="row-title">${escapeHtml(s["ឈ្មោះសិស្ស"] || "-")}</div>
          <div class="row-sub">ថ្នាក់: ${escapeHtml(s["ថ្នាក់"] || "-")} | គ្រូ: ${escapeHtml(s["ឈ្មោះគ្រូ"] || "-")}</div>
        </div>
        <div style="text-align:right;">
          <div class="row-sub">សិក្សា</div>
          <div style="font-weight:900;">${escapeHtml(s["តម្លៃសិក្សា"] || "-")}</div>
        </div>
      </div>

      <div class="row-line">
        <div>គ្រូ ៨០%: <span class="green">${escapeHtml(s["ថវិកាគ្រូ 80%"] || "-")}</span></div>
        <div>សិស្ស ២០%: <span class="orange">${escapeHtml(s["ថវិកាសិស្ស 20%"] || "-")}</span></div>
      </div>
    </div>
  `).join("");

  bindRowClicks();
}

function bindRowClicks() {
  document.querySelectorAll("#data-list .row").forEach(row => {
    row.addEventListener("click", () => {
      const kind = row.getAttribute("data-kind");
      const idx = parseInt(row.getAttribute("data-index") || "0", 10);

      if (kind === "teacher") {
        const t = lastTeachersRendered[idx];
        if (t) openTeacherDetail(t);
      } else {
        const s = lastStudentsRendered[idx];
        if (s) openStudentDetail(s);
      }
    });
  });
}

// ---------- Events ----------
function handleSearch() {
  const q = $("search-input").value;
  currentView === "teachers" ? renderTeachers(q) : renderStudents(q);
}

function bindModalUI() {
  $("btn-close-modal").addEventListener("click", closeModal);
  $("modal-backdrop").addEventListener("click", closeModal);

  // ESC to close
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Swipe down to close (simple)
  const sheet = $("modal-sheet");
  let startY = 0;
  let dragging = false;

  sheet.addEventListener("touchstart", (e) => {
    if (!e.touches?.length) return;
    startY = e.touches[0].clientY;
    dragging = true;
  }, { passive: true });

  sheet.addEventListener("touchmove", (e) => {
    if (!dragging || !e.touches?.length) return;
    const y = e.touches[0].clientY;
    const dy = y - startY;
    if (dy > 0) {
      sheet.style.transform = `translateX(-50%) translateY(${dy}px)`;
      sheet.style.opacity = `${Math.max(0.65, 1 - dy / 350)}`;
    }
  }, { passive: true });

  sheet.addEventListener("touchend", (e) => {
    if (!dragging) return;
    dragging = false;

    const endY = e.changedTouches?.[0]?.clientY ?? startY;
    const dy = endY - startY;

    // threshold
    if (dy > 120) {
      sheet.style.transform = "";
      sheet.style.opacity = "";
      closeModal();
      return;
    }

    // restore
    sheet.style.transform = "";
    sheet.style.opacity = "";
  });
}

function bindUI() {
  $("nav-data").addEventListener("click", () => setActivePage("home"));
  $("nav-profile").addEventListener("click", () => setActivePage("profile"));

  $("tab-teachers").addEventListener("click", () => setTab("teachers", true));
  $("tab-students").addEventListener("click", () => setTab("students", true));

  $("search-input").addEventListener("input", handleSearch);
  $("btn-clear").addEventListener("click", () => {
    $("search-input").value = "";
    handleSearch();
    $("search-input").focus();
  });

  $("btn-refresh").addEventListener("click", () => loadAllData());

  bindModalUI();
}

window.addEventListener("load", () => {
  bindUI();
  loadAllData();
});
