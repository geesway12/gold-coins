// Local storage keys
const USERS_KEY = "users";
const TRANSACTIONS_KEY = "transactions";
const PURCHASE_REQUESTS_KEY = "purchase_requests";
const ADMIN_CREDENTIALS_KEY = "admin_credentials";

// Initialize admin credentials (only once)
const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };
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

// Wrap logic in DOMContentLoaded to ensure elements are loaded
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname;

  // === Admin Login ===
  if (currentPage.includes("admin-login.html")) {
    const adminLoginButton = document.getElementById("admin-login-btn");
    if (adminLoginButton) {
      adminLoginButton.addEventListener("click", () => {
        const username = document.getElementById("admin-username").value.trim();
        const password = document.getElementById("admin-password").value.trim();
        const credentials = JSON.parse(localStorage.getItem(ADMIN_CREDENTIALS_KEY));

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
          // Save user session
          localStorage.setItem("current_user", JSON.stringify(user));
          // Redirect to the user game page
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

    // Register New User
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

    // Add Coins to User
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
        document.getElementById("add-coins-user-code").value = "";
        document.getElementById("add-coins-amount").value = "";
      });
    }

    // View Withdrawal Requests
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

    // Approve/Decline Withdrawal Requests
    window.approveWithdrawal = (index) => {
      const withdrawals = getFromStorage(TRANSACTIONS_KEY).filter((t) => t.type === "Withdrawal");
      withdrawals.splice(index, 1);
      saveToStorage(TRANSACTIONS_KEY, withdrawals);
      alert("Withdrawal approved.");
      document.getElementById("view-withdrawals").click();
    };

    window.declineWithdrawal = (index) => {
      const withdrawals = getFromStorage(TRANSACTIONS_KEY).filter((t) => t.type === "Withdrawal");
      withdrawals.splice(index, 1);
      saveToStorage(TRANSACTIONS_KEY, withdrawals);
      alert("Withdrawal declined.");
      document.getElementById("view-withdrawals").click();
    };

    // Logout
    const logoutAdminButton = document.getElementById("logout-admin");
    if (logoutAdminButton) {
      logoutAdminButton.addEventListener("click", function () {
        window.location.href = "index.html";
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

    function initializeGameBoard() {
      gameBoard.innerHTML = "";
      const outcomes = generateGameOutcomes();
      outcomes.forEach((outcome) => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.dataset.type = outcome.type;
        card.dataset.value = outcome.value;

        card.addEventListener("click", () => {
          if (!card.classList.contains("revealed") && currentUser.balance >= 10) {
            currentUser.balance -= 10;
            card.classList.add("revealed");
            card.textContent = outcome.value;

            if (outcome.type === "Win") currentUser.balance += outcome.value;
            else if (outcome.type === "Lose" || outcome.type === "Donate") currentUser.balance -= outcome.value;

            currentUser.balance = Math.max(0, currentUser.balance); // Prevent negative balance

            localStorage.setItem("current_user", JSON.stringify(currentUser));
            document.getElementById("user-balance").textContent = `${currentUser.balance} Coins`;

            if (currentUser.balance <= 10) {
              alert("Low balance! Please purchase coins to continue.");
            }
          }
        });

        gameBoard.appendChild(card);
      });
    }

    initializeGameBoard();
  }
  
});
