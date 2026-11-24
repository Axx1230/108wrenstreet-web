(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const $$ = window.WrenSite.$$;
  const cards = $$(".still-card");
  const dialog = $("#still-lightbox");

  $$("[data-gallery-filter]").forEach((filter) => {
    filter.addEventListener("click", () => {
      $$("[data-gallery-filter]").forEach((item) => {
        const selected = item === filter;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      cards.forEach((card) => {
        card.hidden =
          filter.dataset.galleryFilter !== "all" &&
          card.dataset.stillCategory !== filter.dataset.galleryFilter;
      });
    });
  });

  if (!cards.length || !dialog ||
    typeof dialog.showModal !== "function") return;

  const buttons = $$(".still-trigger", dialog.ownerDocument);
  const image = $("#lightbox-image", dialog);
  const scene = $("#lightbox-scene", dialog);
  const category = $("#lightbox-category", dialog);
  const metadata = $("#lightbox-metadata", dialog);
  const download = $("#lightbox-download", dialog);
  const categoryNames = {
    clinic: "THE CLINIC",
    memories: "THE MEMORIES",
    "behind-the-scenes": "BEHIND THE SCENES / GEAR",
  };
  let currentStill = 0;

  function visibleStills() {
    return buttons.filter((button) =>
      !button.closest(".still-card").hidden
    );
  }

  function showStill(button) {
    const thumbnail = $("img", button);
    currentStill = visibleStills().indexOf(button);
    image.src = thumbnail.src;
    image.alt = thumbnail.alt;
    scene.textContent = button.dataset.sceneName;
    category.textContent =
      categoryNames[button.dataset.category] || "PRODUCTION STILL";
    metadata.textContent = [
      button.dataset.aspectRatio,
      button.dataset.camera,
      button.dataset.lens,
    ].filter(Boolean).join(" / ");
    download.href = button.dataset.downloadUrl;
    download.download = button.dataset.downloadUrl.split("/").pop();
  }

  function stepStill(direction) {
    const visible = visibleStills();
    if (!visible.length) return;
    currentStill = (currentStill + direction + visible.length) % visible.length;
    showStill(visible[currentStill]);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      showStill(button);
      dialog.showModal();
    });
  });
  $(".lightbox-close", dialog)?.addEventListener("click", () => dialog.close());
  $(".lightbox-previous", dialog)?.addEventListener("click", () => stepStill(-1));
  $(".lightbox-next", dialog)?.addEventListener("click", () => stepStill(1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepStill(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepStill(1);
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
