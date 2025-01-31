const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(require("cors")());

// Paths for storing data
const USERS_FILE = path.join(__dirname, "users.json");
const TRANSACTIONS_FILE = path.join(__dirname, "transactions.json");

// Utility functions for reading/writing JSON files
function readJSONFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSONFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Routes
// === Admin ===
// Get all users
app.get("/admin/users", (req, res) => {
  const users = readJSONFile(USERS_FILE);
  res.json(users);
});

// Add coins to a user
app.post("/admin/add-coins", (req, res) => {
  const { userID, amount } = req.body;
  const users = readJSONFile(USERS_FILE);

  const user = users.find((u) => u.userID === userID);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.balance += amount;
  writeJSONFile(USERS_FILE, users);

  res.json({ message: `Added ${amount} coins to ${userID}.`, user });
});

// Get all transactions
app.get("/admin/transactions", (req, res) => {
  const transactions = readJSONFile(TRANSACTIONS_FILE);
  res.json(transactions);
});

// === User ===
// Login
app.post("/user/login", (req, res) => {
  const { userID } = req.body;
  const users = readJSONFile(USERS_FILE);

  const user = users.find((u) => u.userID === userID);
  if (!user) {
    return res.status(404).json({ error: "Invalid User ID" });
  }

  res.json({ message: "Login successful", user });
});

// Request withdrawal
app.post("/user/withdraw", (req, res) => {
  const { userID, amount } = req.body;
  const users = readJSONFile(USERS_FILE);
  const transactions = readJSONFile(TRANSACTIONS_FILE);

  const user = users.find((u) => u.userID === userID);
  if (!user || user.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  user.balance -= amount;
  transactions.push({ type: "Withdrawal", userID, amount, timestamp: new Date().toISOString() });

  writeJSONFile(USERS_FILE, users);
  writeJSONFile(TRANSACTIONS_FILE, transactions);

  res.json({ message: "Withdrawal request submitted", user });
});

// Purchase coins
app.post("/user/purchase", (req, res) => {
  const { userID, amount } = req.body;
  const transactions = readJSONFile(TRANSACTIONS_FILE);

  transactions.push({ type: "Purchase", userID, amount, timestamp: new Date().toISOString() });
  writeJSONFile(TRANSACTIONS_FILE, transactions);

  res.json({ message: "Purchase request submitted", amount });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
