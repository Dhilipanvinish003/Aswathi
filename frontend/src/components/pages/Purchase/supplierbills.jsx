import React,{ useState } from 'react';
import{ArrowLeft,Plus,X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SupplierBillForm from "../../forms/supplierbillform";
import { errorToast, successToast } from '../../ui/nottifications';

const SupplierBills = () => {

const navigate = useNavigate();
const [showform,setShowform] = useState(false);
const [billsdata , setbillsdata] = useState([]);
const [editOpen,setEditOpen] = useState(false);
const[selectedbill , setselectedbill]=useState(null);


// Fetch All Data;

 const Api_url = "http://localhost:3000/api";

// Fetch all Spare Data;
const bill = () => {
   fetch (`${Api_url}/bills/all`)
    .then(res => res.json())
    .then(data => setbillsdata(data))
    .catch(err => console.log(err)); 
} 

React.useEffect(  () => {
    bill();
  },[] );


  // Update Bill;

  const updatebill = async() =>{
     try{
       await fetch(`${Api_url}/bills/update/${selectedbill.id}`,{
         method:"PUT",
         headers:{
          "Content-Type":"application/json",
         },
         body:JSON.stringify({
          paid_amount:Number(selectedbill.paid_amount)
         }),
       });
       setEditOpen(false);
       bill();
       successToast("Bill Updated Successfully")
     } catch(error){
       console.log(error);
       errorToast("update Failed");
     }
  }


  return (
     <div className="min-h-screen">
       <div className="flex items-center justify-between mb-6">
    
     <div className="flex items-center gap-6">
   {/* Back Button */}
   <button
     onClick={()=> navigate("/purchase")}
     className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium"
   >
     <ArrowLeft size={16}/>
     Back
   </button>

   {/* HEADING */}
   <div>
     <h2 className="text-[24px] font-semibold text-[#101828]">
       Supplier & Bills
     </h2>
     <p className="text-[14px] text-[#667085] mt-1">
      Third-party repair service bills
     </p>
   </div>
 </div>
   
   {/* Add Button */}
      <div>
  <button onClick={ ()=> setShowform(true)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">
     <Plus size={16}/>
     Add New Bills
   </button>
</div>
</div>

  <div>
{showform && <SupplierBillForm onClose={()=>{ setShowform(false); bill();}}/>}   

</div>


 <div className="bg-white rounded-xl border h-[70vh] overflow-y-auto p-5">
      {/* Table */}
        <table className="w-full">
             <thead > 
                <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">INWARD ID</th>
                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">DATE</th>
                      <th className="text-left py-3 px-4  text-xs font-medium text-gray-500 ">SUPPLIER NAME</th>
                       <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">JOB ID</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">TOTAL AMOUNT</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">PAID AMOUNT</th>
                       <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">BALANCE AMOUNT</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">ACTIONS</th>



                         
                </tr>
             </thead>
             {/* body */}
               <tbody>
                 {billsdata.map((b,index)=>(  
                   <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50" >
                       <td className="py-3 px-4 text-sm text-gray-900">SUP-{String(b.id).padStart(3, "0")}</td>
                       <td className="py-3 px-4 text-sm text-gray-700">{b.bill_date}</td>
                       <td className="py-3 px-4 text-sm font-medium text-gray-900">{b.supplier_name}</td>
                       <td className="py-3 px-2 text-sm text-gray-700">{b.job_id}</td>
                       <td className="py-3 px-8 text-sm font-medium text-gray-900">{b.bill_amount}</td>
                       <td className="py-3 px-4 text-sm font-medium text-green-600">{b.paid_amount}</td>
                       <td className="py-3 px-4 text-sm font-medium text-red-600">{b.balance_amount}</td>
                        <td className="py-3 px-4 text-sm">
                            <button onClick={() => {setEditOpen(true); setselectedbill(b)}} variant="outline" size="sm" className="h-8 border py-1 px-3 rounded-lg hover:bg-gray-200">
                              Edit
                            </button>
                            
                          {editOpen && (
                         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 overflow-y-auto">
                        <div className="bg-white w-[400px] mt-[180px] rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">

                        <div className="flex justify-between mb-4">
                          <div>
                         <h2 className="font-semibold">Edit Bill - SPR-{String(b.id).padStart(3, "0")}</h2>
                         <p className="text-sm"> Update payment details for Elite PCB Repair Services</p>
                         </div>

                        <button onClick={()=>setEditOpen(false)}>
                          <X size={18}/>
                         </button>
                      </div>
  
                       <div>
                      <label className="text-sm font-medium">Total Amount</label>
                        <input
                       type="number"
                       value={selectedbill.bill_amount || ""}    
                       readOnly  
                       className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>
                      </div>

                       <div>
                        <label className="text-sm font-medium">Paid Amount</label>
                        <input
                       type="number"     
                        value={selectedbill?.paid_amount || ""}
                        onChange={(e) => setselectedbill({...selectedbill, paid_amount: e.target.value})}
                       className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>
                       </div>

                        <div className="flex justify-end gap-3 mt-4"> 
                        <button onClick={()=> setEditOpen(false)}>Cancel</button>

                        <button
                        onClick={updatebill}
                         className="bg-black text-white px-4 py-2 rounded">
                         Update
                       </button>

                       </div>

                      </div>
                    </div>
                    )}
                    </td>
                   </tr>
                  ))}
           </tbody> 
        </table>
  </div>

</div>
  )
};

export default SupplierBills;