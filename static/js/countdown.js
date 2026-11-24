(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const countdown = $("#countdown");
  if (!countdown) return;

  let remaining = 13 * 60 + 37;
  window.setInterval(() => {
    if (remaining > 0) remaining -= 1;
    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
    const seconds = String(remaining % 60).padStart(2, "0");
    countdown.textContent = `00:${minutes}:${seconds}`;
  }, 1000);
})();
