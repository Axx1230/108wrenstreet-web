(() => {
  "use strict";

  const $$ = window.WrenSite.$$;
  const reducedMotion = window.WrenSite.reducedMotion;
  let observer = null;
  let previousScrollY = window.scrollY;
  let direction = "down";
  let scrollScheduled = false;

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const enteringOffset = direction === "down" ? 24 : -24;
        const leavingOffset = direction === "down" ? -24 : 24;
        entry.target.style.setProperty(
          "--reveal-offset",
          `${entry.isIntersecting ? enteringOffset : leavingOffset}px`
        );
        entry.target.dataset.revealed = String(entry.isIntersecting);
      });
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
  }

  window.addEventListener("scroll", () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    window.requestAnimationFrame(() => {
      scrollScheduled = false;
    const currentScrollY = window.scrollY;
    if (currentScrollY !== previousScrollY) {
      direction = currentScrollY > previousScrollY ? "down" : "up";
      previousScrollY = currentScrollY;
    }
    });
  }, { passive: true });

  function observe(elements) {
    if (!observer) return;
    elements.forEach((element, index) => {
      element.dataset.scrollReveal = "";
      // Cap stagger delay at 360 ms so long lists remain pleasant.
      element.style.setProperty(
        "--reveal-delay",
        `${Math.min(index, 4) * 90}ms`
      );
      observer.observe(element);
    });
  }

  window.WrenSite.observeScrollReveal = observe;

  observe($$(
    ".section-shell > *:not(.vault-scroll-track):not(.memory-flight):not(.screenings):not(.crew-grid):not(.accordion-list), " +
    ".memory-flight > *, .screenings > *, .crew-grid > *, .accordion-list > *"
  ));

  reducedMotion.addEventListener?.("change", (event) => {
    if (!event.matches) return;
    observer?.disconnect();
    $$("[data-scroll-reveal]").forEach((element) => {
      element.dataset.revealed = "true";
    });
  });
})();
