(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let revealObserver = null;
  let revealScrollY = window.scrollY;
  let revealDirection = "down";

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const enteringOffset = revealDirection === "down" ? 24 : -24;
        const leavingOffset = revealDirection === "down" ? -24 : 24;
        entry.target.style.setProperty(
          "--reveal-offset",
          `${entry.isIntersecting ? enteringOffset : leavingOffset}px`
        );
        entry.target.dataset.revealed = String(entry.isIntersecting);
      });
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
  }

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY !== revealScrollY) {
      revealDirection = currentScrollY > revealScrollY ? "down" : "up";
      revealScrollY = currentScrollY;
    }
  }, { passive: true });

  function observeScrollReveal(elements) {
    if (!revealObserver) return;
    elements.forEach((element, index) => {
      element.dataset.scrollReveal = "";
      element.style.setProperty("--reveal-delay", `${Math.min(index, 4) * 90}ms`);
      revealObserver.observe(element);
    });
  }

  observeScrollReveal($$(
    ".section-shell > *:not(.vault-scroll-track):not(.memory-flight):not(.screenings):not(.crew-grid):not(.accordion-list), " +
    ".memory-flight > *, .screenings > *, .crew-grid > *, .accordion-list > *"
  ));
  reducedMotion.addEventListener?.("change", (event) => {
    if (!event.matches) return;
    revealObserver?.disconnect();
    $$("[data-scroll-reveal]").forEach((element) => {
      element.dataset.revealed = "true";
    });
  });

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
  let navUpdateScheduled = false;
  const updateCurrentNavLink = () => {
    navUpdateScheduled = false;
    const threshold = ($(".site-header")?.getBoundingClientRect().bottom || 0) +
      Math.min(120, window.innerHeight * .22);
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
  };
  const scheduleNavUpdate = () => {
    if (navUpdateScheduled) return;
    navUpdateScheduled = true;
    window.requestAnimationFrame(updateCurrentNavLink);
  };
  updateCurrentNavLink();
  window.addEventListener("scroll", scheduleNavUpdate, { passive: true });
  window.addEventListener("resize", scheduleNavUpdate);
  window.addEventListener("hashchange", scheduleNavUpdate);

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

  const vault = $("#memory-vault");
  const vaultCards = $$(".vault-artifact-card", vault || document);
  const vaultStage = $(".vault-viewport-stage", vault || document);
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const intake = $("#intake");
  if (intake && gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const cameraMotion = gsap.matchMedia();
    cameraMotion.add("(prefers-reduced-motion: no-preference)", () => {
      const scene = $(".appointment-scene", intake);
      if (!scene) return;
      gsap.to(scene, {
        scale: 1.16,
        y: -36,
        ease: "none",
        scrollTrigger: {
          trigger: intake,
          start: "top top",
          end: "bottom top",
          scrub: .7,
          invalidateOnRefresh: true,
        },
      });
    });
  }

  if (vault && vaultCards.length && vaultStage && gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const vaultMedia = gsap.matchMedia();
    vaultMedia.add(
      "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const glow = $(".ambient-radial-glow", vault);
        const lenis = typeof window.Lenis === "function"
          ? new window.Lenis({
            autoRaf: false,
            duration: 1.2,
            easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
            smoothWheel: true,
          })
          : null;
        const syncLenis = lenis ? (time) => lenis.raf(time * 1000) : null;
        if (lenis && syncLenis) {
          lenis.on("scroll", ScrollTrigger.update);
          gsap.ticker.add(syncLenis);
        }
        const setCardAccessible = (card, active) => {
          if (!active && card.contains(document.activeElement)) return;
          card.inert = !active;
          card.setAttribute("aria-hidden", String(!active));
        };
        const syncCardAccess = () => {
          const nextVisibleCard = vaultCards.reduce((mostVisible, card) => (
            gsap.getProperty(card, "opacity") > gsap.getProperty(mostVisible, "opacity")
              ? card
              : mostVisible
          ), vaultCards[0]);
          const nextOpacity = Number(gsap.getProperty(nextVisibleCard, "opacity"));
          const visibleCard = nextOpacity > .05 ? nextVisibleCard : null;
          vaultCards.forEach((card) => setCardAccessible(card, card === visibleCard));
        };
        vault.classList.add("is-3d");
        vaultCards.forEach((card, index) => {
          setCardAccessible(card, index === 0);
          card.addEventListener("focusout", syncCardAccess);
          gsap.set(card, {
            xPercent: -50,
            yPercent: -50,
            z: index === 0 ? 0 : -index * 1450,
            opacity: index === 0 ? 1 : 0,
            filter: index === 0 ? "blur(0px)" : "blur(16px)",
          });
        });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: $(".vault-scroll-track", vault),
            start: "top top+=72",
            end: "bottom bottom",
            pin: vaultStage,
            scrub: .8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: syncCardAccess,
          },
        });

        vaultCards.forEach((card, index) => {
          const start = index * 2.4;
          timeline
            .to(card, {
              z: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 1.8,
              ease: "none",
            }, start)
            .to(card, {
              z: 450,
              opacity: 0,
              filter: "blur(20px)",
              duration: 1.2,
              ease: "none",
            }, start + 1.8);
        });

        if (glow) {
          timeline
            .to(glow, {
              background: "radial-gradient(circle at center, rgba(245, 158, 11, .22), transparent 70%)",
              duration: 3,
              ease: "none",
            }, 0)
            .to(glow, {
              background: "radial-gradient(circle at center, rgba(15, 23, 42, .3), transparent 60%)",
              duration: 3,
              ease: "none",
            }, 3.5);
        }

        return () => {
          if (lenis && syncLenis) {
            gsap.ticker.remove(syncLenis);
            lenis.destroy();
          }
          vault.classList.remove("is-3d");
          vaultCards.forEach((card) => {
            card.removeEventListener("focusout", syncCardAccess);
            card.inert = false;
            card.removeAttribute("aria-hidden");
          });
        };
      },
    );
  }

  const memorySecretZone = $(".memory-secret-zone");
  const memorySecretTrigger = $("#secret-memory-trigger");
  const memorySecretModal = $("#secret-memory-modal");
  const memorySecretClose = $("#close-secret-modal");
  if (memorySecretZone && memorySecretTrigger && memorySecretModal && typeof memorySecretModal.showModal === "function") {
    let memorySecretStage = 0;
    memorySecretTrigger.classList.add("easter-egg-word");
    memorySecretTrigger.setAttribute("tabindex", "0");
    memorySecretTrigger.setAttribute("role", "button");
    memorySecretTrigger.setAttribute("aria-haspopup", "dialog");
    memorySecretTrigger.setAttribute("aria-expanded", "false");
    memorySecretTrigger.setAttribute("aria-label", "Classified node: memory");
    memorySecretTrigger.setAttribute("aria-description", "Press Enter or Space to unlock this classified node, then press again to open it.");

    const unlockMemorySecret = () => {
      memorySecretStage = 3;
      memorySecretTrigger.classList.remove("has-disappeared");
      memorySecretTrigger.classList.add("is-unlocked");
    };
    const openMemorySecret = () => {
      memorySecretModal.showModal();
      memorySecretTrigger.setAttribute("aria-expanded", "true");
    };

    memorySecretZone.addEventListener("mouseenter", () => {
      if (memorySecretStage === 0) {
        memorySecretStage = 1;
        memorySecretTrigger.classList.add("has-disappeared");
      } else if (memorySecretStage === 2) {
        unlockMemorySecret();
      }
    });
    memorySecretZone.addEventListener("mouseleave", () => {
      if (memorySecretStage === 1) memorySecretStage = 2;
    });
    memorySecretZone.addEventListener("click", () => {
      if (memorySecretStage === 3) openMemorySecret();
      else unlockMemorySecret();
    });
    memorySecretTrigger.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (memorySecretStage === 3) openMemorySecret();
      else unlockMemorySecret();
    });
    memorySecretModal.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      memorySecretModal.close();
    });
    memorySecretClose?.addEventListener("click", () => memorySecretModal.close());
    memorySecretModal.addEventListener("close", () => {
      memorySecretTrigger.setAttribute("aria-expanded", "false");
    });
    memorySecretModal.addEventListener("click", (event) => {
      if (event.target === memorySecretModal) memorySecretModal.close();
    });
  }

  const stillCards = $$(".still-card");
  const stillDialog = $("#still-lightbox");
  $$("[data-gallery-filter]").forEach((filter) => {
    filter.addEventListener("click", () => {
      $$("[data-gallery-filter]").forEach((item) => {
        const selected = item === filter;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      stillCards.forEach((card) => {
        card.hidden = filter.dataset.galleryFilter !== "all" &&
          card.dataset.stillCategory !== filter.dataset.galleryFilter;
      });
    });
  });

  if (stillCards.length && stillDialog && typeof stillDialog.showModal === "function") {
    const stillButtons = $$(".still-trigger", stillDialog.ownerDocument);
    const stillImage = $("#lightbox-image", stillDialog);
    const stillScene = $("#lightbox-scene", stillDialog);
    const stillCategory = $("#lightbox-category", stillDialog);
    const stillMetadata = $("#lightbox-metadata", stillDialog);
    const stillDownload = $("#lightbox-download", stillDialog);
    const categoryNames = {
      clinic: "THE CLINIC",
      memories: "THE MEMORIES",
      "behind-the-scenes": "BEHIND THE SCENES / GEAR",
    };
    let currentStill = 0;

    const visibleStills = () => stillButtons.filter((button) => !button.closest(".still-card").hidden);
    const showStill = (button) => {
      const thumbnail = $("img", button);
      currentStill = visibleStills().indexOf(button);
      stillImage.src = thumbnail.src;
      stillImage.alt = thumbnail.alt;
      stillScene.textContent = button.dataset.sceneName;
      stillCategory.textContent = categoryNames[button.dataset.category] || "PRODUCTION STILL";
      stillMetadata.textContent = [
        button.dataset.aspectRatio,
        button.dataset.camera,
        button.dataset.lens,
      ].filter(Boolean).join(" / ");
      stillDownload.href = button.dataset.downloadUrl;
      stillDownload.download = button.dataset.downloadUrl.split("/").pop();
    };
    const stepStill = (direction) => {
      const visible = visibleStills();
      if (!visible.length) return;
      currentStill = (currentStill + direction + visible.length) % visible.length;
      showStill(visible[currentStill]);
    };

    stillButtons.forEach((button) => {
      button.addEventListener("click", () => {
        showStill(button);
        stillDialog.showModal();
      });
    });
    $(".lightbox-close", stillDialog)?.addEventListener("click", () => stillDialog.close());
    $(".lightbox-previous", stillDialog)?.addEventListener("click", () => stepStill(-1));
    $(".lightbox-next", stillDialog)?.addEventListener("click", () => stepStill(1));
    stillDialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        stillDialog.close();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepStill(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepStill(1);
      }
    });
    stillDialog.addEventListener("click", (event) => {
      if (event.target === stillDialog) stillDialog.close();
    });
  }

  const trailerVideo = $(".press-trailer");
  if (trailerVideo) {
    const chapterStatus = $("#trailer-chapter-status");
    $$(".trailer-chapter").forEach((button) => {
      button.addEventListener("click", () => {
        const time = Number(button.dataset.trailerTime);
        if (!Number.isFinite(time) || time < 0) {
          chapterStatus.textContent = "This chapter marker has an invalid time.";
          return;
        }
        if (!Number.isFinite(trailerVideo.duration)) {
          chapterStatus.textContent = "Wait for the trailer to load before choosing a chapter.";
          return;
        }
        if (time > trailerVideo.duration) {
          chapterStatus.textContent = "This chapter marker is outside the trailer duration.";
          return;
        }
        trailerVideo.currentTime = time;
        chapterStatus.textContent = `Playback position set to ${button.textContent.trim()}.`;
      });
    });
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
    observeScrollReveal($$(".memory-card", memoryFeed));
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

  $$(".memory-wall .filter-pill").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".memory-wall .filter-pill").forEach((pill) => {
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
  rsvpDialog?.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    rsvpDialog.close();
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
      document.getElementById(initialSection)?.scrollIntoView({ behavior: "instant", block: "start" });
    }, { once: true });
  }
})();
