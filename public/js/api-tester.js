// Theme Management
const themeToggle = document.getElementById("theme-toggle");
const sunIcon = document.getElementById("sun-icon");
const moonIcon = document.getElementById("moon-icon");

function setTheme(theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    sunIcon.classList.remove("hidden");
    moonIcon.classList.add("hidden");
  } else {
    document.documentElement.classList.remove("dark");
    sunIcon.classList.add("hidden");
    moonIcon.classList.remove("hidden");
  }
  localStorage.setItem("theme", theme);
}

// Initialize theme
const savedTheme = localStorage.getItem("theme") || "dark";
setTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.classList.contains("dark");
  setTheme(isDark ? "light" : "dark");
});

// UI Logic
const tabs = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // Deactivate all
    tabs.forEach((t) => {
      t.classList.remove(
        "active",
        "border-indigo-500",
        "text-indigo-600",
        "dark:text-indigo-400",
      );
      t.classList.add(
        "border-transparent",
        "text-gray-500",
        "dark:text-gray-400",
      );
    });
    tabContents.forEach((c) => c.classList.add("hidden"));

    // Activate clicked
    tab.classList.add(
      "active",
      "border-indigo-500",
      "text-indigo-600",
      "dark:text-indigo-400",
    );
    tab.classList.remove(
      "border-transparent",
      "text-gray-500",
      "dark:text-gray-400",
    );
    const targetId = "tab-" + tab.dataset.tab;
    document.getElementById(targetId).classList.remove("hidden");
  });
});

const resTabs = document.querySelectorAll(".res-tab-btn");
const resTabContents = document.querySelectorAll(".res-tab-content");

resTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    resTabs.forEach((t) => {
      t.classList.remove(
        "active",
        "border-indigo-500",
        "text-indigo-600",
        "dark:text-indigo-400",
      );
      t.classList.add("border-transparent", "text-gray-500");
    });
    resTabContents.forEach((c) => c.classList.add("hidden"));

    tab.classList.add(
      "active",
      "border-indigo-500",
      "text-indigo-600",
      "dark:text-indigo-400",
    );
    tab.classList.remove("border-transparent", "text-gray-500");
    const targetId = tab.dataset.tab;
    document.getElementById(targetId).classList.remove("hidden");
  });
});

// Body Type Logic
const bodyTypeRadios = document.getElementsByName("body-type");
const bodyJson = document.getElementById("body-json");
const bodyFormData = document.getElementById("body-form-data");

Array.from(bodyTypeRadios).forEach((radio) => {
  radio.addEventListener("change", (e) => {
    bodyJson.classList.add("hidden");
    bodyFormData.classList.add("hidden");

    if (e.target.value === "json") {
      bodyJson.classList.remove("hidden");
    } else if (e.target.value === "form-data") {
      bodyFormData.classList.remove("hidden");
    }
  });
});

// Row Management
const kvTemplate = document.getElementById("key-value-row-template");
const fdTemplate = document.getElementById("form-data-row-template");

function addKeyValuePair(containerId, key = "", value = "") {
  const container = document.getElementById(containerId);
  const clone = kvTemplate.content.cloneNode(true);
  if (key) clone.querySelector(".key-input").value = key;
  if (value) clone.querySelector(".value-input").value = value;
  container.appendChild(clone);
}

function addFormDataRow() {
  const container = document.getElementById("form-data-container");
  const clone = fdTemplate.content.cloneNode(true);
  container.appendChild(clone);
}

window.addKeyValuePair = addKeyValuePair;
window.addFormDataRow = addFormDataRow;
window.toggleValueInput = (select) => {
  const container = select.parentElement;
  const textInput = container.querySelector(".value-input-text");
  const fileInput = container.querySelector(".value-input-file");

  if (select.value === "text") {
    textInput.classList.remove("hidden");
    fileInput.classList.add("hidden");
  } else {
    textInput.classList.add("hidden");
    fileInput.classList.remove("hidden");
  }
};

// Initialization
addKeyValuePair("params-container");
addKeyValuePair("headers-container");
addFormDataRow();

// HISTORY MANAGEMENT
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const historyTemplate = document.getElementById("history-item-template");

let history = [];

function loadHistory() {
  try {
    const saved = localStorage.getItem("api_tester_history");
    history = saved ? JSON.parse(saved) : [];
  } catch (e) {
    history = [];
  }
  renderHistory();
}

function saveToHistory(req) {
  // Remove duplicate if exists (same method & url)
  // Or simple append to top. Let's just append to top and limit size.
  const newItem = {
    ...req,
    id: Date.now(),
    timestamp: Date.now(),
  };

  history.unshift(newItem);
  if (history.length > 50) history.pop(); // Limit to 50

  localStorage.setItem("api_tester_history", JSON.stringify(history));
  renderHistory();
}

