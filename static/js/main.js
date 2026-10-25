(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  async function requestJSON(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The request could not be completed.");
    return data;
  }

  const card = $(".appointment-card");
  if (card) {
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
    const finishCardDrag = (event) => {
      if (event.pointerId !== pointerId) return;
      const wasDragged = Math.abs(dragDistance) > 55;
      if (wasDragged) {
        const flipped = !card.classList.contains("is-flipped");
        card.classList.toggle("is-flipped", flipped);
        card.setAttribute("aria-pressed", String(flipped));
        suppressClick = true;
      }
      card.style.removeProperty("--card-tilt");
      pointerId = null;
      dragDistance = 0;
      if (suppressClick) window.setTimeout(() => { suppressClick = false; }, 0);
    };
    card.addEventListener("pointerup", finishCardDrag);
    card.addEventListener("pointercancel", finishCardDrag);
    card.addEventListener("lostpointercapture", (event) => {
      if (event.pointerId === pointerId) finishCardDrag(event);
    });
    card.addEventListener("click", () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      const flipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", String(flipped));
    });
  }

  const dossierTabs = $$(".dossier-tab");
  const dossierPanel = $("#dossier-panel");
  const dossierCopy = $("[data-dossier-copy]");
  const dossierContent = {
    client: ["tab-client", "FILE 143-A", "IDENTITY ", "████████████", " / MEMORY STATUS: FRAGMENTED"],
    subject: ["tab-subject", "FILE 143-B", "SUBJECT ", "████████", " / RECOLLECTION: PARTIAL"],
    staff: ["tab-staff", "FILE 143-C", "CASE OFFICER ", "███████████", " / CLEARANCE: LEVEL 04"],
  };
  dossierTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateDossierTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? dossierTabs.length - 1 :
        (index + (event.key === "ArrowRight" ? 1 : -1) + dossierTabs.length) % dossierTabs.length;
      dossierTabs[nextIndex].focus();
      activateDossierTab(dossierTabs[nextIndex]);
    });
  });
  function activateDossierTab(tab) {
    dossierTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    const [panelId, key, prefix, redaction, suffix] = dossierContent[tab.dataset.file];
    dossierPanel.setAttribute("aria-labelledby", panelId);
    $(".dossier-key", dossierPanel).textContent = key;
    dossierCopy.replaceChildren(document.createTextNode(prefix));
    const redacted = document.createElement("span");
    redacted.className = "redacted";
    redacted.textContent = redaction;
    dossierCopy.append(redacted, document.createTextNode(suffix));
  }

  const memoryFeed = $("#memory-feed");
  const memoryForm = $("#memory-form");
  const memoryFeedback = $("#memory-feedback");
  let activeFilter = "ALL";
  let memoryRequestId = 0;

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
  }

  function renderMemories(memories) {
    memoryFeed.replaceChildren();
    if (!memories.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No memories in this file yet. Leave the first one.";
      memoryFeed.append(empty);
      return;
    }
    memories.forEach((memory) => {
      const article = document.createElement("article");
      article.className = "memory-card";
      const quote = document.createElement("blockquote");
      quote.textContent = memory.body;
      const footer = document.createElement("footer");
      const author = document.createElement("span");
      author.textContent = memory.author || "Anonymous";
      const category = document.createElement("span");
      category.className = "memory-category";
      category.textContent = memory.category;
      const date = document.createElement("time");
      date.dateTime = memory.created_at;
      date.textContent = formatDate(memory.created_at);
      footer.append(author, category, date);
      article.append(quote, footer);
      memoryFeed.append(article);
    });
  }

  async function loadMemories(category = activeFilter) {
    activeFilter = category;
    const requestId = ++memoryRequestId;
    memoryFeed.setAttribute("aria-busy", "true");
    try {
      const data = await requestJSON(`/api/memories?category=${encodeURIComponent(category)}`);
      if (requestId === memoryRequestId) renderMemories(data.memories);
    } catch (error) {
      if (requestId !== memoryRequestId) return;
      memoryFeed.replaceChildren();
      const message = document.createElement("p");
      message.className = "empty-state";
      message.textContent = error.message;
      memoryFeed.append(message);
    } finally {
      if (requestId === memoryRequestId) memoryFeed.setAttribute("aria-busy", "false");
    }
  }
  // ADDED: memory counter
  async function loadMemoryTotal() {
    const el = $("#memory-total");
    if (!el) return;
    try {
      const data = await requestJSON("/api/memories/count");
      el.textContent = `MEMORIES ON THE WALL: ${data.total}`;
    } catch (error) {
      el.textContent = "";
    }
  }

  if (memoryFeed) loadMemories();

  $$(".filter-pill").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".filter-pill").forEach((pill) => {
        const selected = pill === button;
        pill.classList.toggle("is-active", selected);
        pill.setAttribute("aria-pressed", String(selected));
      });
      loadMemories(button.dataset.filter);
    });
  });

  $("#memory-text")?.addEventListener("input", (event) => {
    $("#memory-count").textContent = `${event.currentTarget.value.length} / 280`;
  });

  memoryForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = $("button[type=submit]", memoryForm);
    const formData = new FormData(memoryForm);
    memoryFeedback.textContent = "";
    memoryFeedback.classList.remove("is-error");
    submit.disabled = true;
    try {
      await requestJSON("/api/memories", {
        method: "POST",
        body: JSON.stringify({
          body: formData.get("body"),
          author: formData.get("author") || "Anonymous",
          category: formData.get("category"),
        }),
      });
      memoryForm.reset();
      $("#memory-count").textContent = "0 / 280";
      memoryFeedback.textContent = "Your memory has been added to the wall.";
      await loadMemories(activeFilter); 
      await loadMemoryTotal();   // ADDED
    } catch (error) {
      memoryFeedback.textContent = error.message;
      memoryFeedback.classList.add("is-error");
    } finally {
      submit.disabled = false;
    }
  });

  const artifactDialog = $("#artifact-dialog");
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
      artifactDialog.showModal();
    });
  });
  artifactDialog?.addEventListener("click", (event) => {
    if (event.target === artifactDialog) artifactDialog.close();
  });
  $(".artifact-audio")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Audio is not supported in this browser.");
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

  const screeningEvents = {};
  const rsvpDialog = $("#rsvp-dialog");
  const calendarButton = $(".calendar-button");
  $$(".rsvp-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      screeningEvents[button.dataset.eventId] = {
        id: button.dataset.eventId,
        name: button.dataset.eventName,
        location: button.dataset.location,
        date: button.dataset.date,
      };
      $("#rsvp-event-details").textContent = `${button.dataset.eventName} · ${button.dataset.location} · ${new Date(button.dataset.date).toLocaleString()}`;
      $("#rsvp-form").reset();
      $("#rsvp-event-id").value = button.dataset.eventId;
      $("#rsvp-title").innerHTML = "Save your<br><em>seat.</em>";
      $("#rsvp-feedback").textContent = "";
      $("#rsvp-feedback").classList.remove("is-error");
      calendarButton.disabled = true;
      rsvpDialog.showModal();
    });
  });
  rsvpDialog?.addEventListener("click", (event) => {
    if (event.target === rsvpDialog) rsvpDialog.close();
  });
  $("#rsvp-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = $("button[type=submit]", form);
    const feedback = $("#rsvp-feedback");
    const data = new FormData(form);
    const eventDetails = screeningEvents[data.get("event_id")];
    feedback.textContent = "";
    feedback.classList.remove("is-error");
    submit.disabled = true;
    try {
      await requestJSON("/api/rsvp", {
        method: "POST",
        body: JSON.stringify({
          event_id: data.get("event_id"),
          name: data.get("name"),
          email: data.get("email"),
          seats: Number(data.get("seats")),
        }),
      });
      feedback.textContent = "Your RSVP is confirmed. Add the screening to your calendar below.";
      $("#rsvp-title").textContent = "You’re on the list.";
      calendarButton.disabled = false;
      calendarButton.focus();
      calendarButton.dataset.eventId = eventDetails.id;
    } catch (error) {
      feedback.textContent = error.message;
      feedback.classList.add("is-error");
    } finally {
      submit.disabled = false;
    }
  });

  function escapeCalendarText(text) {
    return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }
  calendarButton?.addEventListener("click", () => {
    const eventDetails = screeningEvents[calendarButton.dataset.eventId];
    if (!eventDetails) return;
    const start = new Date(eventDetails.date);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const toCalendarDate = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//108 Wren Street//Screenings//EN",
      "BEGIN:VEVENT", `UID:${eventDetails.id}@108wrenstreet`,
      `DTSTAMP:${toCalendarDate(new Date())}`, `DTSTART:${toCalendarDate(start)}`, `DTEND:${toCalendarDate(end)}`,
      `SUMMARY:${escapeCalendarText(eventDetails.name)}`,
      `LOCATION:${escapeCalendarText(eventDetails.location)}`,
      "DESCRIPTION:108 Wren Street film screening",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const download = document.createElement("a");
    download.href = url;
    download.download = `${eventDetails.id}.ics`;
    document.body.append(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $("#collaborate-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = $("button[type=submit]", form);
    const feedback = $("#collaborate-feedback");
    const payload = Object.fromEntries(new FormData(form).entries());
    feedback.textContent = "";
    feedback.classList.remove("is-error");
    submit.disabled = true;
    try {
      await requestJSON("/api/collaborate", { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      feedback.textContent = "Thanks for reaching out. Your details have been received.";
    } catch (error) {
      feedback.textContent = error.message;
      feedback.classList.add("is-error");
    } finally {
      submit.disabled = false;
    }
  });

  const soundToggle = $(".sound-toggle");
  let audioContext;
  let ambientGain;
  soundToggle?.addEventListener("click", async () => {
    try {
      if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) throw new Error("Ambient audio is not supported in this browser.");
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
      if (audioContext.state === "suspended") await audioContext.resume();
      const isOn = soundToggle.getAttribute("aria-pressed") !== "true";
      ambientGain.gain.setTargetAtTime(isOn ? 0.018 : 0, audioContext.currentTime, .25);
      soundToggle.setAttribute("aria-pressed", String(isOn));
      soundToggle.setAttribute("aria-label", `Turn ambient sound ${isOn ? "off" : "on"}`);
      $(".sound-state", soundToggle).textContent = isOn ? "ON" : "OFF";
    } catch (error) {
      $(".sound-state", soundToggle).textContent = "UNAVAILABLE";
      soundToggle.setAttribute("aria-label", error.message);
    }
  });

  const countdown = $("#countdown");
  if (countdown) {
    let remaining = 13 * 60 + 37;
    window.setInterval(() => {
      if (remaining > 0) remaining -= 1;
      countdown.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`.replace(/^/, "00:");
    }, 1000);
  }

  const flight = $(".reconstruction");
  const desktopMotion = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let scrollTriggerInstance;
  function setupFlight() {
    scrollTriggerInstance?.kill(true);
    scrollTriggerInstance = undefined;
    if (!flight) return;
    const cards = $$(".flight-card", flight);
    const gsapAvailable = window.gsap && window.ScrollTrigger;
    const shouldPin = desktopMotion.matches && !reducedMotion.matches && gsapAvailable;
    flight.classList.toggle("is-pinned", Boolean(shouldPin));
    if (!shouldPin) {
      cards.forEach((item, index) => {
        item.style.removeProperty("transform");
        item.style.removeProperty("opacity");
        item.style.zIndex = String(cards.length - index);
      });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: flight,
        start: "top top+=72",
        end: "+=150%",
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    cards.forEach((item, index) => {
      timeline.to(item, {
        z: 260 + index * 170,
        x: (index - 1) * 25,
        y: (index - 1) * -35,
        rotateY: (index - 1) * -5,
        opacity: index === cards.length - 1 ? 1 : .45,
        ease: "none",
      }, index * .8);
    });
    scrollTriggerInstance = timeline.scrollTrigger;
  }
  window.addEventListener("load", setupFlight, { once: true });
  desktopMotion.addEventListener?.("change", setupFlight);
  reducedMotion.addEventListener?.("change", setupFlight);

  const initialSection = document.body.dataset.pageSection || null;
  if (initialSection) {
    window.addEventListener("load", () => {
      document.getElementById(initialSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, { once: true });
  }
})();
