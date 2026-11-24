(() => {
  "use strict";

  // Shared, page-wide helpers loaded before every feature module.
  window.WrenSite = window.WrenSite || {};
  window.WrenSite.$ = (selector, scope = document) => scope.querySelector(selector);
  window.WrenSite.$$ = (selector, scope = document) =>
    [...scope.querySelectorAll(selector)];
  window.WrenSite.reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
})();
