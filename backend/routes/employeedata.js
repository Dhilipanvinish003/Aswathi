const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.post('/new', (req, res) => {
    console.log("REQ BODY:", req.body);
    const {employee_name, designation,department,contact,address,pincode,identification } 
    = req.body;

    if (!employee_name || !designation || !department || !contact || !address || !pincode || !identification) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    const sql = `
      INSERT INTO employeedata
       (employee_name, designation, department, contact, address, pincode, identification)
      VALUES (?,  ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [employee_name, designation, department, contact, address, pincode, identification], (err, result) => {
        if (err) {
            console.error("DB ERROR:", err);
            return res.status(500).json({ message: "Insert failed" });
        }
        res.json({ success: true, id: result.insertId });;
    });
});

// Get all employees

 router.get('/all', (req, res) => {
  
    const sql = "SELECT * FROM employeedata";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("DB ERROR:", err);
            return res.status(500).json({ message: "Failed to fetch employees" });
        }
        res.json({ success: true, employees: results });
    });

 });

// Search employees

router.get("/search", (req,res)=>{
    const {q} = req.query;

    if(!q){
        return res.json([]);
    }           

    const search = `%${q}%`;

    const sql = `   
    SELECT id, employee_name, designation, department, contact FROM employeedata
    WHERE employee_name LIKE ? OR designation LIKE ? OR department LIKE ?`;

    db.query(sql, [search, search, search], (err, results) => {
        if (err) {
            console.error("DB ERROR:", err);
            return res.status(500).json({ message: "Search failed" });
        }
        res.json(results);
    });
});

//Edit employee data

router.put("/edit/:id", (req, res) => {
    const {id} = req.params;
    const {employee_name, designation, department, contact, address, pincode, identification} = req.body;

    const sql = `
    UPDATE employeedata
    SET employee_name=?, designation=?, department=?, contact=?, address=?, pincode=?, identification=?
    WHERE id=?
    `;

    db.query(sql, [employee_name, designation, department, contact, address, pincode, identification, id], (err, result) => {
        if (err) {
            console.error("DB ERROR:", err);
            return res.status(500).json({ message: "Update failed" });
        }
        res.json({success: true});
    });
});

module.exports = router;