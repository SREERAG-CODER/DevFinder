const API = "http://localhost:5000/api";

// ── Protect route — if no token, back to login ────────
const token = localStorage.getItem("token");
const user  = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user) {
  window.location.href = "../Authentication/login.html";
}

// ── Load user data into page ──────────────────────────
document.getElementById("user-name").textContent    = user.name;
document.getElementById("user-email").textContent   = user.email;
document.getElementById("nav-name").textContent     = user.name;
document.getElementById("avatar").textContent       = user.name.charAt(0).toUpperCase();

if (user.bio) document.getElementById("user-bio").textContent = user.bio;

// Member since date
if (user.created_at) {
  const date = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long", year: "numeric"
  });
  document.getElementById("member-since").textContent = date;
}

// ── Logout ────────────────────────────────────────────
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../Authentication/login.html";
}