(function () {
  "use strict";

  document.body.classList.add("js-ready");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reducedMotion) {
    document.body.classList.add("motion-enabled");
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        document.body.classList.add("page-entered");
      });
    });
  } else {
    document.body.classList.add("page-entered");
  }

  var revealItems = document.querySelectorAll(
    ".home-page .section-block, " +
    ".subpage > article > .intro-copy, " +
    ".subpage > article > .info-grid, " +
    ".subpage > article > .content-section, " +
    ".subpage > article > .award-list, " +
    ".subpage > article > .talk-list"
  );

  if ("IntersectionObserver" in window && !reducedMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });

    revealItems.forEach(function (item, index) {
      item.classList.add("reveal-item");
      item.style.setProperty("--reveal-delay", Math.min(index * 45, 135) + "ms");
      observer.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("reveal-item", "is-visible");
    });
  }

  var filterButtons = document.querySelectorAll(".filter-button");
  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var filter = button.getAttribute("data-filter");
      filterButtons.forEach(function (item) { item.classList.toggle("active", item === button); });

      document.querySelectorAll(".publication-year").forEach(function (yearSection) {
        var visibleCount = 0;
        yearSection.querySelectorAll("ol.bibliography > li").forEach(function (publication) {
          var categoryNode = publication.querySelector("[data-category]");
          var categories = categoryNode ? categoryNode.getAttribute("data-category").split(" ") : [];
          var visible = filter === "all" || categories.indexOf(filter) !== -1;
          publication.hidden = !visible;
          if (visible) { visibleCount += 1; }
        });
        yearSection.classList.toggle("is-empty", visibleCount === 0);
      });
    });
  });

  document.querySelectorAll("#navbarNav .nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
      var menu = document.getElementById("navbarNav");
      var toggle = document.querySelector(".navbar-toggler");
      if (menu && toggle && menu.classList.contains("show")) { toggle.click(); }
    });
  });

  var sectionLinks = Array.prototype.slice.call(document.querySelectorAll("[data-section-link]"));
  var sectionTargets = sectionLinks.map(function (link) {
    var hash = link.getAttribute("href").split("#")[1];
    return hash ? document.getElementById(hash) : null;
  }).filter(Boolean);

  if (sectionTargets.length) {
    var navTicking = false;
    var updateActiveSection = function () {
      var marker = window.scrollY + 120;
      var activeId = sectionTargets[0].id;
      var pageBottom = window.scrollY + window.innerHeight;
      var documentHeight = document.documentElement.scrollHeight;
      var isAtPageBottom = pageBottom >= documentHeight - 2;

      if (isAtPageBottom) {
        activeId = sectionTargets[sectionTargets.length - 1].id;
      } else {
        sectionTargets.forEach(function (section) {
          if (section.offsetTop <= marker) { activeId = section.id; }
        });
      }
      sectionLinks.forEach(function (link) {
        var isActive = link.getAttribute("href").split("#")[1] === activeId;
        link.parentElement.classList.toggle("active", isActive);
      });
      navTicking = false;
    };

    window.addEventListener("scroll", function () {
      if (!navTicking) {
        window.requestAnimationFrame(updateActiveSection);
        navTicking = true;
      }
    }, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    updateActiveSection();
  }
}());
