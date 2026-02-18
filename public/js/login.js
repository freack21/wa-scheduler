const authForm = document.getElementById("auth-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const toggleAuth = document.getElementById("toggle-auth");
const formTitle = document.getElementById("form-title");
const messageDiv = document.getElementById("message");

let isRegister = false;

const toggleText = document.getElementById("toggle-text");

toggleAuth.addEventListener("click", () => {
  isRegister = !isRegister;
  formTitle.innerText = isRegister ? "Register" : "Welcome Back";
  submitBtn.innerText = isRegister ? "Sign Up" : "Sign In";

  toggleText.innerText = isRegister
    ? "Already have an account?"
    : "Don't have an account?";
  toggleAuth.innerText = isRegister ? "Login" : "Register";

  messageDiv.innerText = "";
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = usernameInput.value;
  const password = passwordInput.value;
  const endpoint = isRegister ? "/auth/register" : "/auth/login";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      if (isRegister) {
        // Auto switch to login or auto login
        messageDiv.style.color = "#2ecc71";
        messageDiv.innerText = "Registration successful! logging in...";
        // Attempt login immediately
        await login(username, password);
      } else {
        loginSuccess(data);
      }
    } else {
      messageDiv.style.color = "#ff6b6b";
      messageDiv.innerText = data.message;
    }
  } catch (error) {
    messageDiv.innerText = "An error occurred";
  }
});

async function login(username, password) {
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (response.ok) {
    loginSuccess(data);
  } else {
    messageDiv.style.color = "#ff6b6b";
    messageDiv.innerText = data.message;
  }
}

function loginSuccess(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  window.location.href = "/dashboard.html";
}
