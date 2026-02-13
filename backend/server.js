require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/customers", require("./routes/ClientRoutes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Running: http://localhost:${PORT}`);
});
