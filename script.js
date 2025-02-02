// Local storage keys
const USERS_KEY = "users";
const TRANSACTIONS_KEY = "transactions";
const PURCHASE_REQUESTS_KEY = "purchase_requests";
const ADMIN_CREDENTIALS_KEY = "admin_credentials";

// Initialize admin credentials
const ADMIN_CREDENTIALS = { username: "admin", password: "admin1122" };
if (!localStorage.getItem(ADMIN_CREDENTIALS_KEY)) {
  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(ADMIN_CREDENTIALS));
}

// Utility functions for local storage
function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFromStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

// Generate a secure and random user ID
function generateUserID() {
  return Math.random().toString(36).substring(2, 12).toUpperCase(); // 10-character alphanumeric ID
}

// Generate random game outcomes
function generateGameOutcomes() {
  const outcomes = [];
  const winValues = Array.from({ length: 9 }, () => Math.floor(Math.random() * 100) + 1);
  const loseValues = Array.from({ length: 9 }, () => Math.floor(Math.random() * 100) + 1);
  const donateValues = Array.from({ length: 9 }, () => Math.floor(Math.random() * 100) + 1);
  for (let i = 0; i < 9; i++) {
    outcomes.push({ type: "Win", value: winValues[i] });
    outcomes.push({ type: "Lose", value: -loseValues[i] });
    outcomes.push({ type: "Donate", value: -donateValues[i] });
    outcomes.push({ type: "Bomb", value: 0 });
  }
  return outcomes.sort(() => Math.random() - 0.5); // Shuffle outcomes
}

// Wrap logic in DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname;

  // === Admin Login ===
  if (currentPage.includes("admin-login.html")) {
    const adminLoginButton = document.getElementById("admin-login-btn");
    if (adminLoginButton) {
      adminLoginButton.addEventListener("click", () => {
        const username = document.getElementById("admin-username").value.trim();
        const password = document.getElementById("admin-password").value.trim();
        const credentials = getFromStorage(ADMIN_CREDENTIALS_KEY);

        if (credentials.username === username && credentials.password === password) {
          window.location.href = "admin-dashboard.html"; // Redirect to admin dashboard
        } else {
          document.getElementById("admin-login-feedback").textContent = "Invalid username or password.";
        }
      });
    }
  }

  // === User Login ===
  if (currentPage.includes("user-login.html")) {
    const loginButton = document.getElementById("login-btn");
    if (loginButton) {
      loginButton.addEventListener("click", () => {
        const loginCode = document.getElementById("login-code").value.trim();
        const users = getFromStorage(USERS_KEY);
        const user = users.find((u) => u.userID === loginCode);

        if (user) {
          localStorage.setItem("current_user", JSON.stringify(user));
          window.location.href = "user-game.html";
        } else {
          document.getElementById("login-feedback").textContent = "Invalid User Code.";
        }
      });
    }
  }

  // === Admin Dashboard ===
  if (currentPage.includes("admin-dashboard.html")) {
    const registerButton = document.getElementById("register-btn");
    const addCoinsButton = document.getElementById("add-coins");
    const viewWithdrawalsButton = document.getElementById("view-withdrawals");

    if (registerButton) {
      registerButton.addEventListener("click", () => {
        const fullName = document.getElementById("full-name").value.trim();
        if (!fullName) {
          document.getElementById("register-feedback").textContent = "Please enter a valid name.";
          return;
        }

        const users = getFromStorage(USERS_KEY);
        const userID = generateUserID();
        users.push({ userID, name: fullName, balance: 0 });
        saveToStorage(USERS_KEY, users);

        document.getElementById("register-feedback").textContent = `User registered! ID: ${userID}`;
        document.getElementById("full-name").value = "";
      });
    }

    if (addCoinsButton) {
      addCoinsButton.addEventListener("click", () => {
        const userID = document.getElementById("add-coins-user-code").value.trim();
        const amount = parseInt(document.getElementById("add-coins-amount").value, 10);
        const users = getFromStorage(USERS_KEY);
        const user = users.find((u) => u.userID === userID);

        if (!user || isNaN(amount) || amount <= 0) {
          document.getElementById("add-coins-feedback").textContent = "Invalid user ID or amount.";
          return;
        }

        user.balance += amount;
        saveToStorage(USERS_KEY, users);

        document.getElementById("add-coins-feedback").textContent = `Added ${amount} coins to ${userID}.`;
      });
    }

    if (viewWithdrawalsButton) {
      viewWithdrawalsButton.addEventListener("click", () => {
        const withdrawals = getFromStorage(TRANSACTIONS_KEY).filter((t) => t.type === "Withdrawal");
        const withdrawalList = document.getElementById("withdrawal-list");
        withdrawalList.innerHTML = withdrawals.length
          ? withdrawals
              .map(
                (t, index) =>
                  `<p>${t.userID} requested ${t.amount} coins 
                    <button class="btn btn-success btn-sm" onclick="approveWithdrawal(${index})">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="declineWithdrawal(${index})">Decline</button>
                  </p>`
              )
              .join("")
          : "<p>No withdrawal requests.</p>";
      });
    }
  }

  // === User Game ===
  if (currentPage.includes("user-game.html")) {
    const currentUser = JSON.parse(localStorage.getItem("current_user"));

    if (!currentUser) {
      window.location.href = "user-login.html";
      return;
    }

    document.getElementById("user-name").textContent = currentUser.name;
    document.getElementById("user-balance").textContent = `${currentUser.balance} Coins`;

    const gameBoard = document.getElementById("game-board");
    const outcomes = generateGameOutcomes();

    outcomes.forEach((outcome) => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.textContent = "Tap";

      card.addEventListener("click", () => {
        if (currentUser.balance < 10) {
          alert("Not enough coins! Please purchase more to continue.");
          return;
        }

        currentUser.balance -= 10;
        card.classList.add("revealed");
        card.textContent = outcome.value;

        if (outcome.type === "Win") currentUser.balance += outcome.value;

        currentUser.balance = Math.max(0, currentUser.balance); // Prevent negative balance
        localStorage.setItem("current_user", JSON.stringify(currentUser));
        document.getElementById("user-balance").textContent = `${currentUser.balance} Coins`;
      });

      gameBoard.appendChild(card);
    });
  }
});
