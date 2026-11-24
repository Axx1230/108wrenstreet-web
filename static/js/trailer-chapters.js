(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const $$ = window.WrenSite.$$;
  const video = $(".press-trailer");
  if (!video) return;

  const status = $("#trailer-chapter-status");
  $$(".trailer-chapter").forEach((button) => {
    button.addEventListener("click", () => {
      const time = Number(button.dataset.trailerTime);
      if (!Number.isFinite(time) || time < 0) {
        status.textContent = "This chapter marker has an invalid time.";
        return;
      }
      if (!Number.isFinite(video.duration)) {
        status.textContent = "Wait for the trailer to load before choosing a chapter.";
        return;
      }
      if (time > video.duration) {
        status.textContent = "This chapter marker is outside the trailer duration.";
        return;
      }
      video.currentTime = time;
      status.textContent =
        `Playback position set to ${button.textContent.trim()}.`;
    });
  });
})();
