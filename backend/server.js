require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/customers", require("./routes/ClientRoutes"));
app.use("/api/employees", require("./routes/employeedata"));
app.use("/api/Sparemodels", require("./routes/sparemodel"));
app.use("/api/Services", require("./routes/services"));
app.use("/api/expenses", require("./routes/expensedata"));
app.use("/api/spares", require("./routes/stocksdata"));
app.use("/api/components", require("./routes/componentdata"));
app.use("/api/bills",require("./routes/supplierbill"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Running: http://localhost:${PORT}`);
});
