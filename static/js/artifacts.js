(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const $$ = window.WrenSite.$$;
  const dialog = $("#artifact-dialog");
  if (!dialog) return;

  const artifactData = {
    novel: {
      number: "OBJECT / 01 — THE LITTLE LIE",
      title: "The Little Lie",
      lines: ["HER: You kept every poem?", "HIM: I kept the ones you crossed out.", "HER: Those were the honest ones."],
    },
    teaspoon: {
      number: "OBJECT / 02 — THE CONFESSION",
      title: "The Confession",
      lines: ["HER: You said you hated coffee.", "HIM: I do.", "HER: You ordered it anyway.", "HIM: I wanted to stay a little longer."],
    },
    ring: {
      number: "OBJECT / 03 — TOTAL BELONGING",
      title: "Total Belonging",
      lines: ["HIM: If we forget this place?", "HER: The tree won't.", "HIM: And if we forget each other?", "HER: We'll find our way back."],
    },
  };

  $$("[data-artifact]").forEach((button) => {
    button.addEventListener("click", () => {
      const memory = artifactData[button.dataset.artifact];
      $("#artifact-dialog-kicker").textContent = memory.number;
      $("#artifact-dialog-title").textContent = memory.title;
      const script = $("#artifact-dialog-script");
      script.replaceChildren(...memory.lines.map((line) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = line;
        return paragraph;
      }));
      dialog.showModal();
    });
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  $(".artifact-audio")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Audio is not supported in this browser.");
      }
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(220, start);
      oscillator.frequency.exponentialRampToValueAtTime(110, start + 1.2);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.035, start + .12);
      gain.gain.exponentialRampToValueAtTime(.0001, start + 1.5);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 1.55);

      button.textContent = "◼ MEMORY AUDIO / PLAYING";
      window.setTimeout(() => {
        button.textContent = "▶ PLAY MEMORY AUDIO";
        context.close();
      }, 1600);
    } catch (error) {
      button.textContent = error.message;
    }
  });
})();
