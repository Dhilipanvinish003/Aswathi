require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection on startup and log status
(async () => {
  try {
    const [rows] = await db.promise().query(
      "SELECT DATABASE() AS db, NOW() AS server_time"
    );

    console.log("=================================");
    console.log("✅ LIVE DATABASE CONNECTED");
    console.log("Database:", rows[0].db);
    console.log("Server time:", rows[0].server_time);
    console.log("=================================");
  } catch (error) {
    console.error("❌ DATABASE CONNECTION FAILED");
    console.error(error.message);
  }
})();

module.exports = db;