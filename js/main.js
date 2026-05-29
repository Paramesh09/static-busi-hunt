/* =====================================================================
   Busi Hunt — Main JavaScript
   ---------------------------------------------------------------------
   Modules:
   1. Mobile navigation (hamburger toggle)
   2. Sticky header shadow on scroll
   3. Scroll-reveal animations (IntersectionObserver)
   4. Animated counters (stats)
   5. Footer year + newsletter
   6. Business filtering (search + category) — businesses page
   7. Contact form validation — contact page
   All modules are guarded so the file is safe to load on every page.
   ===================================================================== */
(function () {
  "use strict";

  /* -----------------------------------------------------------------
     1. MOBILE NAVIGATION
  ----------------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector(".nav__toggle");
    var menu = document.getElementById("nav-menu");
    if (!toggle || !menu) return;

    function closeMenu() {
      menu.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close when a link is tapped (mobile)
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    // Close when resizing back to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* -----------------------------------------------------------------
     2. STICKY HEADER SHADOW
  ----------------------------------------------------------------- */
  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* -----------------------------------------------------------------
     3. SCROLL-REVEAL ANIMATIONS
  ----------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    // Fallback: if IntersectionObserver is unsupported, just show.
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* -----------------------------------------------------------------
     4. ANIMATED COUNTERS
  ----------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        el.textContent = el.getAttribute("data-count") + (el.dataset.suffix || "");
      });
      return;
    }

    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.dataset.suffix || "";
      var dur = 1400;
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        var val = target * eased;
        el.textContent = (target % 1 === 0 ? Math.floor(val) : val.toFixed(1)) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
    };

    var obs = new IntersectionObserver(
      function (entries, o) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(e.target); o.unobserve(e.target); }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { obs.observe(el); });
  }

  /* -----------------------------------------------------------------
     5. FOOTER YEAR + NEWSLETTER
  ----------------------------------------------------------------- */
  function initFooter() {
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    var news = document.getElementById("newsletter-form");
    if (news) {
      news.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = news.querySelector("input");
        var note = news.parentElement.querySelector(".newsletter-note");
        if (input && /\S+@\S+\.\S+/.test(input.value)) {
          if (note) { note.textContent = "Thanks! You're on the list."; note.style.color = "#4ade80"; }
          input.value = "";
        } else if (note) {
          note.textContent = "Please enter a valid email.";
          note.style.color = "#f87171";
        }
      });
    }
  }

  /* -----------------------------------------------------------------
     6. BUSINESS FILTERING (businesses page)
  ----------------------------------------------------------------- */
  function initBusinessFilter() {
    var grid = document.getElementById("biz-grid");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-name]"));
    var search = document.getElementById("biz-search");
    var chips = document.querySelectorAll(".chip[data-filter]");
    var empty = document.getElementById("no-results");
    var countEl = document.getElementById("result-count");
    var activeCat = "all";

    function apply() {
      var q = (search ? search.value : "").trim().toLowerCase();
      var visible = 0;

      cards.forEach(function (card) {
        var name = (card.dataset.name || "").toLowerCase();
        var cat = card.dataset.category || "";
        var tags = (card.dataset.tags || "").toLowerCase();
        var matchesText = !q || name.indexOf(q) > -1 || tags.indexOf(q) > -1;
        var matchesCat = activeCat === "all" || cat === activeCat;
        var show = matchesText && matchesCat;
        card.style.display = show ? "" : "none";
        if (show) visible++;
      });

      if (empty) empty.classList.toggle("show", visible === 0);
      if (countEl) countEl.textContent = visible;
    }

    if (search) search.addEventListener("input", apply);

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        activeCat = chip.dataset.filter;
        apply();
      });
    });

    apply();
  }

  /* -----------------------------------------------------------------
     7. CONTACT FORM VALIDATION (contact page)
  ----------------------------------------------------------------- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var success = document.getElementById("form-success");

    var validators = {
      name: function (v) { return v.trim().length >= 2; },
      email: function (v) { return /^\S+@\S+\.\S+$/.test(v.trim()); },
      subject: function (v) { return v.trim().length >= 3; },
      message: function (v) { return v.trim().length >= 10; }
    };

    function validateField(field) {
      var input = field.querySelector("input, textarea, select");
      if (!input) return true;
      var name = input.getAttribute("name");
      var fn = validators[name];
      var ok = fn ? fn(input.value) : input.value.trim() !== "";
      field.classList.toggle("invalid", !ok);
      return ok;
    }

    // Live-clear errors as the user types
    form.querySelectorAll(".field input, .field textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("invalid")) validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll(".field");
      var allValid = true;
      fields.forEach(function (field) {
        if (!validateField(field)) allValid = false;
      });

      if (allValid) {
        if (success) {
          success.classList.add("show");
          success.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        form.reset();
      } else {
        var firstInvalid = form.querySelector(".field.invalid input, .field.invalid textarea");
        if (firstInvalid) firstInvalid.focus();
      }
    });
  }

  /* -----------------------------------------------------------------
     INIT
  ----------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initHeaderScroll();
    initReveal();
    initCounters();
    initFooter();
    initBusinessFilter();
    initContactForm();
  });
})();
