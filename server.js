const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const USERS_FILE = path.join(__dirname, "data", "users.json");
const TRANSACTIONS_FILE = path.join(__dirname, "data", "transactions.json");

// Utility functions for reading/writing JSON files
function initializeFile(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

function readJSONFile(filePath) {
  initializeFile(filePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSONFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Load initial data
let users = readJSONFile(USERS_FILE);
let transactions = readJSONFile(TRANSACTIONS_FILE);

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
// === Admin ===
// Get all users
app.get("/admin/users", (req, res) => {
  res.json(users);
});

// Add coins to a user
app.post("/admin/add-coins", (req, res) => {
  const { userID, amount } = req.body;

  if (amount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than zero." });
  }

  const user = users.find((u) => u.userID === userID);

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  user.balance += amount;
  writeJSONFile(USERS_FILE, users);

  res.json({ message: `Added ${amount} coins to ${userID}.`, user });
});

// Get all transactions
app.get("/admin/transactions", (req, res) => {
  res.json(transactions);
});

// === User ===
// Login
app.post("/user/login", (req, res) => {
  const { userID } = req.body;
  const user = users.find((u) => u.userID === userID);

  if (!user) {
    return res.status(404).json({ error: "Invalid User ID." });
  }

  res.json({ message: "Login successful.", user });
});

// Request withdrawal
app.post("/user/withdraw", (req, res) => {
  const { userID, amount } = req.body;

  if (amount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than zero." });
  }

  const user = users.find((u) => u.userID === userID);

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  if (user.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance." });
  }

  user.balance -= amount;
  transactions.push({ type: "Withdrawal", userID, amount, timestamp: new Date().toISOString() });

  writeJSONFile(USERS_FILE, users);
  writeJSONFile(TRANSACTIONS_FILE, transactions);

  res.json({ message: "Withdrawal request submitted.", user });
});

// Purchase coins
app.post("/user/purchase", (req, res) => {
  const { userID, amount } = req.body;

  if (amount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than zero." });
  }

  const user = users.find((u) => u.userID === userID);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.balance += amount;
  writeJSONFile(USERS_FILE, users);

  transactions.push({ type: "Purchase", userID, amount, timestamp: new Date().toISOString() });
  writeJSONFile(TRANSACTIONS_FILE, transactions);

  res.json({
    message: "Purchase request submitted.",
    amount,
    cedis: (amount * 0.2).toFixed(2), // Display value in Ghana Cedis
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong on the server." });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
