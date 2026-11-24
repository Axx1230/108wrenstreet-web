(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const $$ = window.WrenSite.$$;
  const reducedMotion = window.WrenSite.reducedMotion;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const hardware = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  const lowPowerDevice = hardware <= 4 || memory <= 4;

  // Intake: gently push the appointment scene toward the viewer on scroll.
  const intake = $("#intake");
  if (intake) {
    const cameraMotion = gsap.matchMedia();
    cameraMotion.add("(prefers-reduced-motion: no-preference)", () => {
      const scene = $(".appointment-scene", intake);
      if (!scene || lowPowerDevice) return;
      gsap.to(scene, {
        scale: 1.16,
        y: -36,
        ease: "none",
        scrollTrigger: {
          trigger: intake,
          start: "top top",
          end: "bottom top",
          scrub: .35,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
        },
      });
    });
  }

  // Memory vault: a pinned 3D sequence for capable desktop devices.
  const vault = $("#memory-vault");
  const vaultCards = $$(".vault-artifact-card", vault || document);
  const vaultStage = $(".vault-viewport-stage", vault || document);
  if (vault && vaultCards.length && vaultStage) {
    const vaultMedia = gsap.matchMedia();
    vaultMedia.add(
      "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        if (lowPowerDevice) return;
        function setCardAccessible(card, active) {
          if (!active && card.contains(document.activeElement)) return;
          const hidden = String(!active);
          if (card.inert !== !active || card.getAttribute("aria-hidden") !== hidden) {
            card.inert = !active;
            card.setAttribute("aria-hidden", hidden);
          }
        }

        function syncCardAccess() {
          const nextVisibleCard = vaultCards.reduce((mostVisible, card) => (
            gsap.getProperty(card, "opacity") > gsap.getProperty(mostVisible, "opacity")
              ? card
              : mostVisible
          ), vaultCards[0]);
          const visibleCard =
            Number(gsap.getProperty(nextVisibleCard, "opacity")) > .05
              ? nextVisibleCard
              : null;
          vaultCards.forEach((card) =>
            setCardAccessible(card, card === visibleCard)
          );
        }

        vault.classList.add("is-3d");
        vaultCards.forEach((card, index) => {
          setCardAccessible(card, index === 0);
          card.addEventListener("focusout", syncCardAccess);
          gsap.set(card, {
            xPercent: -50,
            yPercent: -50,
            z: index === 0 ? 0 : -index * 280,
            opacity: index === 0 ? 1 : 0,
          });
        });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: $(".vault-scroll-track", vault),
            start: "top top+=72",
            end: "bottom bottom",
            pin: vaultStage,
            scrub: .35,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
            onUpdate: syncCardAccess,
          },
        });

        vaultCards.forEach((card, index) => {
          const start = index * 2.4;
          timeline
            .to(card, {
              z: 0,
              opacity: 1,
              duration: 1.8,
              ease: "none",
            }, start)
            .to(card, {
              z: 80,
              opacity: 0,
              duration: 1.2,
              ease: "none",
            }, start + 1.8);
        });

        return () => {
          vault.classList.remove("is-3d");
          vaultCards.forEach((card) => {
            card.removeEventListener("focusout", syncCardAccess);
            card.inert = false;
            card.removeAttribute("aria-hidden");
          });
        };
      }
    );
  }

  // Reconstruction flight: switch pinned memory cards as the visitor scrolls.
  const flight = $(".reconstruction");
  const desktopMotion = window.matchMedia(
    "(min-width: 1024px) and (hover: hover) and (pointer: fine)"
  );
  let scrollTriggerInstance;

  function setupFlight() {
    scrollTriggerInstance?.kill(true);
    scrollTriggerInstance = undefined;
    if (!flight) return;

    const cards = $$(".memory-flight > .flight-card", flight);
    const shouldPin =
      desktopMotion.matches &&
      cards.length > 0 &&
      gsap &&
      ScrollTrigger &&
      !lowPowerDevice;

    flight.classList.toggle("is-pinned", Boolean(shouldPin));
    if (!shouldPin) {
      cards.forEach((item, index) => {
        item.style.removeProperty("transform");
        item.style.removeProperty("opacity");
        item.style.zIndex = String(cards.length - index);
      });
      return;
    }

    const use3d = !reducedMotion.matches;
    cards.forEach((item, index) => {
      gsap.set(item, {
        xPercent: -50,
        yPercent: -50,
        z: use3d && index > 0 ? -70 : 0,
        y: use3d && index > 0 ? 20 : 0,
        scale: use3d && index > 0 ? .92 : 1,
        rotateY: 0,
        opacity: index === 0 ? 1 : 0,
        zIndex: index === 0 ? 10 : 1,
      });
    });

    const segmentDuration = 2.2;
    const holdDuration = 1.4;
    const exitDuration = .3;
    const enterDuration = .5;
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: flight,
        start: "top top+=72",
        end: () => `+=${window.innerHeight * 3}`,
        pin: true,
        scrub: .35,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
      },
    });

    for (let index = 0; index < cards.length - 1; index += 1) {
      const current = cards[index];
      const incoming = cards[index + 1];
      const exitAt = index * segmentDuration + holdDuration;
      const enterAt = exitAt + exitDuration;

      timeline.set(current, { zIndex: 1 }, exitAt);
      timeline.to(current, {
        ...(use3d ? {
          z: -80,
          y: -12,
          scale: .9,
          rotateY: index % 2 === 0 ? 3 : -3,
        } : {}),
        opacity: 0,
        duration: exitDuration,
        ease: "none",
      }, exitAt);
      timeline.set(incoming, { zIndex: 10 }, enterAt);
      timeline.to(incoming, {
        ...(use3d ? {
          z: 0,
          y: 0,
          scale: 1,
          rotateY: 0,
        } : {}),
        opacity: 1,
        duration: enterDuration,
        ease: "none",
      }, enterAt);
    }

    if (cards.length) {
      timeline.to({}, {
        duration: segmentDuration,
      }, (cards.length - 1) * segmentDuration);
    }

    scrollTriggerInstance = timeline.scrollTrigger;
    ScrollTrigger.refresh();
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  }

  window.addEventListener("load", setupFlight, { once: true });
  desktopMotion.addEventListener?.("change", setupFlight);
  reducedMotion.addEventListener?.("change", setupFlight);
})();
