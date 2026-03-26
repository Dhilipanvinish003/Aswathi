const express = require("express");
const router = express.Router();
const db = require("../config/database");

router.get("/", (req, res) => {
  let sql = "SELECT * FROM purchase";
  let query = db.query(sql, (err, results) => {
    if (err) throw err;
    console.log(results);
    res.send(results);
  });
});

//Add  purahase Report;

router.post("/add",(req,res)=>{

    const {component_name,unit_price,quantity,total_amount} = req.body;
    if(
        !component_name || !unit_price ||!quantity || !total_amount){

            return res.status(400).json({message:"All fields are required"});
        }
     
    const sql = "INSERT INTO purchase(component_name,unit_price,quantity,total_amount) VALUES(?,?,?,?)";
    
    db.query(sql,[component_name, unit_price, quantity, total_amount], (err, result)=>{

        if(err) throw err;
        console.log(result);
        res.send(result);

    })
    res.json({success:true , id:result.insertId})    
});



module.exports = router;