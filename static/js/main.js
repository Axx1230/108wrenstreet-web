(() => {
  "use strict";

  // main.js is the small page bootstrap. Page behavior is organized in
  // focused modules: navigation, reveal effects, GSAP sequences, media,
  // dialogs, and API integrations.
  const initialSection = document.body.dataset.pageSection || null;
  if (initialSection) {
    window.addEventListener("load", () => {
      document
        .getElementById(initialSection)
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    }, { once: true });
  }
})();
