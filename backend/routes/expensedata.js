const express = require("express");
const router = express.Router();
const db = require("../config/database");


router.post("/new",(req,res) => {
const { expense_date, category, expense_description, amount } = req.body;

if(!expense_date || !category || !amount || !expense_description){
    return res.status(400).json({message:"required fields missing"});
}

const amt = parseFloat(amount);   

const sql = `
INSERT INTO expenses
(expense_date, category, amount, expense_description)
VALUES (?,?,?,?)
`;

db.query(sql,
[expense_date, category, amt, expense_description],
(err,result)=>{
    if(err){
        console.log(err);
        return res.status(500).json({message:"database error"});
    }

    return res.json({success:true, id:result.insertId});
});
});

//Get all expense details

router.get("/all", (req, res) => {

    const sql = "SELECT * FROM expenses";
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Retrieval failed" });
      }
      res.json(results);
    });
  
  });



module.exports = router;