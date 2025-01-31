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
  // === Admin Login ===
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

  // === Register a New User (Admin Feature) ===
  const registerButton = document.getElementById("register-btn");
  if (registerButton) {
    registerButton.addEventListener("click", () => {
      const fullName = document.getElementById("full-name").value.trim();
      if (!fullName) {
        document.getElementById("register-feedback").textContent = "Please enter a valid name.";
        return;
      }

      const users = getFromStorage(USERS_KEY);
      const userID = generateUserID(); // Generate a random user ID
      users.push({ userID, name: fullName, balance: 0 });
      saveToStorage(USERS_KEY, users);

      document.getElementById("register-feedback").textContent = `User registered! ID: ${userID}`;
      document.getElementById("full-name").value = ""; // Clear input field
    });
  }

  // === Add Coins to a User (Admin Feature) ===
  const addCoinsButton = document.getElementById("add-coins");
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
      document.getElementById("add-coins-user-code").value = ""; // Clear input fields
      document.getElementById("add-coins-amount").value = "";
    });
  }

  // === View Withdrawal Requests (Admin Feature) ===
  const viewWithdrawalsButton = document.getElementById("view-withdrawals");
  if (viewWithdrawalsButton) {
    viewWithdrawalsButton.addEventListener("click", () => {
      const withdrawals = getFromStorage(TRANSACTIONS_KEY).filter((t) => t.type === "Withdrawal");
      const withdrawalList = document.getElementById("withdrawal-list");
      withdrawalList.innerHTML = withdrawals.length
        ? withdrawals.map((t) => `<p>${t.userID}: ${t.amount} coins</p>`).join("")
        : "<p>No withdrawal requests.</p>";
    });
  }

  // === View Coin Purchase Requests (Admin Feature) ===
  const viewPurchaseRequestsButton = document.getElementById("view-purchase-requests");
  if (viewPurchaseRequestsButton) {
    viewPurchaseRequestsButton.addEventListener("click", () => {
      const purchaseRequests = getFromStorage(PURCHASE_REQUESTS_KEY);
      const requestList = document.getElementById("purchase-request-list");
      requestList.innerHTML = purchaseRequests.length
        ? purchaseRequests
            .map(
              (r, index) =>
                `<p>${r.userID} requested ${r.amount} coins 
                  <button class="btn btn-success btn-sm" onclick="approvePurchase(${index})">Approve</button>
                  <button class="btn btn-danger btn-sm" onclick="declinePurchase(${index})">Decline</button>
                </p>`
            )
            .join("")
        : "<p>No purchase requests.</p>";
    });
  }

  // === Approve a Coin Purchase (Admin Feature) ===
  window.approvePurchase = (index) => {
    const purchaseRequests = getFromStorage(PURCHASE_REQUESTS_KEY);
    const request = purchaseRequests[index];
    const users = getFromStorage(USERS_KEY);
    const user = users.find((u) => u.userID === request.userID);

    if (user) {
      user.balance += request.amount;
      saveToStorage(USERS_KEY, users);
      purchaseRequests.splice(index, 1);
      saveToStorage(PURCHASE_REQUESTS_KEY, purchaseRequests);
      alert(`Approved ${request.amount} coins for ${request.userID}.`);
      document.getElementById("view-purchase-requests").click(); // Refresh the request list
    }
  };

  // === Decline a Coin Purchase (Admin Feature) ===
  window.declinePurchase = (index) => {
    const purchaseRequests = getFromStorage(PURCHASE_REQUESTS_KEY);
    purchaseRequests.splice(index, 1);
    saveToStorage(PURCHASE_REQUESTS_KEY, purchaseRequests);
    alert("Purchase request declined.");
    document.getElementById("view-purchase-requests").click(); // Refresh the request list
  };

  // === User Login ===
  const userLoginButton = document.getElementById("login-btn");
  if (userLoginButton) {
    userLoginButton.addEventListener("click", () => {
      const userID = document.getElementById("login-code").value.trim();
      const users = getFromStorage(USERS_KEY);
      const user = users.find((u) => u.userID === userID);

      if (!user) {
        document.getElementById("login-feedback").textContent = "Invalid user ID.";
        return;
      }

      // Store current user session
      localStorage.setItem("current_user", JSON.stringify(user));

      // Redirect to game page
      window.location.href = "user-game.html";
    });
  }

  // === Initialize Game Page for Logged-in User ===
  if (document.getElementById("user-name")) {
    const user = JSON.parse(localStorage.getItem("current_user"));
    if (!user) {
      // Redirect to login if no user session exists
      window.location.href = "user-login.html";
    } else {
      // Display user details on the game page
      document.getElementById("user-name").textContent = user.name;
      document.getElementById("user-balance").textContent = user.balance;

      // Handle Purchase Coins button
      const purchaseCoinsButton = document.getElementById("purchase-coins");
      purchaseCoinsButton.addEventListener("click", () => {
        const amount = prompt("Enter the number of coins to purchase:");
        if (amount && amount > 0) {
          const purchaseRequests = getFromStorage(PURCHASE_REQUESTS_KEY);
          purchaseRequests.push({ userID: user.userID, amount: parseInt(amount, 10) });
          saveToStorage(PURCHASE_REQUESTS_KEY, purchaseRequests);
          alert("Purchase request submitted!");
        } else {
          alert("Invalid amount.");
        }
      });

      // Generate the game grid
      generateGameGrid(user);
    }
  }

  // === Logout User ===
  const logoutUserButton = document.getElementById("logout-btn");
  if (logoutUserButton) {
    logoutUserButton.addEventListener("click", () => {
      localStorage.removeItem("current_user"); // Clear user session
      window.location.href = "user-login.html"; // Redirect to user login
    });
  }

  // === Generate Game Grid ===
  function generateGameGrid(user) {
    const gameBoard = document.getElementById("game-board");
    gameBoard.innerHTML = ""; // Clear existing grid

    for (let i = 0; i < 36; i++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.textContent = "?";
      square.addEventListener("click", () => revealSquare(square, user));
      gameBoard.appendChild(square);
    }
  }

  // === Reveal a Square ===
  function revealSquare(square, user) {
    if (square.classList.contains("revealed")) return;

    const outcomes = [
      { type: "Win", value: getRandomValue(10, 1000, 100) },
      { type: "Lose", value: getRandomValue(10, 1000, 100) },
      { type: "Donate", value: getRandomValue(10, 1000, 100) },
      { type: "Bomb", value: 0 }
    ];

    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    square.classList.add("revealed");
    square.textContent = outcome.type === "Bomb" ? "💣 Bomb!" : `${outcome.type} ${outcome.value}`;

    if (outcome.type === "Win") {
      user.balance += outcome.value;
    } else if (outcome.type === "Lose" || outcome.type === "Donate") {
      user.balance -= outcome.value;
    }
    saveToStorage("current_user", user);
    document.getElementById("user-balance").textContent = user.balance;
  }

  // Generate a random value with intervals
  function getRandomValue(min, max, step) {
    const range = Math.floor((max - min) / step) + 1;
    return Math.floor(Math.random() * range) * step + min;
  }
});
