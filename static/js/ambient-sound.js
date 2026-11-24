(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const toggle = $(".sound-toggle");
  if (!toggle) return;

  let audioContext;
  let ambientGain;

  toggle.addEventListener("click", async () => {
    try {
      if (!audioContext) {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error("Ambient audio is not supported in this browser.");
        }
        audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        ambientGain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 55;
        ambientGain.gain.value = 0;
        oscillator.connect(ambientGain);
        ambientGain.connect(audioContext.destination);
        oscillator.start();
      }
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const isOn =
        toggle.getAttribute("aria-pressed") !== "true";
      ambientGain.gain.setTargetAtTime(
        isOn ? 0.018 : 0,
        audioContext.currentTime,
        .25
      );
      toggle.setAttribute("aria-pressed", String(isOn));
      toggle.setAttribute(
        "aria-label",
        `Turn ambient sound ${isOn ? "off" : "on"}`
      );
      $(".sound-state", toggle).textContent = isOn ? "ON" : "OFF";
    } catch (error) {
      $(".sound-state", toggle).textContent = "UNAVAILABLE";
      toggle.setAttribute("aria-label", error.message);
    }
  });
})();
