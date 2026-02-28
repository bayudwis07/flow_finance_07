const delete_a = "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tY";
const upload_a = "WNyb3Mvcy9BS2Z5Y2J4bkxTdnVCb1JjeUgyc";
const peler_a =
  "2s2NzhCZGFWbjQxZjRBeS15YUR6YjE0ZUZmMHZpUGV5b0N2SncteTM5YlJSY2FONVNtT0IvZXhlYw==";
const jangkrik_boss = atob(delete_a + upload_a + peler_a);

let currentUser = null;
let allTransactions = [];
let filteredTransactions = [];
let categories = [];
let budgets = [];
let notifications = [];
let trendChart = null;
let categoryChart = null;
let deleteCallback = null;
let currentPage = "dashboard";

// Init
lucide.createIcons();
initTheme();

document.addEventListener("DOMContentLoaded", () => {
  loadNotifications();
  const storedUser = localStorage.getItem("finance_user");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    showAppUI();
    fetchTransactions();
  } else {
    document.getElementById("login-screen").classList.remove("opacity-0");
  }
});

/* --- NOTIFICATION SYSTEM (DYNAMIC) --- */
function loadNotifications() {
  notifications = JSON.parse(localStorage.getItem("finance_notifs") || "[]");
  renderNotifications();
}

