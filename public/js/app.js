const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

const socket = io({
  auth: {
    token: token,
  },
});

const statusSpan = document.getElementById("connection-status");
const qrCodeDiv = document.getElementById("qrcode");
const userInfoDiv = document.getElementById("user-info");
const waNameSpan = document.getElementById("wa-name");
const waNumberSpan = document.getElementById("wa-number");
const waLogoutBtn = document.getElementById("wa-logout-btn");
const logoutBtn = document.getElementById("logout-btn");
const apiKeyDisplay = document.getElementById("api-key-display");
const qrLoading = document.getElementById("qr-loading");

// Theme Toggle Logic
const themeToggle = document.getElementById("theme-toggle");
const lightIcon = document.getElementById("theme-toggle-light-icon");
const darkIcon = document.getElementById("theme-toggle-dark-icon");

function setTheme(theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    lightIcon.classList.remove("hidden");
    darkIcon.classList.add("hidden");
  } else {
    document.documentElement.classList.remove("dark");
    lightIcon.classList.add("hidden");
    darkIcon.classList.remove("hidden");
  }
  localStorage.setItem("theme", theme);
}

// Initialize theme
const savedTheme = localStorage.getItem("theme") || "dark"; // Default to dark
setTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.classList.contains("dark");
  setTheme(isDark ? "light" : "dark");
});

// Display API Key (Token for now, ideally strictly API Key)
// In a real app, you'd fetch a separate API Key. Here using JWT for simplicity or fetch profile.
apiKeyDisplay.innerText = token.substring(0, 12) + "...";

const copyTokenBtn = document.getElementById("copy-token-btn");
const copyToast = document.getElementById("copy-toast");

copyTokenBtn.addEventListener("click", () => {
  navigator.clipboard
    .writeText(token)
    .then(() => {
      // Show feedback
      copyToast.classList.remove("opacity-0");
      setTimeout(() => {
        copyToast.classList.add("opacity-0");
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
    });
});

socket.on("connect", () => {
  console.log("Connected to server via Socket.io");
});

socket.on("connect_error", (err) => {
  console.error("Connection Error:", err.message);
  if (err.message === "Authentication error") {
    alert("Session expired. Please login again.");
    window.location.href = "/login.html";
  }
});

const qrContainer = document.getElementById("qr-container");

socket.on("wa_status", (data) => {
  console.log("WA Status:", data);
  updateStatus(data.status);

  if (data.status === "connected" && data.user) {
    qrCodeDiv.innerHTML = "";
    qrContainer.classList.add("hidden");
    userInfoDiv.classList.remove("hidden");
    waNameSpan.innerText = data.user.name || "User";
    waNumberSpan.innerText = data.user.id || "Unknown";
    qrLoading.classList.add("hidden");
  } else if (data.status === "scan_qr") {
    userInfoDiv.classList.add("hidden");
    // qrContainer shown in wa_qr event, but ensure it's visible here too just in case
    qrContainer.classList.remove("hidden");
  } else if (data.status === "connecting") {
    userInfoDiv.classList.add("hidden");
    qrCodeDiv.innerHTML = "";
    qrContainer.classList.remove("hidden"); // Show container for loading state
    qrLoading.classList.remove("hidden"); // Show loading
  } else {
    userInfoDiv.classList.add("hidden");
    qrCodeDiv.innerHTML = "";
    qrContainer.classList.add("hidden");
    qrLoading.classList.add("hidden");
  }
});

socket.on("wa_qr", (qr) => {
  console.log("QR Received");
  updateStatus("scan_qr");
  qrContainer.classList.remove("hidden");
  qrLoading.classList.add("hidden");
  QRCode.toCanvas(qr, { margin: 2, scale: 6 }, function (err, canvas) {
    if (err) return console.error(err);
    qrCodeDiv.innerHTML = "";
    qrCodeDiv.appendChild(canvas);
  });
});

socket.on("wa_error", (msg) => {
  alert("WhatsApp Error: " + msg);
});

waLogoutBtn.addEventListener("click", () => {
  socket.emit("logout_wa");
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login.html";
});

function updateStatus(status) {
  statusSpan.className = ""; // Reset
  const baseClasses =
    "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-300";

  if (status === "connected") {
    statusSpan.className = `${baseClasses} bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]`;
    statusSpan.innerHTML =
      '<span class="w-2.5 h-2.5 rounded-full bg-green-500 mr-2.5 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse"></span>Connected';
  } else if (status === "scan_qr") {
    statusSpan.className = `${baseClasses} bg-blue-500/10 text-blue-400 border-blue-500/30`;
    statusSpan.innerHTML =
      '<span class="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2.5"></span>Scan QR code';
  } else if (status === "connecting") {
    statusSpan.className = `${baseClasses} bg-yellow-500/10 text-yellow-400 border-yellow-500/30`;
    statusSpan.innerHTML =
      '<span class="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2.5 animate-ping"></span>Connecting...';
  } else {
    statusSpan.className = `${baseClasses} bg-red-500/10 text-red-400 border-red-500/30`;
    statusSpan.innerHTML =
      '<span class="w-2.5 h-2.5 rounded-full bg-red-500 mr-2.5"></span>Disconnected';
  }
}

// Scheduler Logic
const scheduleForm = document.getElementById("schedule-form");

// UI Elements for dynamic form
const messageTypeSelect = document.getElementById("message-type");
const mediaInputs = document.getElementById("media-inputs");
const urlInputGroup = document.getElementById("url-input-group");
const fileInputGroup = document.getElementById("file-input-group");
const filenameInputGroup = document.getElementById("filename-input-group");
const filenameInput = document.getElementById("media-filename");
const messageLabel = document.getElementById("message-label");
const mediaSourceRadios = document.getElementsByName("media-source");
const messageContent = document.getElementById("message-content");
const fileInput = document.getElementById("media-file");

// Dynamic UI Handler
messageTypeSelect.addEventListener("change", () => {
  const type = messageTypeSelect.value;

  // Reset Media Source to URL by default when changing type
  if (type !== "text") {
    document.querySelector('input[name="media-source"][value="url"]').checked =
      true;
    urlInputGroup.classList.remove("hidden");
    fileInputGroup.classList.add("hidden");
  }

  // Show/Hide Filename Input based on type
  if (type === "document") {
    filenameInputGroup.classList.remove("hidden");
  } else {
    filenameInputGroup.classList.add("hidden");
  }

  if (type === "text") {
    mediaInputs.classList.add("hidden");
    messageLabel.innerText = "Message";
    messageContent.placeholder = "Type your message here...";
  } else {
    mediaInputs.classList.remove("hidden");
    messageLabel.innerText = "Caption (Optional)";
    messageContent.placeholder = "Add a caption...";
  }
});

// Auto-fill filename on file select
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    filenameInput.value = e.target.files[0].name;
  }
});

