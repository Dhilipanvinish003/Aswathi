import React, { useState } from "react";
import { X } from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { errorToast, successToast } from "../ui/nottifications";

const SupplierBillForm = ({onClose}) => {
 
    // Background Scroll Lock;
    useScrollLock(true);
 const [supplier,setsupplier] = useState({
   supplier_name:'',
    bill_date:'',
    jobId:'',
    bill_amount:'',
    paid_amount: ''
 }); 
    

const Api_url = "http://localhost:3000/api/"

// Save Bill;

 const saveBill = async (e) => {
  e.preventDefault();

  try {

    const response = await fetch(`${Api_url}bills/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        supplier_name: supplier.supplier_name,
        bill_date: supplier.bill_date,
        bill_amount: Number(supplier.bill_amount),
        paid_amount: Number(supplier.paid_amount || 0)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    successToast("Bill Saved Successfully");
    onClose();

  } catch (err) {
    console.error(err);
    errorToast("Failed  Add");
  }
};


  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
      {/* Model */}
       <div className="bg-white w-[500px]  ml-20 rounded-xl shadow-lg p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-black text-lg font-semibold">Add New Bill</h2>
                 <p className="text-gray-400 text-sm ">Enter the bill details below.</p>
              </div>
              <div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <X size={18}/>
                </button>
              </div>
       </div>
   
        {/* Form */}

           <div>
              <form  onSubmit={saveBill} className="space-y-2">
                <div className="grid grid-cols-2 gap-4">               
                       <div>
                      <label htmlFor="" className="text-sm font-medium" >Inward ID</label>
                      <input type="number" 
                       disabled
                      className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" 
                      placeholder="Eg: INW001" />
                   </div>

                   <div>
                      <label htmlFor="" className="text-sm font-medium">Supplier Name</label>
                      <input type="text"
                       value={supplier.supplier_name}
                       onChange={(e) => {setsupplier({...supplier, supplier_name:e.target.value})}}
                       className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" 
                       placeholder="Eg: ABC Suppliers" />
                   </div>
                   </div>
 
                  <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label htmlFor="" className="text-sm font-medium">Date</label>
                      <input type="date" 
                       value={supplier.bill_date}
                       onChange={(e) => {setsupplier({...supplier,bill_date:e.target.value})}}
                       className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" />
                      
                    </div>

                     <div>
                         <label htmlFor="" className="text-sm font-medium">Job ID</label>
                         <input type="number" 
                          disabled
                          className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                          placeholder="JOB-AUTO-GEN"/>
                        
                     </div>
               </div>

                     <div>
                      <label htmlFor="" className="text-sm font-medium">Amount</label>
                      <input type="number"
                      value={supplier.bill_amount}
                      onChange={(e) => {setsupplier({...supplier, bill_amount:e.target.value})}} 
                      className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                       placeholder="0.00" />
                   </div>
                     
                     <div>
                      <label htmlFor="" className="text-sm font-medium">Paid Amount</label>
                      <input type="number"
                      value={supplier.paid_amount}
                      onChange={(e) => {setsupplier({...supplier, paid_amount:e.target.value})}} 
                      className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                       placeholder="0.00" />
                   </div>

                   <div className="mt-10 pt-5 flex justify-end gap-3">
                      <button type="button" className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                        Cancel
                      </button>
                      <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800">
                        Save Bill
                      </button>
                   </div> 
             </form>

        </div>
       </div>
    </div>
  )
};

export default SupplierBillForm;