function addNotification(title, message, type = "info") {
  const newNotif = {
    id: Date.now(),
    title,
    message,
    type,
    time: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNotif); // Masukkan ke paling atas
  if (notifications.length > 30) notifications.pop(); // Batasi max 30
  localStorage.setItem("finance_notifs", JSON.stringify(notifications));
  renderNotifications();
}

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j yang lalu`;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function renderNotifications() {
  const listContainer = document.getElementById("notification-list");
  const dot = document.getElementById("notif-dot");
  const badge = document.getElementById("notif-badge");

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Update Unread Badges
  if (unreadCount > 0) {
    dot.classList.remove("hidden");
    badge.textContent = `${unreadCount} Baru`;
    badge.classList.remove("hidden");
  } else {
    dot.classList.add("hidden");
    badge.classList.add("hidden");
  }

  // Generate HTML list
  if (notifications.length === 0) {
    listContainer.innerHTML = `<div class="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">Tidak ada notifikasi</div>`;
    return;
  }

  listContainer.innerHTML = notifications
    .map((n) => {
      let iconColor = "text-blue-500";
      if (n.type === "success") iconColor = "text-emerald-500";
      if (n.type === "warning") iconColor = "text-orange-500";

      return `
              <div class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${n.read ? "opacity-60" : "bg-slate-50 dark:bg-slate-800/20"} cursor-default">
                  <div class="flex justify-between items-start mb-1">
                      <p class="text-xs text-slate-400 flex-1">${timeAgo(n.time)}</p>
                      <i data-lucide="circle" class="w-2.5 h-2.5 ${iconColor} fill-current"></i>
                  </div>
                  <p class="text-sm font-bold text-slate-800 dark:text-slate-200">${n.title}</p>
                  <p class="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">${n.message}</p>
              </div>`;
    })
    .join("");

  lucide.createIcons();
}

function toggleNotifications() {
  const menu = document.getElementById("notification-menu");
  menu.classList.toggle("hidden");

  // Jika menu dibuka, tandai semua notifikasi sudah terbaca (read = true)
  if (!menu.classList.contains("hidden")) {
    let updated = false;
    notifications = notifications.map((n) => {
      if (!n.read) {
        updated = true;
        return { ...n, read: true };
      }
      return n;
    });

    if (updated) {
      localStorage.setItem("finance_notifs", JSON.stringify(notifications));
      setTimeout(() => renderNotifications(), 1000); // Beri delay agar mata sempat melihat tanda baru sebelum pudar
    }
  }
}

/* --- THEME & UI EFFECTS --- */
function initTheme() {
  if (
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  updateChartColors();
}

function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
  localStorage.theme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  updateChartColors();
}

function getChartTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  return {
    color: isDark ? "#94a3b8" : "#64748b",
    grid: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
  };
}

function toggleSidebarDesktop() {
  const sb = document.getElementById("sidebar");
  sb.classList.toggle("sidebar-expanded");
  sb.classList.toggle("sidebar-collapsed");
}

function toggleSidebarMobile() {
  const sb = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sb.classList.contains("-translate-x-full")) {
    sb.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  } else {
    sb.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  }
}

// Command Palette Logic
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    toggleCommandPalette();
  }
  if (e.key === "Escape") {
    document.getElementById("command-palette").classList.add("hidden");
    document.getElementById("command-palette").classList.remove("flex");
  }
});
function toggleCommandPalette() {
  const p = document.getElementById("command-palette");
  if (p.classList.contains("hidden")) {
    p.classList.remove("hidden");
    p.classList.add("flex");
    setTimeout(() => document.getElementById("cmd-search").focus(), 100);
  } else {
    p.classList.add("hidden");
    p.classList.remove("flex");
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const icon = document.getElementById("toast-icon");
  document.getElementById("toast-message").textContent = message;

  toast.classList.remove("translate-y-10", "opacity-0");
  if (type === "error") {
    icon.setAttribute("data-lucide", "alert-circle");
    icon.classList.replace("text-emerald-400", "text-rose-400");
  } else {
    icon.setAttribute("data-lucide", "check-circle-2");
    icon.classList.replace("text-rose-400", "text-emerald-400");
  }
  lucide.createIcons();
  setTimeout(() => {
    toast.classList.add("translate-y-10", "opacity-0");
  }, 3000);
}

function showPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
  const target = document.getElementById(`page-${page}`);
  target.classList.remove("hidden");

  // Active states
  document.querySelectorAll('[id^="nav-"]').forEach((nav) => {
    nav.classList.remove(
      "bg-slate-100",
      "dark:bg-slate-800/50",
      "text-primary-600",
      "dark:text-primary-400",
    );
    const icon = nav.querySelector("svg") || nav.querySelector("i");
    if (icon) icon.classList.remove("text-primary-500");
  });
  const activeNav = document.getElementById(`nav-${page}`);
  if (activeNav) {
    activeNav.classList.add(
      "bg-slate-100",
      "dark:bg-slate-800/50",
      "text-primary-600",
      "dark:text-primary-400",
    );
    const activeIcon =
      activeNav.querySelector("svg") || activeNav.querySelector("i");
    if (activeIcon) activeIcon.classList.add("text-primary-500");
  }

  if (window.innerWidth < 1024) toggleSidebarMobile();

  currentPage = page;
  if (page === "dashboard") updateDashboard();
  if (page === "transactions") renderTransactions();
  if (page === "categories") renderCategories();
  if (page === "budget") renderBudgets();
  if (page === "analytics") updateAnalytics();
}

/* --- DATA LOGIC --- */
async function handleLoginSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById("login-email").value;
  const btn = document.getElementById("login-btn");
  const origText = btn.innerHTML;
  btn.innerHTML = `<div class="loader"></div>`;
  btn.disabled = true;

  try {
    const res = await fetch(
      `${jangkrik_boss}?action=login&email=${encodeURIComponent(emailInput)}`,
    );
    const result = await res.json();
    if (result.status === "success") {
      currentUser = result.data;
      localStorage.setItem("finance_user", JSON.stringify(currentUser));
      showAppUI();
      fetchTransactions();
      addNotification(
        "Login Berhasil",
        `Selamat datang kembali, ${currentUser.nama}!`,
        "success",
      );
    } else {
      showToast(result.message || "Email tidak ditemukan", "error");
    }
  } catch (err) {
    showToast("Koneksi gagal", "error");
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
}

function showAppUI() {
  document
    .getElementById("login-screen")
    .classList.add("opacity-0", "pointer-events-none");
  setTimeout(
    () => document.getElementById("login-screen").classList.add("hidden"),
    500,
  );
  const app = document.getElementById("app");
  app.classList.remove("hidden");
  setTimeout(() => app.classList.remove("opacity-0"), 50);

  document.getElementById("user-name").textContent = currentUser.nama;
  document.getElementById("user-role").textContent = currentUser.role;
  document.getElementById("user-avatar").textContent =
    currentUser.nama.charAt(0);
}

function logout() {
  localStorage.removeItem("finance_user");
  currentUser = null;
  document.getElementById("app").classList.add("opacity-0");
  setTimeout(() => {
    document.getElementById("app").classList.add("hidden");
    const login = document.getElementById("login-screen");
    login.classList.remove("hidden");
    setTimeout(
      () => login.classList.remove("opacity-0", "pointer-events-none"),
      50,
    );
  }, 500);
}

async function fetchTransactions() {
  const overlay = document.getElementById("loading-overlay");
  const container = document.getElementById("content-container");
  overlay.classList.remove("hidden");
  container.classList.add("hidden");

  try {
    const res = await fetch(jangkrik_boss + "?action=getTransaksi");
    const result = await res.json();
    let rawData = Array.isArray(result) ? result : result.data || [];
    if (rawData.length > 0 && String(rawData[0][0]).toLowerCase() === "id")
      rawData = rawData.slice(1);

    allTransactions = rawData
      .map((row) => ({
        __backendId: row[0],
        date: row[1],
        transactionType: row[2] === "pemasukan" ? "income" : "expense",
        category: row[3],
        description: row[4],
        amount: Number(row[5]) || 0,
        paymentMethod: row[6],
        user: row[7] || "Unknown",
      }))
      .filter((t) => t.__backendId);

    loadCategories();
    loadBudgets();
    applyFilters();
  } catch (error) {
    showToast("Gagal menyinkronkan data", "error");
  } finally {
    overlay.classList.add("hidden");
    container.classList.remove("hidden");
  }
}

function applyFilters() {
  // Identify inputs
  let dashStart = document.getElementById("filter-start")?.value;
  let dashEnd = document.getElementById("filter-end")?.value;

  let transStart = document.getElementById("trans-filter-start")?.value;
  let transEnd = document.getElementById("trans-filter-end")?.value;
  let transCat = document.getElementById("trans-filter-category")?.value || "";
  let transSearch =
    document.getElementById("trans-search")?.value.toLowerCase() || "";

  // Determine active dates based on current page context
  let activeStart = currentPage === "transactions" ? transStart : dashStart;
  let activeEnd = currentPage === "transactions" ? transEnd : dashEnd;

  // Sync Date values across views for consistency
  if (currentPage === "dashboard") {
    if (document.getElementById("trans-filter-start"))
      document.getElementById("trans-filter-start").value = activeStart || "";
    if (document.getElementById("trans-filter-end"))
      document.getElementById("trans-filter-end").value = activeEnd || "";
  } else if (currentPage === "transactions") {
    if (document.getElementById("filter-start"))
      document.getElementById("filter-start").value = activeStart || "";
    if (document.getElementById("filter-end"))
      document.getElementById("filter-end").value = activeEnd || "";
  }

  filteredTransactions = allTransactions.filter((t) => {
    const tDate = new Date(t.date).getTime();
    const sDate = activeStart ? new Date(activeStart).getTime() : 0;
    const eDate = activeEnd
      ? new Date(activeEnd).getTime() + 86400000
      : Infinity; // Include full end day

    const matchDate = tDate >= sDate && tDate <= eDate;
    const matchCat = transCat === "" || t.category === transCat;
    const matchSearch =
      transSearch === "" ||
      t.description.toLowerCase().includes(transSearch) ||
      t.category.toLowerCase().includes(transSearch) ||
      t.amount.toString().includes(transSearch);

    if (currentPage === "transactions")
      return matchDate && matchCat && matchSearch;
    return matchDate; // Dashboard only filters by date
  });

  renderTransactions();
  if (currentPage === "dashboard") updateDashboard();
  if (currentPage === "analytics") updateAnalytics();
}

function resetDateFilter() {
  if (document.getElementById("filter-start"))
    document.getElementById("filter-start").value = "";
  if (document.getElementById("filter-end"))
    document.getElementById("filter-end").value = "";
  if (document.getElementById("trans-filter-start"))
    document.getElementById("trans-filter-start").value = "";
  if (document.getElementById("trans-filter-end"))
    document.getElementById("trans-filter-end").value = "";
  if (document.getElementById("trans-filter-category"))
    document.getElementById("trans-filter-category").value = "";
  if (document.getElementById("trans-search"))
    document.getElementById("trans-search").value = "";
  applyFilters();
}

/* --- MODALS LOGIC --- */
function openTransactionModal(prefill = null) {
  const m = document.getElementById("modal-transaction");
  const form = document.getElementById("transaction-form");
  form.reset();
  document.getElementById("edit-id").value = "";
  document.getElementById("modal-trans-title").innerText = "Tambah Transaksi";

  if (prefill) {
    if (prefill.id) {
      document.getElementById("edit-id").value = prefill.id;
      document.getElementById("modal-trans-title").innerText = "Edit Transaksi";
    }
    try {
      document.getElementById("trans-date").value = new Date(prefill.date)
        .toISOString()
        .split("T")[0];
    } catch (e) {}
    document.getElementById("trans-description").value = prefill.description;
    document.getElementById("trans-amount").value = prefill.amount;
    document.getElementById("trans-payment").value = prefill.paymentMethod;
    document.getElementById("trans-category").value = prefill.category;
    document.querySelector(
      `input[name="trans-type"][value="${prefill.transactionType}"]`,
    ).checked = true;
  } else {
    document.getElementById("trans-date").value = new Date()
      .toISOString()
      .split("T")[0];
    document.querySelector(
      'input[name="trans-type"][value="expense"]',
    ).checked = true;
  }

  m.classList.remove("hidden");
  m.classList.add("flex");
  setTimeout(() => m.classList.remove("opacity-0"), 10);
}

function closeTransactionModal() {
  const m = document.getElementById("modal-transaction");
  m.classList.add("opacity-0");
  setTimeout(() => {
    m.classList.add("hidden");
    m.classList.remove("flex");
  }, 300);
}

async function handleTransactionSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("submit-btn");
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<div class="loader"></div>`;

  const editId = document.getElementById("edit-id").value;
  const payload = {
    action: "tambahTransaksi",
    id: editId || crypto.randomUUID(),
    tanggal: document.getElementById("trans-date").value,
    tipe:
      document.querySelector('input[name="trans-type"]:checked').value ===
      "income"
        ? "pemasukan"
        : "pengeluaran",
    kategori: document.getElementById("trans-category").value,
    deskripsi: document.getElementById("trans-description").value,
    jumlah: parseFloat(document.getElementById("trans-amount").value),
    metode: document.getElementById("trans-payment").value,
    user: currentUser.nama,
  };

  try {
    if (editId) {
      await fetch(jangkrik_boss, {
        method: "POST",
        body: JSON.stringify({ action: "deleteTransaksi", id: editId }),
        mode: "no-cors",
      });
      await new Promise((r) => setTimeout(r, 600));
    }
    await fetch(jangkrik_boss, {
      method: "POST",
      body: JSON.stringify(payload),
      mode: "no-cors",
    });
    showToast("Berhasil disimpan!");
    closeTransactionModal();
    addNotification(
      editId ? "Transaksi Diperbarui" : "Transaksi Disimpan",
      `Transaksi senilai ${formatCurrency(payload.jumlah)} berhasil dicatat di sistem.`,
      "success",
    );
    await fetchTransactions();
  } catch (err) {
    showToast("Gagal menyimpan", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

function editTransaction(id) {
  openTransactionModal(allTransactions.find((t) => t.__backendId === id));
}
function duplicateTransaction(id) {
  const data = { ...allTransactions.find((t) => t.__backendId === id) };
  delete data.__backendId;
  delete data.id; // ensure new ID
  openTransactionModal(data);
}

function deleteTransaction(id) {
  deleteCallback = async () => {
    try {
      await fetch(jangkrik_boss, {
        method: "POST",
        body: JSON.stringify({ action: "deleteTransaksi", id }),
        mode: "no-cors",
      });
      showToast("Data dihapus!");
      addNotification(
        "Transaksi Dihapus",
        "Satu riwayat transaksi telah dihapus secara permanen.",
        "info",
      );
      await fetchTransactions();
    } catch (err) {
      showToast("Error penghapusan", "error");
    }
  };
  document.querySelector("#delete-modal h3").textContent = "Hapus Data?";
  document.querySelector("#delete-modal p").textContent =
    "Aksi ini tidak bisa dibatalkan dan data akan dihapus permanen dari sistem.";
  document.getElementById("delete-modal").classList.remove("hidden");
  document.getElementById("delete-modal").classList.add("flex");
}

function hideDeleteModal() {
  document.getElementById("delete-modal").classList.add("hidden");
  document.getElementById("delete-modal").classList.remove("flex");
  deleteCallback = null;
}

document
  .getElementById("confirm-delete-btn")
  .addEventListener("click", async () => {
    if (deleteCallback) {
      const btn = document.getElementById("confirm-delete-btn");
      const old = btn.innerHTML;
      btn.innerHTML = `<div class="loader"></div>`;
      btn.disabled = true;
      await deleteCallback();
      btn.innerHTML = old;
      btn.disabled = false;
      hideDeleteModal();
    }
  });

/* --- CATEGORIES & BUDGET --- */
function loadCategories() {
  const local = JSON.parse(
    localStorage.getItem("finance_categories") ||
      '["Makanan", "Transportasi", "Gaji", "Tagihan", "Hiburan"]',
  );
  const sheets = [...new Set(allTransactions.map((t) => t.category))].filter(
    Boolean,
  );
  categories = [...new Set([...local, ...sheets])].map((c) => ({
    category: c,
  }));

  // Populate Transaction Modal Category
  const selectCat = document.getElementById("trans-category");
  if (selectCat)
    selectCat.innerHTML =
      '<option value="">Pilih Kategori</option>' +
      categories
        .map((c) => `<option value="${c.category}">${c.category}</option>`)
        .join("");

  // Populate Transaction Filter Category
  const filterCat = document.getElementById("trans-filter-category");
  if (filterCat) {
    const currentVal = filterCat.value;
    filterCat.innerHTML =
      '<option value="">Semua Kategori</option>' +
      categories
        .map((c) => `<option value="${c.category}">${c.category}</option>`)
        .join("");
    filterCat.value = currentVal; // Restore selection
  }

  if (currentPage === "categories") renderCategories();
}

function openCategoryModal(oldName = "") {
  const m = document.getElementById("modal-category");
  const title = document.getElementById("modal-category-title");
  const input = document.getElementById("category-name");
  const oldInput = document.getElementById("edit-category-old");

  oldInput.value = oldName;
  input.value = oldName;
  title.textContent = oldName ? "Edit Kategori" : "Kategori Baru";

  m.classList.remove("hidden");
  m.classList.add("flex");
}

function closeCategoryModal() {
  document.getElementById("modal-category").classList.add("hidden");
  document.getElementById("modal-category").classList.remove("flex");
}

function handleCategorySubmit(e) {
  e.preventDefault();
  const newCat = document.getElementById("category-name").value.trim();
  const oldCat = document.getElementById("edit-category-old").value;

  if (newCat) {
    let local = JSON.parse(localStorage.getItem("finance_categories") || "[]");

    if (oldCat) {
      const idx = local.indexOf(oldCat);
      if (idx !== -1) local[idx] = newCat;
      else local.push(newCat);

      budgets.forEach((b) => {
        if (b.category === oldCat) b.category = newCat;
      });
      localStorage.setItem("finance_budgets", JSON.stringify(budgets));

      // Update local transactions (Ideally also sync to backend if needed)
      allTransactions.forEach((t) => {
        if (t.category === oldCat) t.category = newCat;
      });

      showToast("Kategori berhasil diedit!");
    } else {
      if (!local.includes(newCat)) local.push(newCat);
      showToast("Kategori dibuat!");
    }

    localStorage.setItem("finance_categories", JSON.stringify(local));
    loadCategories();
    closeCategoryModal();
    applyFilters(); // Re-render everything
  }
}

function confirmDeleteCategory(catName) {
  deleteCallback = () => {
    let local = JSON.parse(localStorage.getItem("finance_categories") || "[]");
    local = local.filter((c) => c !== catName);
    localStorage.setItem("finance_categories", JSON.stringify(local));

    budgets = budgets.filter((b) => b.category !== catName);
    localStorage.setItem("finance_budgets", JSON.stringify(budgets));

    loadCategories();
    showToast("Kategori dihapus!");
    hideDeleteModal();
    if (currentPage === "budget") renderBudgets();
  };
  document.querySelector("#delete-modal h3").textContent = "Hapus Kategori?";
  document.querySelector("#delete-modal p").textContent =
    `Kategori "${catName}" akan dihapus. Riwayat transaksi dengan kategori ini tetap ada, namun labelnya mungkin hilang saat Anda mengubah datanya nanti.`;
  document.getElementById("delete-modal").classList.remove("hidden");
  document.getElementById("delete-modal").classList.add("flex");
}

function loadBudgets() {
  budgets = JSON.parse(localStorage.getItem("finance_budgets") || "[]");
  if (currentPage === "budget") renderBudgets();
  else checkBudgetWarnings(); // Cek peringatan di background
}

function openBudgetModal(prefillCat = null, prefillLimit = null) {
  const m = document.getElementById("modal-budget");
  const select = document.getElementById("budget-category");
  select.innerHTML =
    '<option value="">Pilih kategori...</option>' +
    categories
      .map((c) => `<option value="${c.category}">${c.category}</option>`)
      .join("");

  if (prefillCat) {
    select.value = prefillCat;
    document.getElementById("budget-limit").value = prefillLimit;
  } else {
    select.value = "";
    document.getElementById("budget-limit").value = "";
  }

  m.classList.remove("hidden");
  m.classList.add("flex");
}

function closeBudgetModal() {
  const m = document.getElementById("modal-budget");
  m.classList.add("hidden");
  m.classList.remove("flex");
}

function handleBudgetSubmit(e) {
  e.preventDefault();
  const cat = document.getElementById("budget-category").value;
  const limit = parseFloat(document.getElementById("budget-limit").value);
  if (!cat || !limit) return;

  let existing = budgets.find((b) => b.category === cat);
  if (existing) existing.limit = limit;
  else budgets.push({ category: cat, limit: limit });

  localStorage.setItem("finance_budgets", JSON.stringify(budgets));
  closeBudgetModal();
  showToast("Anggaran disimpan!");
  renderBudgets();
}

function deleteBudget(cat) {
  budgets = budgets.filter((b) => b.category !== cat);
  localStorage.setItem("finance_budgets", JSON.stringify(budgets));
  showToast("Anggaran dihapus");
  renderBudgets();
}

// Check for Budget exceedings to trigger Notification
function checkBudgetWarnings() {
  const monthKey = new Date().toISOString().slice(0, 7);
  let warned = JSON.parse(
    localStorage.getItem("finance_warned_budgets") || "{}",
  );
  if (warned.month !== monthKey) warned = { month: monthKey, categories: {} };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const expensesByCategory = {};
  allTransactions.forEach((t) => {
    const d = new Date(t.date);
    if (
      !isNaN(d) &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear &&
      t.transactionType === "expense"
    ) {
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + t.amount;
    }
  });

  budgets.forEach((b) => {
    const spent = expensesByCategory[b.category] || 0;
    const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;

    if (percentage >= 100 && warned.categories[b.category] !== "100") {
      addNotification(
        "Awas! Anggaran Habis",
        `Pengeluaran ${b.category} bulan ini mencapai batas anggaran (${formatCurrency(spent)}).`,
        "warning",
      );
      warned.categories[b.category] = "100";
    } else if (
      percentage >= 80 &&
      percentage < 100 &&
      warned.categories[b.category] !== "80" &&
      warned.categories[b.category] !== "100"
    ) {
      addNotification(
        "Peringatan Anggaran",
        `Pengeluaran ${b.category} hampir habis (terpakai ${Math.round(percentage)}%).`,
        "warning",
      );
      warned.categories[b.category] = "80";
    }
  });

  localStorage.setItem("finance_warned_budgets", JSON.stringify(warned));
}

function renderBudgets() {
  checkBudgetWarnings(); // Selalu validasi
  const grid = document.getElementById("budget-grid");
  if (budgets.length === 0) {
    grid.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                <i data-lucide="target" class="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600"></i>
                <p>Belum ada anggaran yang diatur.</p>
            </div>`;
    lucide.createIcons();
    return;
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const expensesByCategory = {};
  allTransactions.forEach((t) => {
    const d = new Date(t.date);
    if (
      !isNaN(d) &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear &&
      t.transactionType === "expense"
    ) {
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + t.amount;
    }
  });

  grid.innerHTML = budgets
    .map((b) => {
      const spent = expensesByCategory[b.category] || 0;
      const limit = b.limit;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const clampedPct = Math.min(percentage, 100);

      let color = "bg-primary-500";
      let textCol = "text-primary-600 dark:text-primary-400";
      let bgCol = "bg-primary-100 dark:bg-primary-500/20";
      if (percentage >= 100) {
        color = "bg-rose-500";
        textCol = "text-rose-600 dark:text-rose-400";
        bgCol = "bg-rose-100 dark:bg-rose-500/20";
      } else if (percentage >= 80) {
        color = "bg-orange-500";
        textCol = "text-orange-600 dark:text-orange-400";
        bgCol = "bg-orange-100 dark:bg-orange-500/20";
      } else if (percentage < 50) {
        color = "bg-emerald-500";
        textCol = "text-emerald-600 dark:text-emerald-400";
        bgCol = "bg-emerald-100 dark:bg-emerald-500/20";
      }

      // Clean category name for HTML attributes
      const cleanCatName = b.category.replace(/'/g, "\\'");

      return `
            <div class="glass-card rounded-2xl p-6 group relative hover:shadow-md transition-all">
                <div class="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="openBudgetModal('${cleanCatName}', ${b.limit})" class="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-lg shadow-sm" title="Edit"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="deleteBudget('${cleanCatName}')" class="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg shadow-sm" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
                <div class="flex justify-between items-center mb-4 pr-16">
                    <div class="flex items-center gap-3 w-full">
                        <div class="w-10 h-10 rounded-xl ${bgCol} ${textCol} flex items-center justify-center font-bold text-lg uppercase shadow-sm shrink-0">${b.category.charAt(0)}</div>
                        <span class="font-semibold text-slate-900 dark:text-white truncate" title="${b.category}">${b.category}</span>
                    </div>
                    <span class="text-xs font-bold ${textCol} bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md ml-2">${percentage}%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-3 overflow-hidden">
                    <div class="${color} h-2.5 rounded-full transition-all duration-1000" style="width: ${clampedPct}%"></div>
                </div>
                <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>${formatCurrency(spent)} terpakai</span>
                    <span>Batas: ${formatCurrency(limit)}</span>
                </div>
            </div>`;
    })
    .join("");
  lucide.createIcons();
}

/* --- RENDERING UI --- */
const formatCurrency = (amt) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amt);
const displayDate = (d) => {
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return d;
  }
};

function renderTransactions() {
  const tbody = document.getElementById("transactions-table");
  if (filteredTransactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-12 text-slate-400">Belum ada data transaksi yang cocok dengan filter.</td></tr>`;
    return;
  }
  tbody.innerHTML = filteredTransactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(
      (t) => `
          <tr class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">${displayDate(t.date)}</td>
            <td class="px-6 py-4"><span class="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">${t.category}</span></td>
            <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">${t.description}</td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${t.transactionType === "income" ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" : "text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400"}">
                <span class="w-1.5 h-1.5 rounded-full ${t.transactionType === "income" ? "bg-emerald-500" : "bg-rose-500"}"></span>
                ${t.transactionType.charAt(0).toUpperCase() + t.transactionType.slice(1)}
              </span>
            </td>
            <td class="px-6 py-4 text-sm font-semibold text-right whitespace-nowrap ${t.transactionType === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}">
              ${t.transactionType === "income" ? "+" : "-"}${formatCurrency(t.amount)}
            </td>
            <td class="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
               <div class="flex items-center gap-1.5"><i data-lucide="credit-card" class="w-3 h-3"></i>${t.paymentMethod}</div>
            </td>
            <td class="px-6 py-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="flex items-center justify-center gap-1">
                <button onclick="editTransaction('${t.__backendId}')" class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors" title="Edit"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                <button onclick="duplicateTransaction('${t.__backendId}')" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors" title="Gandakan"><i data-lucide="copy" class="w-4 h-4"></i></button>
                <button onclick="deleteTransaction('${t.__backendId}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
              </div>
            </td>
          </tr>`,
    )
    .join("");
  lucide.createIcons();
}

function renderCategories() {
  const grid = document.getElementById("categories-grid");
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
  ];
  grid.innerHTML = categories
    .map((c, i) => {
      const count = allTransactions.filter(
        (t) => t.category === c.category,
      ).length;
      const bg = colors[i % colors.length];
      const cleanCatName = c.category.replace(/'/g, "\\'");

      return `
          <div class="glass-card p-5 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all relative">
             <div class="flex items-center gap-4 w-full pr-16">
                <div class="w-10 h-10 rounded-xl ${bg} flex items-center justify-center text-white shadow-sm shrink-0">
                   <span class="font-bold">${c.category.charAt(0)}</span>
                </div>
                <div class="truncate w-full">
                   <h4 class="font-semibold text-slate-900 dark:text-white truncate" title="${c.category}">${c.category}</h4>
                   <p class="text-xs text-slate-500 dark:text-slate-400">${count} transaksi</p>
                </div>
             </div>
             <div class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="openCategoryModal('${cleanCatName}')" class="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-lg shadow-sm" title="Edit"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                <button onclick="confirmDeleteCategory('${cleanCatName}')" class="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg shadow-sm" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
             </div>
          </div>`;
    })
    .join("");
  lucide.createIcons();
}

function updateDashboard() {
  const income = filteredTransactions
    .filter((t) => t.transactionType === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = filteredTransactions
    .filter((t) => t.transactionType === "expense")
    .reduce((s, t) => s + t.amount, 0);

  document.getElementById("total-balance").textContent = formatCurrency(
    income - expenses,
  );
  document.getElementById("total-income").textContent = formatCurrency(income);
  document.getElementById("total-expenses").textContent =
    formatCurrency(expenses);
  document.getElementById("total-savings").textContent = formatCurrency(
    income - expenses,
  );

  // Update tooltips for full numbers
  document.getElementById("total-balance").title = formatCurrency(
    income - expenses,
  );
  document.getElementById("total-income").title = formatCurrency(income);
  document.getElementById("total-expenses").title = formatCurrency(expenses);
  document.getElementById("total-savings").title = formatCurrency(
    income - expenses,
  );

  updateCharts();
}

function updateAnalytics() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  // Using filteredTransactions here so if user sets date globally, analytics updates relative to it.
  // Let's rely on standard month unless global filter shrinks it
  const activeTransactions = filteredTransactions.filter((t) => {
    const d = new Date(t.date);
    return (
      !isNaN(d) &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  });

  let income = 0;
  let expense = 0;
  const expensesByCategory = {};
  activeTransactions.forEach((t) => {
    if (t.transactionType === "income") income += t.amount;
    else {
      expense += t.amount;
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + t.amount;
    }
  });
  const net = income - expense;
  let topCategory = "-";
  let maxExpense = 0;
  for (const [cat, amt] of Object.entries(expensesByCategory)) {
    if (amt > maxExpense) {
      maxExpense = amt;
      topCategory = cat;
    }
  }

  if (document.getElementById("analytics-income")) {
    document.getElementById("analytics-income").textContent =
      formatCurrency(income);
    document.getElementById("analytics-expense").textContent =
      formatCurrency(expense);
    document.getElementById("analytics-net").textContent = formatCurrency(net);
    document.getElementById("analytics-top-category").textContent =
      topCategory !== "-" ? topCategory : "Belum ada";

    document.getElementById("analytics-income").title = formatCurrency(income);
    document.getElementById("analytics-expense").title =
      formatCurrency(expense);
    document.getElementById("analytics-net").title = formatCurrency(net);
    document.getElementById("analytics-top-category").title = topCategory;
  }

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  let insightText = `Sepanjang bulan <strong>${monthNames[currentMonth]} ${currentYear}</strong>, total pemasukan Anda adalah ${formatCurrency(income)} dan pengeluaran ${formatCurrency(expense)}. `;
  if (net > 0)
    insightText += `Kerja bagus! Anda berhasil menabung sebesar <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(net)}</span> bulan ini. `;
  else if (net < 0)
    insightText += `Hati-hati, pengeluaran Anda melebihi pemasukan (Defisit <span class="font-bold text-rose-600 dark:text-rose-400">${formatCurrency(Math.abs(net))}</span>). `;
  if (topCategory !== "-")
    insightText += `<br><br>Porsi terbesar dari pengeluaran Anda dialokasikan untuk kategori <span class="font-bold text-orange-600 dark:text-orange-400">${topCategory}</span> sebanyak ${formatCurrency(maxExpense)}. `;
  if (activeTransactions.length === 0)
    insightText = `Belum ada data transaksi yang tercatat untuk bulan ini berdasarkan filter yang aktif.`;

  if (document.getElementById("analytics-insight-text"))
    document.getElementById("analytics-insight-text").innerHTML = insightText;
}

function updateChartColors() {
  if (currentPage === "dashboard") updateCharts();
}

function updateCharts() {
  const t = getChartTheme();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ags",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const incomeData = new Array(12).fill(0);
  const expenseData = new Array(12).fill(0);
  const expensesByCategory = {};

  filteredTransactions.forEach((tx) => {
    const m = new Date(tx.date).getMonth();
    if (!isNaN(m)) {
      if (tx.transactionType === "income") incomeData[m] += tx.amount;
      else {
        expenseData[m] += tx.amount;
        expensesByCategory[tx.category] =
          (expensesByCategory[tx.category] || 0) + tx.amount;
      }
    }
  });

  Chart.defaults.color = t.color;
  Chart.defaults.font.family = '"DM Sans", sans-serif';

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(
    document.getElementById("trendChart").getContext("2d"),
    {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Pemasukan",
            data: incomeData,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
          },
          {
            label: "Pengeluaran",
            data: expenseData,
            borderColor: "#f43f5e",
            backgroundColor: "rgba(244, 63, 94, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: { usePointStyle: true, boxWidth: 6 },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: t.grid },
            beginAtZero: true,
            border: { display: false },
          },
        },
      },
    },
  );

  if (categoryChart) categoryChart.destroy();
  const catLabels = Object.keys(expensesByCategory);
  categoryChart = new Chart(
    document.getElementById("categoryChart").getContext("2d"),
    {
      type: "doughnut",
      data: {
        labels: catLabels.length ? catLabels : ["Kosong"],
        datasets: [
          {
            data: catLabels.length ? Object.values(expensesByCategory) : [1],
            backgroundColor: [
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#ec4899",
              "#14b8a6",
            ],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true, padding: 20 },
          },
        },
      },
    },
  );
}

