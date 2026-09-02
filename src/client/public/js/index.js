"use strict";

let _pendingCategoryId = null;
let _initialMonthSynced = false;
let _keepCategoryManagerOpen = false;
let _clickableHintTimeout = null;
let _categoryDragState = null;
let _categorySortSaving = false;
let _pendingCategorySortFocusId = null;

const CLICKABLE_HINT_STORAGE_KEY = "isShowClickableHint";

function dismissClickableHint() {
  const hint = document.querySelector(".tr-clickable-hint");
  if (hint) {
    hint.remove();
    localStorage.setItem(CLICKABLE_HINT_STORAGE_KEY, "true");
  }
  if (_clickableHintTimeout) {
    clearTimeout(_clickableHintTimeout);
    _clickableHintTimeout = null;
  }
}

function showClickableHint() {
  if (localStorage.getItem(CLICKABLE_HINT_STORAGE_KEY)) return;
  if (document.querySelector(".tr-clickable-hint")) return;

  const row = document.querySelector("#statistics-container .tr-clickable");
  const anchor = row?.querySelector(".col-cat");
  if (!anchor) return;

  if (_clickableHintTimeout) clearTimeout(_clickableHintTimeout);
  const anchorRect = anchor.getBoundingClientRect();

  const hint = document.createElement("div");
  hint.className = "tr-clickable-hint";
  hint.innerHTML = `
    <span>Кликайте чтобы редактировать</span>
    <button type="button" data-clickable-hint-close aria-label="Закрыть подсказку">×</button>
  `;
  hint.style.top = `${anchorRect.bottom + 6}px`;
  hint.style.left = `${Math.max(8, Math.min(anchorRect.left, window.innerWidth - 228))}px`;
  document.body.appendChild(hint);

  _clickableHintTimeout = setTimeout(dismissClickableHint, 15000);
}

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

  if (e.detail.target.id === "category-list" && _keepCategoryManagerOpen) {
    const list = e.detail.target.querySelector(".category-manager-list");
    const toggle = e.detail.target.querySelector(
      "[data-category-manager-toggle]",
    );
    if (list && toggle) {
      list.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    }
    _keepCategoryManagerOpen = false;
  }

  if (e.detail.target.id === "category-list" && _pendingCategorySortFocusId) {
    const item = Array.from(
      e.detail.target.querySelectorAll("[data-category-item]"),
    ).find(
      (categoryItem) =>
        categoryItem.dataset.categoryId === _pendingCategorySortFocusId,
    );
    item?.querySelector("[data-category-drag-handle]")?.focus();
    _pendingCategorySortFocusId = null;
  }

  if (e.detail.target.id === "transactions-container" && !_initialMonthSynced) {
    _initialMonthSynced = true;
    const savedDate = localStorage.getItem("lastTransactionDate");
    if (savedDate) syncMonthFilter(savedDate);
  }

  if (e.detail.target.id === "statistics-container") {
    showClickableHint();
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
  if (e.target.closest("[data-clickable-hint-close]")) {
    dismissClickableHint();
    return;
  }

  if (e.target.closest(".tr-clickable")) {
    dismissClickableHint();
  }

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

  const categoryManagerToggle = e.target.closest("[data-category-manager-toggle]");
  if (categoryManagerToggle) {
    const list = document.getElementById("category-manager-list");
    if (list) {
      const isOpen = list.hasAttribute("hidden");
      list.toggleAttribute("hidden", !isOpen);
      categoryManagerToggle.setAttribute("aria-expanded", String(isOpen));
    }
    return;
  }

  const editCategoryBtn = e.target.closest("[data-edit-category]");
  if (editCategoryBtn) {
    const item = editCategoryBtn.closest("[data-category-item]");
    const name = item?.querySelector(".category-manager-name");
    const form = item?.querySelector(".category-manager-edit-form");
    const actions = item?.querySelector(".category-manager-actions");
    if (name && form && actions) {
      name.hidden = true;
      actions.hidden = true;
      form.hidden = false;
      const input = form.querySelector('input[name="name"]');
      if (input) {
        input.focus();
        input.select();
      }
    }
    return;
  }

  const cancelCategoryEditBtn = e.target.closest("[data-cancel-category-edit]");
  if (cancelCategoryEditBtn) {
    const item = cancelCategoryEditBtn.closest("[data-category-item]");
    const name = item?.querySelector(".category-manager-name");
    const form = item?.querySelector(".category-manager-edit-form");
    const actions = item?.querySelector(".category-manager-actions");
    if (name && form && actions) {
      form.hidden = true;
      name.hidden = false;
      actions.hidden = false;
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

function getCategoryItems(list) {
  return Array.from(list.children).filter((item) =>
    item.matches("[data-category-item]"),
  );
}

function getCategoryIds(list) {
  return getCategoryItems(list).map((item) => item.dataset.categoryId);
}

function restoreCategoryItems(list, items) {
  if (!list.isConnected) return;
  items.forEach((item) => list.appendChild(item));
}

async function persistCategorySort(list, originalItems) {
  const categoryIds = getCategoryIds(list);
  const type = list.dataset.categoryType;
  const focusedCategoryId = document.activeElement
    ?.closest?.("[data-category-item]")
    ?.dataset.categoryId;

  if (!type || categoryIds.some((id) => !id)) {
    restoreCategoryItems(list, originalItems);
    window.alert("Не удалось определить категории для сортировки");
    return;
  }

  _categorySortSaving = true;
  list.classList.add("is-saving");
  list.setAttribute("aria-busy", "true");

  try {
    const response = await fetch("/api/category/sort", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds, type }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || "Не удалось сохранить порядок категорий");
    }

    const categorySelect = document.getElementById("category-select");
    _pendingCategoryId = categorySelect?.value || null;
    _pendingCategorySortFocusId = focusedCategoryId || null;
    _keepCategoryManagerOpen = true;
    htmx.trigger(document.body, "categoryChanged");
  } catch (error) {
    restoreCategoryItems(list, originalItems);
    window.alert(error.message || "Не удалось сохранить порядок категорий");
  } finally {
    _categorySortSaving = false;
    if (list.isConnected) {
      list.classList.remove("is-saving");
      list.removeAttribute("aria-busy");
    }
  }
}

document.addEventListener("pointerdown", (e) => {
  const handle = e.target.closest("[data-category-drag-handle]");
  if (!handle || _categorySortSaving) return;
  if (e.pointerType !== "touch" && e.button !== 0) return;

  const item = handle.closest("[data-category-item]");
  const list = item?.closest("[data-category-type]");
  if (!item || !list || getCategoryItems(list).length < 2) return;

  handle.focus();
  handle.setPointerCapture(e.pointerId);
  item.classList.add("is-dragging");
  _categoryDragState = {
    pointerId: e.pointerId,
    handle,
    item,
    list,
    originalItems: getCategoryItems(list),
  };
  e.preventDefault();
});

document.addEventListener(
  "pointermove",
  (e) => {
    const state = _categoryDragState;
    if (!state || state.pointerId !== e.pointerId) return;

    e.preventDefault();
    const pointedElement = document.elementFromPoint(e.clientX, e.clientY);
    const targetItem = pointedElement?.closest?.("[data-category-item]");
    if (
      !targetItem ||
      targetItem === state.item ||
      targetItem.parentElement !== state.list
    ) {
      return;
    }

    const targetRect = targetItem.getBoundingClientRect();
    const insertAfter = e.clientY > targetRect.top + targetRect.height / 2;
    state.list.insertBefore(
      state.item,
      insertAfter ? targetItem.nextElementSibling : targetItem,
    );
  },
  { passive: false },
);

function finishCategoryDrag(e, cancelled = false) {
  const state = _categoryDragState;
  if (!state || state.pointerId !== e.pointerId) return;

  _categoryDragState = null;
  state.item.classList.remove("is-dragging");
  if (state.handle.hasPointerCapture(e.pointerId)) {
    state.handle.releasePointerCapture(e.pointerId);
  }

  const listRect = state.list.getBoundingClientRect();
  const releasedInside =
    e.clientX >= listRect.left &&
    e.clientX <= listRect.right &&
    e.clientY >= listRect.top &&
    e.clientY <= listRect.bottom;
  const originalIds = state.originalItems.map((item) => item.dataset.categoryId);
  const categoryIds = getCategoryIds(state.list);
  const orderChanged = categoryIds.some((id, index) => id !== originalIds[index]);

  if (cancelled || !releasedInside) {
    restoreCategoryItems(state.list, state.originalItems);
  } else if (orderChanged) {
    void persistCategorySort(state.list, state.originalItems);
  }
}

document.addEventListener("pointerup", (e) => finishCategoryDrag(e));
document.addEventListener("pointercancel", (e) => finishCategoryDrag(e, true));

document.addEventListener("keydown", (e) => {
  const handle = e.target.closest("[data-category-drag-handle]");
  if (
    !handle ||
    _categorySortSaving ||
    (e.key !== "ArrowUp" && e.key !== "ArrowDown")
  ) {
    return;
  }

  const item = handle.closest("[data-category-item]");
  const list = item?.closest("[data-category-type]");
  if (!item || !list) return;

  const sibling =
    e.key === "ArrowUp" ? item.previousElementSibling : item.nextElementSibling;
  if (!sibling?.matches("[data-category-item]")) return;

  e.preventDefault();
  const originalItems = getCategoryItems(list);
  if (e.key === "ArrowUp") {
    list.insertBefore(item, sibling);
  } else {
    list.insertBefore(sibling, item);
  }
  void persistCategorySort(list, originalItems);
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
  if (elt?.matches?.(".category-manager-edit-form")) {
    _keepCategoryManagerOpen = true;
  }
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
  showClickableHint();
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
