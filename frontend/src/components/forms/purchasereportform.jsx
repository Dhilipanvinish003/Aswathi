import React, { useState } from "react";
import { X } from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";


const Purchasereportform = ({onClose}) => {
 const[option,showoption]=useState(false)

 //Background scroll;

    useScrollLock(true);

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
           <div className="bg-white w-[500px] mt-[150px]  ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
             
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

           {/* FORMS */}
             <div>
              <form  className="space-y-2">
                       <div>
                      <label htmlFor="" className="text-sm font-medium" >Date</label>
                      <input type="date" 
                      className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" 
                      placeholder="Eg: Date " />
                   </div>

                   <div>
                      <label htmlFor="" className="text-sm font-medium">Supplier Name</label>
                      <input type="text"
                    //    value={supplier.supplier_name}
                    //    onChange={(e) => {setsupplier({...supplier, supplier_name:e.target.value})}}
                       className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" 
                       placeholder="Eg: ABC Suppliers" />
                   </div>
 
                   <div>
                      <label htmlFor="" className="text-sm font-medium">Bill No</label>
                      <input type="number"
                      placeholder="BILL-AUTO-GEN" 
                     disabled
                     className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" />
                      
                    </div>

                     <div>
                         <label htmlFor="" className="text-sm font-medium">Amount</label>
                         <input type="number" 
                          className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                          placeholder="0.00"/>
                        
                     </div>

                     <div className="relative">
                      <label htmlFor="" className="text-sm font-medium">Select Mode</label>
                      <input type="text"
                       onClick={() => showoption(true)}
                      className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                       placeholder="Select mode" />
                       
                        {
                        option && (
                        <div className="absolute top-17 left-0 mt-1 w-full bg-white shadow p-2 rounded-lg border z-10">
                            <ul className="leading-8 cursor-pointer">
                                <li className="block w-full px-3 hover:bg-gray-200 rounded-lg" onClick={() => showoption(false)} >Bank Transfer</li>
                                <li className="block w-full px-3  hover:bg-gray-200 rounded-lg"onClick={() => showoption(false)}  >Cash</li>
                                <li className="block w-full px-3  hover:bg-gray-200 rounded-lg" onClick={() => showoption(false)} >Upi</li>
                            </ul>
                        </div>
                        )}
                   </div>
                     

                   <div className="mt-10 pt-5 flex justify-end gap-3">
                      <button type="button" className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                        Cancel
                      </button>
                      <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800">
                        Save Payment
                      </button>
                   </div> 
             </form>

        </div>

           </div>
     </div>
  )
};
export default Purchasereportform;