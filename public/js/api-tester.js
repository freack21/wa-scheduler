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

// Persistence - Load Last Request
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

  if (params.toString()) {
    url += (url.includes("?") ? "&" : "?") + params.toString();
  }

  // Collect Headers
  const headers = {};
  document
    .getElementById("headers-container")
    .querySelectorAll(".flex")
    .forEach((row) => {
      const key = row.querySelector(".key-input").value;
      const value = row.querySelector(".value-input").value;
      if (key) headers[key] = value;
    });

  // Collect Body
  const bodyType = document.querySelector(
    'input[name="body-type"]:checked',
  ).value;
  let body = null;

  if (method !== "GET" && method !== "HEAD") {
    if (bodyType === "json") {
      try {
        const jsonStr = document.getElementById("json-input").value;
        if (jsonStr) {
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
            } else {
              const fileInput = row.querySelector(".value-input-file");
              if (fileInput.files.length > 0) {
                body.append(key, fileInput.files[0]);
              }
            }
          }
        });
      // Do NOT set Content-Type header for FormData, browser does it with boundary
    }
  }

  // Save State
  localStorage.setItem("last_request", JSON.stringify({ url, method }));

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
