(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const $$ = window.WrenSite.$$;
  const tabs = $$(".dossier-tab");
  const panel = $("#dossier-panel");
  const copy = $("[data-dossier-copy]");
  if (!tabs.length || !panel || !copy) return;

  const content = {
    client: ["tab-client", "FILE 143-A", "IDENTITY ", "████████████", " / MEMORY STATUS: FRAGMENTED"],
    subject: ["tab-subject", "FILE 143-B", "SUBJECT ", "████████", " / RECOLLECTION: PARTIAL"],
    staff: ["tab-staff", "FILE 143-C", "CASE OFFICER ", "███████████", " / CLEARANCE: LEVEL 04"],
  };

  function activate(tab) {
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });

    const [panelId, key, prefix, redaction, suffix] =
      content[tab.dataset.file];
    panel.setAttribute("aria-labelledby", panelId);
    $(".dossier-key", panel).textContent = key;
    copy.replaceChildren(document.createTextNode(prefix));
    const redacted = document.createElement("span");
    redacted.className = "redacted";
    redacted.textContent = redaction;
    copy.append(redacted, document.createTextNode(suffix));
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index +
              (event.key === "ArrowRight" ? 1 : -1) +
              tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      activate(tabs[nextIndex]);
    });
  });
})();
