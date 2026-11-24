(() => {
  "use strict";

  const $ = window.WrenSite.$;
  const $$ = window.WrenSite.$$;
  const observeScrollReveal = window.WrenSite.observeScrollReveal;
  const requestJSON = window.WrenSite.requestJSON;

  // Memory wall API integration and rendering.
  const memoryFeed = $("#memory-feed");
  const memoryForm = $("#memory-form");
  const memoryFeedback = $("#memory-feedback");
  let activeFilter = "ALL";
  let memoryRequestId = 0;

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ""
      : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
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
    // Ignore an older response if the user has already selected another filter.
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

  async function loadMemoryTotal() {
    const total = $("#memory-total");
    if (!total) return;
    try {
      const data = await requestJSON("/api/memories/count");
      total.textContent = `MEMORIES ON THE WALL: ${data.total}`;
    } catch (_error) {
      total.textContent = "";
    }
  }

  loadMemoryTotal();
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
      await loadMemoryTotal();
    } catch (error) {
      memoryFeedback.textContent = error.message;
      memoryFeedback.classList.add("is-error");
    } finally {
      submit.disabled = false;
    }
  });
})();
