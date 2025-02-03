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

// Constants for coin conversion
const cediRate = 0.2; // 1 coin = 0.2 Ghana Cedis
const maxWithdrawRatio = 0.7; // Users can withdraw up to 70% of their balance

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

// Function to update the user list display
function updateUserList() {
  const users = getFromStorage(USERS_KEY);
  const userList = document.getElementById("user-list");
  if (userList) {
    userList.innerHTML = users.map(user => `<li>${user.name} (ID: ${user.userID})</li>`).join("");
  }
}

// Generate random game outcomes
function generateGameOutcomes() {
  const outcomes = [];
  const winValues = Array.from({ length: 9 }, () => Math.floor(Math.random() * 100) + 10);
  const loseValues = Array.from({ length: 9 }, () => Math.floor(Math.random() * 100) + 10);
  const donateValues = Array.from({ length: 9 }, () => Math.floor(Math.random() * 100) + 10);
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
    const viewPurchaseRequestsButton = document.getElementById("view-purchase-requests");

    if (registerButton) {
      registerButton.addEventListener("click", () => {
        document.getElementById("register-form").classList.toggle("hidden");
        document.getElementById("add-coins-form").classList.add("hidden");
        document.getElementById("withdrawal-list").classList.add("hidden");
        document.getElementById("purchase-request-list").classList.add("hidden");
      });

      document.getElementById("submit-register").addEventListener("click", () => {
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
        updateUserList(); // Update the user list display
      });
    }

    if (addCoinsButton) {
      addCoinsButton.addEventListener("click", () => {
        document.getElementById("add-coins-form").classList.toggle("hidden");
        document.getElementById("register-form").classList.add("hidden");
        document.getElementById("withdrawal-list").classList.add("hidden");
        document.getElementById("purchase-request-list").classList.add("hidden");
      });

      document.getElementById("submit-add-coins").addEventListener("click", () => {
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
        document.getElementById("withdrawal-list").classList.toggle("hidden");
        document.getElementById("register-form").classList.add("hidden");
        document.getElementById("add-coins-form").classList.add("hidden");
        document.getElementById("purchase-request-list").classList.add("hidden");
      });
    }

    if (viewPurchaseRequestsButton) {
      viewPurchaseRequestsButton.addEventListener("click", () => {
        document.getElementById("purchase-request-list").classList.toggle("hidden");
        document.getElementById("register-form").classList.add("hidden");
        document.getElementById("add-coins-form").classList.add("hidden");
        document.getElementById("withdrawal-list").classList.add("hidden");
      });
    }

    // Initial update of the user list display
    updateUserList();
  }

  // === User Game ===
  if (currentPage.includes("user-game.html")) {
    const currentUser = JSON.parse(localStorage.getItem("current_user"));

    if (!currentUser) {
      window.location.href = "user-login.html";
      return;
    }

    const updateDisplay = () => {
      document.getElementById("user-name").textContent = currentUser.name;
      document.getElementById("user-balance").textContent = `${currentUser.balance} Coins (GH₵${(currentUser.balance * cediRate).toFixed(2)})`;
    };

    updateDisplay();

    const outcomes = generateGameOutcomes();

    document.getElementById("tap-to-win").addEventListener("click", () => {
      if (currentUser.balance < 10) {
        alert("Not enough coins! Please purchase more to continue.");
        return;
      }

      currentUser.balance -= 10;
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      let outcomeText = "";

      switch (outcome.type) {
        case "Win":
          outcomeText = `You won ${outcome.value}!`;
          currentUser.balance += outcome.value;
          break;
        case "Lose":
          outcomeText = `You lost ${-outcome.value}!`;
          break;
        case "Donate":
          outcomeText = `You've donated ${-outcome.value}!`;
          break;
        case "Bomb":
          outcomeText = "Bomb!";
          break;
      }

      document.getElementById("game-outcome").textContent = outcomeText;

      currentUser.balance = Math.max(0, currentUser.balance); // Prevent negative balance
      localStorage.setItem("current_user", JSON.stringify(currentUser));
      updateDisplay();

      if (currentUser.balance < 10) {
        alert("Game deactivated. Please purchase more coins to play.");
        document.getElementById("tap-to-win").disabled = true;
      }
    });

    document.getElementById("purchase-coins").addEventListener("click", () => {
      const amount = parseInt(prompt("Enter amount of coins to purchase:"), 10);
      if (isNaN(amount) || amount <= 0) {
        alert("Invalid amount.");
        return;
      }

      currentUser.balance += amount;
      localStorage.setItem("current_user", JSON.stringify(currentUser));
      updateDisplay();
      document.getElementById("tap-to-win").disabled = false;
    });

    document.getElementById("withdraw-request-btn").addEventListener("click", () => {
      const maxWithdrawCoins = Math.floor(currentUser.balance * maxWithdrawRatio);
      const maxWithdrawCedis = (maxWithdrawCoins * cediRate).toFixed(2);
      document.getElementById("max-withdraw").textContent = `GH₵${maxWithdrawCedis}`;
      document.getElementById("withdraw-form").classList.toggle("hidden");
    });

    document.getElementById("submit-withdraw").addEventListener("click", () => {
      const amountCedis = parseFloat(document.getElementById("withdraw-amount").value, 10);
      const amountCoins = Math.floor(amountCedis / cediRate);
      const maxWithdrawCoins = Math.floor(currentUser.balance * maxWithdrawRatio);

      if (isNaN(amountCedis) || amountCedis <= 0 || amountCoins > maxWithdrawCoins) {
        document.getElementById("withdraw-feedback").textContent = "Invalid amount.";
        return;
      }

      currentUser.balance -= amountCoins;
      localStorage.setItem("current_user", JSON.stringify(currentUser));
      updateDisplay();
      document.getElementById("withdraw-feedback").textContent = `Withdrawal request submitted for GH₵${amountCedis.toFixed(2)}.`;

      const transactions = getFromStorage(TRANSACTIONS_KEY);
      transactions.push({
        type: "Withdrawal",
        userID: currentUser.userID,
        amount: amountCoins,
        timestamp: new Date().toISOString(),
      });
      saveToStorage(TRANSACTIONS_KEY, transactions);
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("current_user");
      window.location.href = "index.html"; // Logout redirects to index page
    });

    // Pause game every 60 seconds and resume after 2 minutes
    setInterval(() => {
      document.getElementById("tap-to-win").disabled = true;
      setTimeout(() => {
        document.getElementById("tap-to-win").disabled = false;
      }, 120000); // 2 minutes
    }, 60000); // 60 seconds
  }

  // === Register User Page ===
  if (currentPage.includes("register-user.html")) {
    document.getElementById("submit-register").addEventListener("click", () => {
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
      updateUserList(); // Update the user list display
    });

    // Initial update of the user list display
    updateUserList();
  }

  // === Add Coins Page ===
  if (currentPage.includes("add-coins.html")) {
    document.getElementById("submit-add-coins").addEventListener("click", () => {
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

  // === View Withdrawals Page ===
  if (currentPage.includes("view-withdrawals.html")) {
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
  }

  // === View Purchase Requests Page ===
  if (currentPage.includes("view-purchase-requests.html")) {
    const purchaseRequests = getFromStorage(PURCHASE_REQUESTS_KEY);
    const purchaseRequestList = document.getElementById("purchase-request-list");
    purchaseRequestList.innerHTML = purchaseRequests.length
      ? purchaseRequests
          .map(
            (request, index) =>
              `<p>${request.userID} requested ${request.amount} coins 
                <button class="btn btn-success btn-sm" onclick="approvePurchase(${index})">Approve</button>
                <button class="btn btn-danger btn-sm" onclick="declinePurchase(${index})">Decline</button>
              </p>`
          )
          .join("")
      : "<p>No purchase requests.</p>";
  }

  // Approve and Decline functions for admin dashboard
  window.approveWithdrawal = function (index) {
    const transactions = getFromStorage(TRANSACTIONS_KEY);
    const withdrawal = transactions[index];
    const users = getFromStorage(USERS_KEY);
    const user = users.find((u) => u.userID === withdrawal.userID);

    if (user) {
      user.balance -= withdrawal.amount;
      saveToStorage(USERS_KEY, users);
      transactions.splice(index, 1); // Remove the approved request
      saveToStorage(TRANSACTIONS_KEY, transactions);
      alert("Withdrawal approved.");
      location.reload();
    } else {
      alert("User not found.");
    }
  };

  window.declineWithdrawal = function (index) {
    const transactions = getFromStorage(TRANSACTIONS_KEY);
    transactions.splice(index, 1); // Remove the declined request
    saveToStorage(TRANSACTIONS_KEY, transactions);
    alert("Withdrawal declined.");
    location.reload();
  };

  window.approvePurchase = function (index) {
    const purchaseRequests = getFromStorage(PURCHASE_REQUESTS_KEY);
    const request = purchaseRequests[index];
    const users = getFromStorage(USERS_KEY);
    const user = users.find((u) => u.userID === request.userID);

    if (user) {
      user.balance += request.amount;
      saveToStorage(USERS_KEY, users);
      purchaseRequests.splice(index, 1); // Remove the approved request
      saveToStorage(PURCHASE_REQUESTS_KEY, purchaseRequests);
      alert("Purchase approved.");
      location.reload();
    } else {
      alert("User not found.");
    }
  };

  window.declinePurchase = function (index) {
    const purchaseRequests = getFromStorage(PURCHASE_REQUESTS_KEY);
    purchaseRequests.splice(index, 1); // Remove the declined request
    saveToStorage(PURCHASE_REQUESTS_KEY, purchaseRequests);
    alert("Purchase declined.");
    location.reload();
  };
});
