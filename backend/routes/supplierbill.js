const express = require("express");
const router = express.Router();
const db = require("../config/database");

// GET ALL BILLS
router.get("/all", (req, res) => {
  const sql = "SELECT * FROM supplierbills  ORDER BY id ASC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});


// ADD BILL WITH AUTO JOB ID
router.post("/add", (req, res) => {

  const { supplier_name, bill_date, bill_amount,paid_amount} = req.body;

  // ✅ FIXED VALIDATION
  if (!supplier_name || !bill_date || !bill_amount) {
    return res.status(400).json({ error: "Fill the required fields" });
  }

  const year = new Date().getFullYear().toString().slice(-2);

  const jobSql = `
    SELECT job_id FROM supplierbills
    WHERE job_id LIKE 'JOB-${year}-%'
    ORDER BY id ASC LIMIT 1
  `;

  db.query(jobSql, (err, jobresults) => {

    if (err) return res.status(500).json({ error: "Database error" });

    let jobCount = 1;

    if (jobresults.length > 0) {
      const lastJobId = jobresults[0].job_id.split("-")[2];
      jobCount = Number(lastJobId) + 1;
    }

    const nextJob =
      `JOB-${year}-${String(jobCount).padStart(3, "0")}`;

      //Balance Calculate;
     
      const total = Number(bill_amount);
      const paid = Number(paid_amount || 0);
      const balance = total - paid;

    const insertsql = `
      INSERT INTO supplierbills
      (supplier_name, bill_date, bill_amount, paid_amount, balance_amount, job_id)
      VALUES (?,?,?,?,?,?) 
    `;

    db.query(
      insertsql,
      [supplier_name, bill_date, total, paid, balance, nextJob],
      (err, result) => {

        if (err) return res.status(500).json(err);

        return res.status(200).json({
          message: "New Bill Added",
          jobId: nextJob
        });
             
        res.json({ success: true, id:
          result.insertId,}); 
      }
    );

  });

});


//Update bill;
router.put("/update/:id",(req,res)=>{

  const {paid_amount} = req.body;
  const id = req.params.id;

  const getSql = `
    SELECT bill_amount FROM supplierbills
    WHERE id=?
  `;

  db.query(getSql,[id],(err,result)=>{

    if(err) return res.status(500).json(err);

    const total = result[0].bill_amount;
    const paid = Number(paid_amount);
    const balance = total - paid;

    const updateSql = `
      UPDATE supplierbills
      SET paid_amount=?, balance_amount=?
      WHERE id=?
    `;

    db.query(updateSql,[paid,balance,id],
    (err,result)=>{

      if(err) return res.status(500).json(err);

      res.json({success:true});
    });

  });

});
module.exports = router;