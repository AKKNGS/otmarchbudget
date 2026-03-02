const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8egbJLZlZM7Nbv55r0uyMyRon8xE0kSl1logxqg8DJyuYBtNYG3KKGtty-0HMGZzObQ/exec";

let globalData = { teachers: [], students: [] };
let currentView = "teachers"; // teachers | students

// ---------- Helpers ----------
function $(id) { return document.getElementById(id); }

function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function parseMoney(val) {
  // គាំទ្រ "140,000 KHR", "70,000 ៛" ...
  const digits = String(val ?? "0").replace(/[^\d]/g, "");
  return parseInt(digits, 10) || 0;
}

function formatRiel(n) {
  return `${(n || 0).toLocaleString()} ៛`;
}

// ✅ ពីរូប Sheet របស់អ្នក៖ key ភេទ = "ភេទ" (Male/Female)
function isFemaleByGenderKey(obj) {
  const g = String(obj?.["ភេទ"] ?? "").trim().toLowerCase();
  return g === "female" || g === "f" || g.includes("ស្រី");
}

// ---------- Navigation ----------
function setActivePage(page) {
  // page: home | profile
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $(`${page}-page`).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const navBtn = page === "home" ? $("nav-data") : $("nav-profile");
  navBtn.classList.add("active");

  // ✅ តម្រូវការអ្នក: ចុច "ទិន្នន័យ" => បង្ហាញ Tab "គ្រូ" ជានិច្ច
  if (page === "home") {
    setTab("teachers", true);
  }
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
  if (forceRender) {
    type === "teachers" ? renderTeachers() : renderStudents();
  }
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

    // ✅ Counts
    $("total-teachers").innerText = `${teachers.length} នាក់`;
    $("total-students").innerText = `${students.length} នាក់`;

    const femaleTeachers = teachers.reduce((c, t) => c + (isFemaleByGenderKey(t) ? 1 : 0), 0);
    const femaleStudents = students.reduce((c, s) => c + (isFemaleByGenderKey(s) ? 1 : 0), 0);

    $("female-teachers").innerText = `${femaleTeachers} នាក់`;
    $("female-students").innerText = `${femaleStudents} នាក់`;

    // ✅ Budget totals (គិតពី Sheet Data/គ្រូ)
    const total100 = teachers.reduce((sum, t) => sum + parseMoney(t["ថវិកាប្រមូលបាន"]), 0);
    const total80  = teachers.reduce((sum, t) => sum + parseMoney(t["ថវិកាគ្រូ 80%"]), 0);
    const total20  = teachers.reduce((sum, t) => sum + parseMoney(t["ថវិកាសាលា20%"]), 0);

    $("total-budget").innerText = formatRiel(total100);
    $("total-80").innerText = formatRiel(total80);
    $("total-20").innerText = formatRiel(total20);

    // Default render teachers
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

  container.innerHTML = filtered.map(t => `
    <div class="row">
      <div class="row-top">
        <div class="row-title">${t["ឈ្មោះគ្រូ"] || "-"}</div>
        <div class="badge">${t["ចំនួនសិស្ស"] || 0} សិស្ស</div>
      </div>

      <div class="grid3">
        <div class="box">
          <small>១០០%</small>
          <b>${t["ថវិកាប្រមូលបាន"] || "-"}</b>
        </div>
        <div class="box" style="border-color: rgba(52,211,153,.25); background: rgba(52,211,153,.06);">
          <small>៨០%</small>
          <b class="green">${t["ថវិកាគ្រូ 80%"] || "-"}</b>
        </div>
        <div class="box" style="border-color: rgba(251,146,60,.25); background: rgba(251,146,60,.06);">
          <small>២០%</small>
          <b class="orange">${t["ថវិកាសាលា20%"] || "-"}</b>
        </div>
      </div>
    </div>
  `).join("");
}

function renderStudents(filter = "") {
  currentView = "students";
  const container = $("data-list");

  const q = filter.trim().toLowerCase();
  const filtered = (globalData.students || []).filter(s =>
    (s["ឈ្មោះសិស្ស"] || "").toLowerCase().includes(q)
  );

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

  container.innerHTML = filtered.map(s => `
    <div class="row" style="border-color: rgba(99,102,241,.20);">
      <div class="row-top">
        <div>
          <div class="row-title">${s["ឈ្មោះសិស្ស"] || "-"}</div>
          <div class="row-sub">ថ្នាក់: ${s["ថ្នាក់"] || "-"} | គ្រូ: ${s["ឈ្មោះគ្រូ"] || "-"}</div>
        </div>
        <div style="text-align:right;">
          <div class="row-sub">សិក្សា</div>
          <div style="font-weight:900;">${s["តម្លៃសិក្សា"] || "-"}</div>
        </div>
      </div>

      <div class="row-line">
        <div>គ្រូ ៨០%: <span class="green">${s["ថវិកាគ្រូ 80%"] || "-"}</span></div>
        <div>សិស្ស ២០%: <span class="orange">${s["ថវិកាសិស្ស 20%"] || "-"}</span></div>
      </div>
    </div>
  `).join("");
}

// ---------- Events ----------
function handleSearch() {
  const q = $("search-input").value;
  currentView === "teachers" ? renderTeachers(q) : renderStudents(q);
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
}

window.addEventListener("load", () => {
  bindUI();
  loadAllData();
});