Array.from(mediaSourceRadios).forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "url") {
      urlInputGroup.classList.remove("hidden");
      fileInputGroup.classList.add("hidden");
    } else {
      urlInputGroup.classList.add("hidden");
      fileInputGroup.classList.remove("hidden");
    }
  });
});

scheduleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const number = document.getElementById("target-number").value;
  const message = document.getElementById("message-content").value;
  const time = document.getElementById("schedule-time").value;
  const type = messageTypeSelect.value;
  const filename = filenameInput.value;

  const formData = new FormData();
  formData.append("number", number);
  formData.append("time", time);
  formData.append("mediaType", type);
  if (message) formData.append("message", message);
  if (filename) formData.append("filename", filename);

  if (type !== "text") {
    const source = document.querySelector(
      'input[name="media-source"]:checked',
    ).value;
    if (source === "url") {
      const url = document.getElementById("media-url").value;
      if (!url) return alert("Please enter a Media URL");
      formData.append("mediaUrl", url);
    } else {
      if (fileInput.files.length === 0)
        return alert("Please select a file to upload");
      formData.append("file", fileInput.files[0]);
    }
  } else {
    if (!message) return alert("Message is required for text type");
  }

  // Validation for Document type
  if (type === "document") {
    if (!filename) {
      return alert("Filename is required for Document type");
    }
    if (!/\.[a-zA-Z0-9]+$/.test(filename)) {
      return alert(
        "Filename must include a valid extension (e.g. .pdf, .docx)",
      );
    }
  }

  // Loading State
  const submitBtn = scheduleForm.querySelector('button[type="submit"]');
  const originalBtnContent = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
      <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Sending...
  `;
  submitBtn.classList.add("opacity-75", "cursor-not-allowed");

  try {
    // Note: Content-Type header is not set manually for FormData, fetch handles it with boundary
    const response = await fetch("/api/schedule", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      alert("Scheduled successfully!");
      scheduleForm.reset(); // Clear form

      // Reset UI state
      mediaInputs.classList.add("hidden");
      messageLabel.innerText = "Message";
      messageTypeSelect.value = "text";

      fetchSchedules();
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to schedule");
  } finally {
    // Reset Button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnContent;
    submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
  }
});

async function fetchSchedules() {
  try {
    const response = await fetch("/api/schedules", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const schedules = await response.json();

    const list = document.getElementById("schedule-list");
    list.innerHTML = "";

    schedules.forEach((schedule) => {
      const li = document.createElement("li");
      li.className =
        "p-4 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-start justify-between group border-b border-gray-100 dark:border-gray-800 last:border-0";

      const timeFormatted = new Date(schedule.time).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      });
      let statusColor =
        "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
      if (schedule.status === "sent")
        statusColor =
          "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800";
      if (schedule.status === "pending")
        statusColor =
          "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800";
      if (schedule.status === "failed")
        statusColor =
          "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800";

      const mediaTypeBadge =
        schedule.mediaType && schedule.mediaType !== "text"
          ? `<span class="text-xs uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 ml-2">${schedule.mediaType}</span>`
          : "";

      li.innerHTML = `
                <div class="space-y-1">
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-gray-900 dark:text-white font-medium">${schedule.number}</span>
                        ${mediaTypeBadge}
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">${
                      schedule.message || "No caption"
                    }</p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-gray-500 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            ${timeFormatted}
                        </span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${statusColor}">
                            ${schedule.status}
                        </span>
                    </div>
                </div>
                <button onclick="deleteSchedule('${
                  schedule.id
                }')" class="text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
  }
}

async function deleteSchedule(id) {
  if (!confirm("Delete this schedule?")) return;
  try {
    await fetch(`/api/schedule/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchSchedules();
  } catch (error) {
    console.error("Error deleting:", error);
  }
}

// Initial fetch
fetchSchedules();
