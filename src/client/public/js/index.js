"use strict";

let _pendingCategoryId = null;
let _initialMonthSynced = false;

function getDefaultDate() {
  return (
    localStorage.getItem("lastTransactionDate") ||
    new Date().toISOString().split("T")[0]
  );
}

function syncMonthFilter(dateStr) {
  const month = parseInt(dateStr.split("-")[1], 10);
  const monthFilter = document.getElementById("month-filter");
  if (!monthFilter) return;
  if (parseInt(monthFilter.value, 10) !== month) {
    monthFilter.value = String(month);
    applyFilters();
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("is-open");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("is-open");
}

function applyStatsFilters() {
  const form = document.getElementById("statistics-filters");
  if (!form) return;
  const params = new URLSearchParams(new FormData(form));
  htmx.ajax("GET", `/api/renderStatistics?${params}`, {
    target: "#statistics-container",
    swap: "innerHTML",
  });
}

function resetPlanningForm() {
  const form = document.getElementById("planning-form");
  const submitBtn = document.getElementById("planning-submit-btn");
  const deleteBtn = document.getElementById("planning-delete-btn");

  if (!form) return;

  if (form.hasAttribute("hx-put")) {
    form.removeAttribute("hx-put");
    form.setAttribute("hx-post", "/api/transaction-planning");
    htmx.process(form);
  }

  if (submitBtn) submitBtn.textContent = "Создать";
  if (deleteBtn) deleteBtn.style.display = "none";
}

function resetTransactionForm() {
  const form = document.getElementById("transaction-form");
  const submitBtn = document.getElementById("transaction-submit-btn");

  if (!form) return;

  if (form.hasAttribute("hx-put")) {
    form.removeAttribute("hx-put");
    form.setAttribute("hx-post", "/api/transaction");
    htmx.process(form);
  }

  if (submitBtn) submitBtn.textContent = "Создать";
}

document.addEventListener("htmx:afterSwap", (e) => {
  if (e.detail.target.id === "category-select" && _pendingCategoryId) {
    e.detail.target.value = _pendingCategoryId;
    _pendingCategoryId = null;
  }

  if (e.detail.target.id === "transactions-container" && !_initialMonthSynced) {
    _initialMonthSynced = true;
    const savedDate = localStorage.getItem("lastTransactionDate");
    if (savedDate) syncMonthFilter(savedDate);
  }

  if (
    e.detail.target.closest &&
    e.detail.target.closest("#transaction-modal")
  ) {
    setupAmountValidation();
  }
});

function applyFilters() {
  const form = document.getElementById("transaction-filters");
  if (!form) return;
  const params = new URLSearchParams(new FormData(form));
  htmx.ajax("GET", `/api/renderTransactions?${params}`, {
    target: "#transactions-container",
    swap: "innerHTML",
  });
}

document.addEventListener("click", (e) => {
  // Open modal
  const openBtn = e.target.closest("[data-open-modal]");
  if (openBtn) {
    const modal = openBtn.dataset.openModal;
    const type = openBtn.dataset.type;

    if (modal === "transaction") {
      const editId = openBtn.dataset.editId;
      const typeSelect = document.getElementById("type-select");

      if (editId) {
        const form = document.getElementById("transaction-form");
        const submitBtn = document.getElementById("transaction-submit-btn");

        if (typeSelect) {
          typeSelect.value = openBtn.dataset.editType;
          _pendingCategoryId = openBtn.dataset.editCategory;
          typeSelect.dispatchEvent(new Event("change"));
        }

        if (form) {
          const dateInput = form.querySelector('[name="date"]');
          const amountInput = form.querySelector('[name="amount"]');
          const noteInput = form.querySelector('[name="note"]');
          if (dateInput) dateInput.value = openBtn.dataset.editDate;
          if (amountInput) amountInput.value = openBtn.dataset.editAmount;
          if (noteInput) noteInput.value = openBtn.dataset.editNote || "";

          form.removeAttribute("hx-post");
          form.setAttribute("hx-put", `/api/transaction/${editId}`);
          htmx.process(form);
        }
        if (submitBtn) submitBtn.textContent = "Сохранить";
      } else {
        if (typeSelect && type) {
          typeSelect.value = type;
          typeSelect.dispatchEvent(new Event("change"));
        }
        const form = document.getElementById("transaction-form");
        if (form) {
          const dateInput = form.querySelector('[name="date"]');
          if (dateInput) dateInput.value = getDefaultDate();
        }
      }
      openModal("transaction-modal");
    } else if (modal === "planning") {
      const planningId   = openBtn.dataset.planningId;
      const categoryId   = openBtn.dataset.categoryId;
      const categoryName = openBtn.dataset.categoryName;
      const amount       = openBtn.dataset.planningAmount;
      const note         = openBtn.dataset.planningNote;
      const month        = openBtn.dataset.planningMonth;
      const year         = openBtn.dataset.planningYear;

      const form        = document.getElementById("planning-form");
      const submitBtn   = document.getElementById("planning-submit-btn");
      const deleteBtn   = document.getElementById("planning-delete-btn");
      const titleEl     = document.getElementById("planning-modal-title");
      const categoryEl  = document.getElementById("planning-category-display");

      if (categoryEl)   categoryEl.textContent = categoryName || "";
      if (form) {
        form.querySelector('[name="categoryId"]').value = categoryId || "";
        form.querySelector('[name="month"]').value      = month || "";
        form.querySelector('[name="year"]').value       = year || "";
        form.querySelector('[name="note"]').value       = note || "";
        form.querySelector('[name="amount"]').value     = planningId ? (amount || "") : "";
      }

      if (planningId) {
        if (titleEl)    titleEl.textContent = "Редактировать план";
        if (submitBtn)  submitBtn.textContent = "Сохранить";
        if (form) {
          form.removeAttribute("hx-post");
          form.setAttribute("hx-put", `/api/transaction-planning/${planningId}`);
          htmx.process(form);
        }
        if (deleteBtn) {
          deleteBtn.style.display = "block";
          deleteBtn.setAttribute("hx-delete", `/api/transaction-planning/${planningId}`);
          htmx.process(deleteBtn);
        }
      } else {
        if (titleEl)    titleEl.textContent = "Создать план";
        if (submitBtn)  submitBtn.textContent = "Создать";
        if (form) {
          form.removeAttribute("hx-put");
          form.setAttribute("hx-post", "/api/transaction-planning");
          htmx.process(form);
        }
        if (deleteBtn)  deleteBtn.style.display = "none";
      }
      openModal("planning-modal");
    } else if (modal === "category") {
      const typeSelect = document.getElementById("type-select");
      const categoryTypeSelect = document.getElementById(
        "category-type-select",
      );
      if (typeSelect && categoryTypeSelect) {
        categoryTypeSelect.value = typeSelect.value;
      }
      openModal("category-modal");
    } else if (modal === "changePassword") {
      openModal("change-password-modal");
    } else if (modal === "deleteAccount") {
      openModal("delete-account-modal");
    }
    return;
  }

  // Close modal (× button)
  if (e.target.closest("[data-close-modal]")) {
    const modal = e.target.closest(".modal-overlay");
    if (modal) {
      modal.classList.remove("is-open");
      if (modal.id === "transaction-modal") resetTransactionForm();
      if (modal.id === "planning-modal") resetPlanningForm();
    }
    return;
  }

  // Close modal (backdrop click)
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("is-open");
    if (e.target.id === "transaction-modal") resetTransactionForm();
    if (e.target.id === "planning-modal") resetPlanningForm();
    return;
  }

  // Toggle expandable panels
  const toggleBtn = e.target.closest("[data-toggle]");
  if (toggleBtn) {
    const target = document.getElementById(toggleBtn.dataset.toggle);
    if (target) {
      target.style.display = target.style.display === "none" ? "block" : "none";
    }
    return;
  }

  // Apply category filter (main page)
  if (e.target.closest("[data-apply-categories]")) {
    const panel = document.getElementById("categories-panel");
    if (panel) panel.style.display = "none";
    applyFilters();
    return;
  }

  // Apply category filter (statistics page)
  if (e.target.closest("[data-apply-stats-categories]")) {
    const panel = document.getElementById("stats-categories-panel");
    if (panel) panel.style.display = "none";
    applyStatsFilters();
    return;
  }

  // Reset all filters
  if (e.target.closest("[data-reset-filters]")) {
    const form = document.getElementById("transaction-filters");
    if (!form) return;
    const now = new Date();
    const yearSelect  = form.querySelector('[name="year"]');
    const monthSelect = form.querySelector('[name="month"]');
    if (yearSelect)  yearSelect.value  = String(now.getFullYear());
    if (monthSelect) monthSelect.value = String(now.getMonth() + 1);
    form.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));
    localStorage.removeItem("lastTransactionDate");
    applyFilters();
    return;
  }

  // Close categories panels on outside click
  if (!e.target.closest(".filter-group-categories")) {
    const panel = document.getElementById("categories-panel");
    if (panel && panel.style.display !== "none") panel.style.display = "none";
    const statsPanel = document.getElementById("stats-categories-panel");
    if (statsPanel && statsPanel.style.display !== "none") statsPanel.style.display = "none";
  }
});

