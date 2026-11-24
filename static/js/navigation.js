(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const $$ = window.WrenSite.$$;
  const navLinks = $$(".site-nav a");

  const navTargets = (document.body.dataset.pageType === "press"
    ? [
      ["press-kit", ".press-hero"],
      ["press-kit", "#gallery"],
      ["press-kit", "#dossier"],
      ["press-kit", ".press-video"],
      ["screenings", "#screenings"],
      ["credits", "#credits"],
    ]
    : [
      ["intake", "#intake"],
      ["memory-vault", "#memory-vault"],
      ["oak-tree", "#oak-tree"],
      ["collaborate", "#collaborate"],
    ])
    .map(([key, selector]) => ({ key, element: $(selector) }))
    .filter((target) => target.element);

  let updateScheduled = false;

  function updateCurrentNavLink() {
    updateScheduled = false;
    const headerBottom = $(".site-header")?.getBoundingClientRect().bottom || 0;
    const threshold = headerBottom + Math.min(120, window.innerHeight * .22);
    let currentKey = navTargets[0]?.key;

    navTargets.forEach(({ key, element }) => {
      if (element.getBoundingClientRect().top <= threshold) currentKey = key;
    });
    navLinks.forEach((link) => {
      if (link.dataset.navKey === currentKey) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function scheduleNavUpdate() {
    if (updateScheduled) return;
    updateScheduled = true;
    window.requestAnimationFrame(updateCurrentNavLink);
  }

  updateCurrentNavLink();
  window.addEventListener("scroll", scheduleNavUpdate, { passive: true });
  window.addEventListener("resize", scheduleNavUpdate);
  window.addEventListener("hashchange", scheduleNavUpdate);
})();
