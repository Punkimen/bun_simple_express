"use strict";

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("is-open");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("is-open");
}

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
      const typeSelect = document.getElementById("type-select");
      if (typeSelect && type) {
        typeSelect.value = type;
        typeSelect.dispatchEvent(new Event("change"));
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
    }
    return;
  }

  // Close modal (× button)
  if (e.target.closest("[data-close-modal]")) {
    const modal = e.target.closest(".modal-overlay");
    if (modal) modal.classList.remove("is-open");
    return;
  }

  // Close modal (backdrop click)
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("is-open");
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

document.addEventListener("transaction-modal-close", () => {
  closeModal("transaction-modal");
});

document.addEventListener("category-modal-close", () => {
  closeModal("category-modal");
});
