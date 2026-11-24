(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const $$ = window.WrenSite.$$;
  const requestJSON = window.WrenSite.requestJSON;

  // Screening RSVP API integration and .ics calendar export.
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
      $("#rsvp-event-details").textContent =
        `${button.dataset.eventName} · ${button.dataset.location} · ${new Date(button.dataset.date).toLocaleString()}`;
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
    // ICS values escape backslashes and special characters with backslashes.
    return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  calendarButton?.addEventListener("click", () => {
    const eventDetails = screeningEvents[calendarButton.dataset.eventId];
    if (!eventDetails) return;

    const start = new Date(eventDetails.date);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const toCalendarDate = (date) =>
      date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//108 Wren Street//Screenings//EN",
      "BEGIN:VEVENT",
      `UID:${eventDetails.id}@108wrenstreet`,
      `DTSTAMP:${toCalendarDate(new Date())}`,
      `DTSTART:${toCalendarDate(start)}`,
      `DTEND:${toCalendarDate(end)}`,
      `SUMMARY:${escapeCalendarText(eventDetails.name)}`,
      `LOCATION:${escapeCalendarText(eventDetails.location)}`,
      "DESCRIPTION:108 Wren Street film screening",
      "END:VEVENT",
      "END:VCALENDAR",
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
})();
