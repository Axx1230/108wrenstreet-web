(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const card = $(".appointment-card");
  if (!card) return;

  let pointerStartX = 0;
  let pointerId = null;
  let dragDistance = 0;
  let suppressClick = false;

  card.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartX = event.clientX;
    dragDistance = 0;
    pointerId = event.pointerId;
    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    dragDistance = event.clientX - pointerStartX;
    if (Math.abs(dragDistance) > 8) {
      const tilt = Math.max(-12, Math.min(12, dragDistance / 9));
      card.style.setProperty("--card-tilt", `${tilt}deg`);
    }
  });

  function finishDrag(event) {
    if (event.pointerId !== pointerId) return;
    if (Math.abs(dragDistance) > 55) {
      const flipped = !card.classList.contains("is-flipped");
      card.classList.toggle("is-flipped", flipped);
      card.setAttribute("aria-pressed", String(flipped));
      suppressClick = true;
    }
    card.style.removeProperty("--card-tilt");
    pointerId = null;
    dragDistance = 0;
    if (suppressClick) {
      window.setTimeout(() => { suppressClick = false; }, 0);
    }
  }

  card.addEventListener("pointerup", finishDrag);
  card.addEventListener("pointercancel", finishDrag);
  card.addEventListener("lostpointercapture", (event) => {
    if (event.pointerId === pointerId) finishDrag(event);
  });
  card.addEventListener("click", () => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const flipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(flipped));
  });
})();
