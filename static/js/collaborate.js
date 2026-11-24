(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const requestJSON = window.WrenSite.requestJSON;

  // Collaboration open-call form API integration.
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
      await requestJSON("/api/collaborate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      form.reset();
      feedback.textContent = "Thanks for reaching out. Your details have been received.";
    } catch (error) {
      feedback.textContent = error.message;
      feedback.classList.add("is-error");
    } finally {
      submit.disabled = false;
    }
  });
})();
