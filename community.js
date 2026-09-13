/* UI behavior only. No fabricated teachers, calls, messages, or availability. */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const navLinks = all(".nav-item a, .mobile-nav-item");
  const baseSwitchTab = window.switchTab;
  window.switchTab = (id) => {
    const section = document.getElementById(id);
    if (!section?.classList.contains("app-section")) return;
    baseSwitchTab(id);
    syncNavigation();
    const heading = section.querySelector("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  function syncNavigation() {
    const current = $(".app-section.active")?.id || "dashboard";
    const group = ["reciter", "canvas", "map", "detox"].includes(current)
      ? "more"
      : current;
    navLinks.forEach((link) => {
      const tab = link.closest("[data-tab]").dataset.tab;
      if (tab === group) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
      link.classList.toggle("active", tab === group);
      link.closest(".nav-item")?.classList.toggle("active", tab === group);
    });
  }
  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if ($(".app-section.active")?.id !== id) window.switchTab(id);
  });
  document.addEventListener("hifzquest:progress", ({ detail }) => {
    $(".greeting-name").textContent = detail.userName
      ? `, ${detail.userName.split(" ")[0]}`
      : "";
    $("#home-surah").textContent = detail.selectedSurah;
    $("#home-surah-number").textContent = detail.surahNumber || "";
    $("#home-due").textContent = detail.due;
    $("#home-revision-note").textContent = detail.due
      ? "A short revisit helps keep familiar ayahs close."
      : "Start with one ayah. Your revision plan will grow with you.";
  });
  document.dispatchEvent(new Event("hifzquest:refresh-request"));
  syncNavigation();

  // Local preferences are explicitly distinguished from a match request.
  const form = $("#session-preferences");
  try {
    const saved = JSON.parse(
      localStorage.getItem("hifzquest_session_preferences") || "{}",
    );
    for (const [key, value] of Object.entries(saved)) {
      const field = form.elements.namedItem(key);
      if (field) field.value = value;
    }
  } catch {
    /* The form remains usable if storage is unavailable. */
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      localStorage.setItem(
        "hifzquest_session_preferences",
        JSON.stringify(Object.fromEntries(new FormData(form))),
      );
      $("#session-status").textContent =
        "Saved on this device. Live matching is not open yet; you can start solo practice anytime.";
    } catch {
      $("#session-status").textContent =
        "Your browser could not save these preferences. You can still practise a solo ayah.";
    }
  });
  $("#teacher-filters").addEventListener("change", (event) => {
    const filters = Object.fromEntries(new FormData(event.currentTarget));
    $("#teacher-empty-message").textContent =
      `No teacher directory is connected yet. Your selection: ${filters.cost.toLowerCase()}, ${filters.specialty.toLowerCase()}, ${filters.language.toLowerCase()}. Availability will be shown when community lessons open.`;
  });

  try {
    document.body.classList.toggle(
      "light-theme",
      localStorage.getItem("hifzquest_theme") !== "dark",
    );
  } catch {
    /* Default to light. */
  }
  function themeLabel() {
    $("#theme-toggle-text").textContent = document.body.classList.contains(
      "light-theme",
    )
      ? "Dark Mode"
      : "Light Mode";
  }
  themeLabel();
  $("#theme-toggle-btn").addEventListener("click", () => {
    try {
      localStorage.setItem(
        "hifzquest_theme",
        document.body.classList.contains("light-theme") ? "light" : "dark",
      );
    } catch {}
    themeLabel();
  });
  // The theme control remains available on mobile through More.
  const mobileTheme = document.createElement("button");
  mobileTheme.className = "text-button";
  mobileTheme.textContent = "Switch light / dark appearance";
  mobileTheme.addEventListener("click", () => $("#theme-toggle-btn").click());
  $("#more").appendChild(mobileTheme);

  // Give legacy modal controls accessible names and focus containment.
  const focusable = 'button, a[href], input, select, textarea, [tabindex="0"]';
  const returnFocus = new WeakMap();
  const modalStates = new WeakMap();
  all(".modal-backdrop").forEach((modal) => {
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute(
      "aria-hidden",
      String(!modal.classList.contains("active")),
    );
    const heading = modal.querySelector("h2, h3");
    if (heading) {
      heading.id ||= `${modal.id}-heading`;
      modal.setAttribute("aria-labelledby", heading.id);
    }
    modal
      .querySelectorAll(".modal-close")
      .forEach((button) => button.setAttribute("aria-label", "Close dialog"));
    modalStates.set(modal, false);
    new MutationObserver(() => {
      const active = modal.classList.contains("active");
      if (active === modalStates.get(modal)) return;
      modalStates.set(modal, active);
      modal.setAttribute("aria-hidden", String(!active));
      const anyOpen = !!$(".modal-backdrop.active");
      all(".sidebar, .main-content, .mobile-bottom-nav").forEach(
        (el) => (el.inert = anyOpen),
      );
      document.body.style.overflowY = anyOpen ? "hidden" : "";
      if (active) {
        returnFocus.set(modal, document.activeElement);
        modal.querySelector(focusable)?.focus();
      } else {
        returnFocus.get(modal)?.focus();
      }
    }).observe(modal, { attributes: true, attributeFilter: ["class"] });
    modal.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const items = [...modal.querySelectorAll(focusable)].filter(
        (el) => !el.disabled && el.getClientRects().length,
      );
      if (!items.length) return;
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });
  // Upgrade remaining legacy clickable elements for keyboard use.
  all(
    ".color-dot, .map-node, .user-status-card, .option-card, .card[onclick]",
  ).forEach((el) => {
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    if (el.title) el.setAttribute("aria-label", el.title);
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        el.click();
      }
    });
  });
  all("input, select").forEach((input) => {
    if (
      input.closest("label") ||
      input.getAttribute("aria-label") ||
      (input.id && $(`label[for="${input.id}"]`))
    )
      return;
    const preceding = input.previousElementSibling;
    const label =
      preceding?.tagName === "LABEL"
        ? preceding.textContent
        : input.title || input.placeholder || input.id.replaceAll("-", " ");
    input.setAttribute("aria-label", label);
  });
});
