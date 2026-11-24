(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const zone = $(".memory-secret-zone");
  const trigger = $("#secret-memory-trigger");
  const modal = $("#secret-memory-modal");
  const closeButton = $("#close-secret-modal");

  if (!zone || !trigger || !modal ||
    typeof modal.showModal !== "function") return;

  // State 0: hidden, 1: hover discovery, 2: hover left,
  // 3: unlocked and ready to open.
  let stage = 0;
  trigger.classList.add("easter-egg-word");
  trigger.setAttribute("tabindex", "0");
  trigger.setAttribute("role", "button");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", "Classified node: memory");
  trigger.setAttribute(
    "aria-description",
    "Press Enter or Space to unlock this classified node, then press again to open it."
  );

  function unlock() {
    stage = 3;
    trigger.classList.remove("has-disappeared");
    trigger.classList.add("is-unlocked");
  }

  function open() {
    modal.showModal();
    trigger.setAttribute("aria-expanded", "true");
  }

  zone.addEventListener("mouseenter", () => {
    if (stage === 0) {
      stage = 1;
      trigger.classList.add("has-disappeared");
    } else if (stage === 2) {
      unlock();
    }
  });
  zone.addEventListener("mouseleave", () => {
    if (stage === 1) stage = 2;
  });
  zone.addEventListener("click", () => {
    if (stage === 3) open();
    else unlock();
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (stage === 3) open();
    else unlock();
  });
  modal.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    modal.close();
  });
  closeButton?.addEventListener("click", () => modal.close());
  modal.addEventListener("close", () =>
    trigger.setAttribute("aria-expanded", "false")
  );
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
})();
