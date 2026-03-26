const express = require("express");
const router = express.Router();
const db = require("../config/database");

router.post("/new",(req,res)=>{

 const {spare_name,type,quantity} = req.body;

 if(!spare_name || !type || !quantity){
  return res.status(400).json({message:"Required fields missing"});
 }

 const sql = "INSERT INTO sparesdata (spare_name,type,quantity) VALUES (?,?,?)";

 db.query(sql,[spare_name,type,quantity],(err,result)=>{

  if(err){
   console.error("DB ERROR:",err);
   return res.status(500).json({message:"Insert failed"});
  }

  const autoId = result.insertId;

  const spareId = `SPR-${String(autoId).padStart(3,'0')}`;

   res.json({success:true, spare_id: result.insertId});

 });

});

//Get All;

router.get("/all", (req, res)=>{

 const sql = "SELECT * FROM sparesdata";

 db.query(sql,(err, results)=>{

  if(err){
   console.error("DB error:", err);
   return res.status(500).json({message:"Failed to fetch data"});
  }

  res.json(results);

 });

});

//Update Qty;

router.put("/updateqty/:id", (req, res)=>{

 const {id} = req.params;
 const {quantity} = req.body;

 const sql = "UPDATE sparesdata SET quantity=? WHERE id=?";

 db.query(sql,[quantity, id], (err, result)=>{

  if(err){
   console.error("DB ERROR:", err);
   return res.status(500).json({message:"Update failed"});
  }

  res.json({success:true});

 });

});

// search Spare;

router.get("/search/:sparename", (req, res) => {

  const { sparename } = req.params;

  const sql = "SELECT * FROM sparesdata WHERE spare_name LIKE ?";

  db.query(sql, [`%${sparename}%`], (err, results) => {

    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "Search failed" });
    }

    res.json(results);

  });

});


module.exports = router;