function clearHistory() {
  if (confirm("Clear all history?")) {
    history = [];
    localStorage.removeItem("api_tester_history");
    renderHistory();
  }
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getMethodColorRaw(method) {
  switch (method) {
    case "GET":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "POST":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "PUT":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "PATCH":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "DELETE":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

function deleteHistoryItem(index, event) {
  event.stopPropagation(); // Prevent triggering restore
  if (confirm("Delete this item?")) {
    history.splice(index, 1);
    localStorage.setItem("api_tester_history", JSON.stringify(history));
    renderHistory();
  }
}

function renderHistory() {
  historyList.innerHTML = "";
  if (history.length === 0) {
    historyList.innerHTML = `
        <div class="text-center text-xs text-gray-400 mt-4">
            No history yet
        </div>
    `;
    return;
  }

  history.forEach((item, index) => {
    const clone = historyTemplate.content.cloneNode(true);
    const badge = clone.querySelector(".method-badge");
    badge.textContent = item.method;
    badge.className = `text-[10px] font-bold px-1.5 py-0.5 rounded method-badge ${getMethodColorRaw(
      item.method,
    )}`;

    clone.querySelector(".time-ago").textContent = formatTimeAgo(
      item.timestamp,
    );
    clone.querySelector(".url-text").textContent = item.url;

    // Click to restore
    const itemContainer = clone.querySelector(".group");
    itemContainer.onclick = () => restoreRequest(item);

    // Click to delete
    const deleteBtn = clone.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.onclick = (e) => deleteHistoryItem(index, e);
    }

    historyList.appendChild(clone);
  });
}

function restoreRequest(item) {
  document.getElementById("request-method").value = item.method;
  document.getElementById("request-url").value = item.url;

  // Restore Params
  const paramsContainer = document.getElementById("params-container");
  paramsContainer.innerHTML = "";
  if (item.params && item.params.length) {
    item.params.forEach((p) =>
      addKeyValuePair("params-container", p.key, p.value),
    );
  } else {
    addKeyValuePair("params-container");
  }

  // Restore Headers
  const headersContainer = document.getElementById("headers-container");
  headersContainer.innerHTML = "";
  if (item.headers && item.headers.length) {
    item.headers.forEach((h) =>
      addKeyValuePair("headers-container", h.key, h.value),
    );
  } else {
    addKeyValuePair("headers-container");
  }

  // Restore Body
  const bodyType = item.bodyType || "none";
  document.querySelector(
    `input[name="body-type"][value="${bodyType}"]`,
  ).checked = true;
  document
    .querySelector(`input[name="body-type"][value="${bodyType}"]`)
    .dispatchEvent(new Event("change")); // Trigger visibility logic

  if (bodyType === "json") {
    document.getElementById("json-input").value = item.bodyContent || "";
  } else if (bodyType === "form-data") {
    // NOTE: We cannot restore file objects for security reasons
    // But we can restore text fields
    const fdContainer = document.getElementById("form-data-container");
    fdContainer.innerHTML = "";
    if (item.bodyFormData && item.bodyFormData.length) {
      item.bodyFormData.forEach((fd) => {
        // We need a helper to add with values. addFormDataRow creates empty.
        // Let's create proper rows.
        const clone = fdTemplate.content.cloneNode(true);
        clone.querySelector(".key-input").value = fd.key;
        clone.querySelector(".type-select").value = fd.type;
        if (fd.type === "text") {
          clone.querySelector(".value-input-text").value = fd.value;
          clone.querySelector(".value-input-text").classList.remove("hidden");
          clone.querySelector(".value-input-file").classList.add("hidden");
        } else {
          clone.querySelector(".value-input-text").classList.add("hidden");
          clone.querySelector(".value-input-file").classList.remove("hidden");
        }
        fdContainer.appendChild(clone);
      });
    } else {
      addFormDataRow();
    }
  }
}

clearHistoryBtn.addEventListener("click", clearHistory);

// Initialization
loadHistory();

// If empty history, init empty rows
if (history.length === 0) {
  addKeyValuePair("params-container");
  addKeyValuePair("headers-container");
  addFormDataRow();
} else {
  // If we have history, maybe load the first one?
  // Or just load the last inputs from localStorage like before?
  // Let's keep the "last_request" logic separate or merge it.
  // The user probably expects the "last state" to be restored.
  // Let's rely on "last_request" logic below for initial state.
}

// Persistence - Load Last Request (Keep this for page reload state)
const lastReq = JSON.parse(localStorage.getItem("last_request") || "{}");
if (lastReq.url) document.getElementById("request-url").value = lastReq.url;
if (lastReq.method)
  document.getElementById("request-method").value = lastReq.method;

// REQUEST LOGIC
const sendBtn = document.getElementById("send-btn");

sendBtn.addEventListener("click", async () => {
  const method = document.getElementById("request-method").value;
  let url = document.getElementById("request-url").value;

  if (!url) return alert("Please enter a URL");

  // Collect Params
  const paramsContainer = document.getElementById("params-container");
  const params = new URLSearchParams();
  paramsContainer.querySelectorAll(".flex").forEach((row) => {
    const key = row.querySelector(".key-input").value;
    const value = row.querySelector(".value-input").value;
    if (key) params.append(key, value);
  });

  // Collect Params for History
  const paramsHistory = [];
  paramsContainer.querySelectorAll(".flex").forEach((row) => {
    const key = row.querySelector(".key-input").value;
    const value = row.querySelector(".value-input").value;
    if (key) paramsHistory.push({ key, value });
  });

  if (params.toString()) {
    url += (url.includes("?") ? "&" : "?") + params.toString();
  }

  // Collect Headers
  const headers = {};
  const headersHistory = [];
  document
    .getElementById("headers-container")
    .querySelectorAll(".flex")
    .forEach((row) => {
      const key = row.querySelector(".key-input").value;
      const value = row.querySelector(".value-input").value;
      if (key) {
        headers[key] = value;
        headersHistory.push({ key, value });
      }
    });

  // Collect Body
  const bodyType = document.querySelector(
    'input[name="body-type"]:checked',
  ).value;
  let body = null;
  let bodyContent = ""; // For history (JSON string)
  let bodyFormData = []; // For history

  if (method !== "GET" && method !== "HEAD") {
    if (bodyType === "json") {
      try {
        const jsonStr = document.getElementById("json-input").value;
        if (jsonStr) {
          bodyContent = jsonStr;
          body = JSON.stringify(JSON.parse(jsonStr)); // Validate parsing
          headers["Content-Type"] = "application/json";
        }
      } catch (e) {
        return alert("Invalid JSON in body");
      }
    } else if (bodyType === "form-data") {
      body = new FormData();
      document
        .getElementById("form-data-container")
        .querySelectorAll(".group")
        .forEach((row) => {
          const key = row.querySelector(".key-input").value;
          const type = row.querySelector(".type-select").value;

          if (key) {
            if (type === "text") {
              const value = row.querySelector(".value-input-text").value;
              body.append(key, value);
              bodyFormData.push({ key, type, value });
            } else {
              const fileInput = row.querySelector(".value-input-file");
              if (fileInput.files.length > 0) {
                body.append(key, fileInput.files[0]);
                bodyFormData.push({
                  key,
                  type,
                  value: "[File: " + fileInput.files[0].name + "]",
                });
              }
            }
          }
        });
      // Do NOT set Content-Type header for FormData, browser does it with boundary
    }
  }

  // Save State
  localStorage.setItem("last_request", JSON.stringify({ url, method }));

  // Save to History
  saveToHistory({
    method,
    url: document.getElementById("request-url").value, // Save original URL without extra params appended
    params: paramsHistory,
    headers: headersHistory,
    bodyType,
    bodyContent,
    bodyFormData,
  });

  // Prepare UI
  document.getElementById("response-empty").classList.add("hidden");
  document.getElementById("response-content").classList.add("hidden");
  document.getElementById("response-loading").classList.remove("hidden");
  document.getElementById("response-meta").classList.add("hidden");

  const startTime = Date.now();

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Process Response
    const size = res.headers.get("content-length");
    const formattedSize = size
      ? (size / 1024).toFixed(2) + " KB"
      : "Unknown Size";

    let resBody;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      resBody = await res.json();
    } else {
      resBody = await res.text();
    }

    // Render Meta
    const statusSpan = document.getElementById("res-status");
    statusSpan.textContent = `${res.status} ${res.statusText}`;
    statusSpan.className = `px-2 py-1 rounded ${
      res.ok
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    }`;
    document.getElementById("res-time").textContent = `${duration}ms`;
    document.getElementById("res-size").textContent = formattedSize;
    document.getElementById("response-meta").classList.remove("hidden");

    // Render Body
    const resBodyElem = document.getElementById("res-body");
    if (typeof resBody === "object") {
      resBodyElem.textContent = JSON.stringify(resBody, null, 2);
    } else {
      resBodyElem.textContent = resBody;
    }

    // Render Headers
    const headersList = document.getElementById("res-headers");
    headersList.innerHTML = "";
    res.headers.forEach((val, key) => {
      const div = document.createElement("div");
      div.className = "flex gap-2 text-xs font-mono";
      div.innerHTML = `<span class="font-semibold text-gray-600 dark:text-gray-400 min-w-[120px]">${key}:</span> <span class="text-gray-800 dark:text-gray-300 break-all">${val}</span>`;
      headersList.appendChild(div);
    });

    document.getElementById("response-content").classList.remove("hidden");
  } catch (err) {
    alert("Request Failed: " + err.message);
  } finally {
    document.getElementById("response-loading").classList.add("hidden");
  }
});
