(() => {
  "use strict";

  // Shared browser transport for same-origin API requests.
  // This module owns JSON headers and API error normalization, while each
  // feature module owns only its endpoint URL and UI updates.
  window.WrenSite = window.WrenSite || {};
  window.WrenSite.requestJSON = async function requestJSON(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch (_error) {
      throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(data.error || "The request could not be completed.");
    }
    return data;
  };
})();