/* --- EXPORT --- */
function exportCSV() {
  if (filteredTransactions.length === 0)
    return showToast("Tidak ada data", "error");
  const headers = [
    "ID",
    "Tanggal",
    "Tipe",
    "Kategori",
    "Deskripsi",
    "Jumlah",
    "Metode",
    "User",
  ];
  const rows = filteredTransactions.map((t) => [
    t.__backendId,
    displayDate(t.date),
    t.transactionType,
    t.category,
    `"${t.description}"`,
    t.amount,
    t.paymentMethod,
    t.user,
  ]);
  let csvContent =
    "data:text/csv;charset=utf-8," +
    headers.join(",") +
    "\n" +
    rows.map((e) => e.join(",")).join("\n");
  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = `Ekspor_Keuangan_${Date.now()}.csv`;
  link.click();
}
function exportPDF() {
  if (filteredTransactions.length === 0)
    return showToast("Tidak ada data", "error");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.text("Laporan Keuangan", 14, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Dibuat: ${new Date().toLocaleDateString("id-ID")}`, 14, 22);
  const rows = filteredTransactions.map((t) => [
    displayDate(t.date),
    t.category,
    t.description,
    t.transactionType === "income" ? "Pemasukan" : "Pengeluaran",
    formatCurrency(t.amount),
    t.paymentMethod,
  ]);
  doc.autoTable({
    head: [["Tanggal", "Kategori", "Deskripsi", "Tipe", "Jumlah", "Metode"]],
    body: rows,
    startY: 28,
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
    didDrawPage: function (data) {
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        "© BAYU DWI SUHARMINTO | IG: bayudwis_07",
        doc.internal.pageSize.width / 2,
        pageHeight - 5,
        { align: "center" },
      );
    },
  });
  doc.save(`Laporan_${Date.now()}.pdf`);
}
