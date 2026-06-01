"use strict";

let _pendingCategoryId = null;

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("is-open");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("is-open");
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
      }
      openModal("transaction-modal");
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
    }
    return;
  }

  // Close modal (backdrop click)
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("is-open");
    if (e.target.id === "transaction-modal") resetTransactionForm();
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

  // Apply category filter
  if (e.target.closest("[data-apply-categories]")) {
    const panel = document.getElementById("categories-panel");
    if (panel) panel.style.display = "none";
    applyFilters();
    return;
  }

  // Reset all filters
  if (e.target.closest("[data-reset-filters]")) {
    const form = document.getElementById("transaction-filters");
    if (!form) return;
    form.querySelectorAll("select").forEach((s) => (s.value = ""));
    form.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));
    applyFilters();
    return;
  }

  // Close categories panel on outside click
  const panel = document.getElementById("categories-panel");
  if (
    panel &&
    panel.style.display !== "none" &&
    !e.target.closest(".filter-group-categories")
  ) {
    panel.style.display = "none";
  }
});

const AMOUNT_MAX = 9999999999.99;
// up to 10 digits before decimal, up to 2 after
const AMOUNT_FORMAT = /^\d{0,10}(\.\d{0,2})?$/;

function setupAmountValidation() {
  const input = document.querySelector('#transaction-form input[name="amount"]');
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

document.addEventListener("DOMContentLoaded", setupAmountValidation);
document.addEventListener("htmx:afterSwap", (e) => {
  if (e.detail.target.closest && e.detail.target.closest("#transaction-modal")) {
    setupAmountValidation();
  }
});

document.addEventListener("transaction-modal-close", () => {
  closeModal("transaction-modal");
  resetTransactionForm();
});

document.addEventListener("category-modal-close", () => {
  closeModal("category-modal");
});