const AMOUNT_MAX = 99999999.99;
// up to 8 digits before decimal, up to 2 after
const AMOUNT_FORMAT = /^\d{0,8}(\.\d{0,2})?$/;

function setupAmountValidation() {
  const input = document.querySelector(
    '#transaction-form input[name="amount"]',
  );
  if (!input) return;

  // Clone to prevent duplicate listeners on repeated calls
  const fresh = input.cloneNode(true);
  input.replaceWith(fresh);

  let errorEl = fresh.parentElement.querySelector(".amount-error");
  if (!errorEl) {
    errorEl = document.createElement("span");
    errorEl.className = "amount-error field-error";
    errorEl.style.display = "none";
    fresh.parentElement.appendChild(errorEl);
  }

  let lastValid = "";

  fresh.addEventListener("input", () => {
    const val = fresh.value;
    const formatOk = AMOUNT_FORMAT.test(val);
    const num = parseFloat(val);
    const valueOk = !val || isNaN(num) || num <= AMOUNT_MAX;

    if (!formatOk || !valueOk) {
      fresh.value = lastValid;
      if (!valueOk) {
        errorEl.textContent = "Сумма не может превышать 99 999 999.99";
        errorEl.style.display = "block";
      }
      return;
    }

    lastValid = val;
    errorEl.style.display = "none";
  });
}

document.addEventListener("htmx:beforeRequest", (e) => {
  const elt = e.detail.elt;
  if (!elt || elt.id !== "transaction-form" || elt.hasAttribute("hx-put"))
    return;
  const dateInput = elt.querySelector('[name="date"]');
  if (dateInput && dateInput.value) {
    localStorage.setItem("lastTransactionDate", dateInput.value);
    syncMonthFilter(dateInput.value);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  setupAmountValidation();
  const savedDate = localStorage.getItem("lastTransactionDate");
  if (savedDate) {
    const dateInput = document.querySelector('#transaction-form [name="date"]');
    if (dateInput) dateInput.value = savedDate;
    syncMonthFilter(savedDatge)
  }
});

document.addEventListener("transaction-modal-close", () => {
  closeModal("transaction-modal");
  resetTransactionForm();
});

document.addEventListener("category-modal-close", () => {
  closeModal("category-modal");
});

document.addEventListener("planning-modal-close", () => {
  closeModal("planning-modal");
  resetPlanningForm();
});
