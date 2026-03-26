import React, {useState } from "react";
import{X} from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";
import axios from "axios";
import { errorToast, successToast } from "../ui/nottifications";

const StockForm = ({onClose}) => {
const[activetab,setactivetab]=useState("Spare");
const[open,setopen] = useState(false);

//Background Lock
useScrollLock(true);

//Save Stock;
 const Api_url = "http://localhost:3000/api";

// Spare Data;
const [sparedata , setsparedata] = useState({
 spare_name:"",
 type:"",
 quantity:""
});


// Commponent Data;

const [componentdata , setcomponentdata] = useState({
 component_name:"",
 quantity:""
});

//saveStock

const savestock = async(e)=>{
 e.preventDefault();

 try{

  // Spare Save
  if(activetab === "Spare"){
   await axios.post(`${Api_url}/spares/new`,sparedata);
   successToast("Spare saved successfully");
  }

  // COMPONENT SAVE (create separate route later)
   if(activetab === "Component"){
   await axios.post(`${Api_url}/components/new`,componentdata);
   successToast("Component saved successfully");
  }
  onClose();

 }catch(err){
errorToast(err?.response?.data?.message || "Failed to save stock") }
}


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
       {/* Model */}
        <div className="bg-white w-[500px]  ml-20 rounded-xl shadow-lg p-6 flex flex-col">
           <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-black text-lg font-semibold">Add New Item</h2>
                 <p className="text-gray-400 text-sm ">Add a new spare part or component to inventory.</p>
              </div>
              <div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <X size={18}/>
                </button>
              </div>
       </div>

              {/*Button */}
               <div className="flex items-center justify-between  bg-gray-100 p-2 py-1.5 pl-3 rounded-[18px] ">
                    <button onClick={() => setactivetab("Spare")} className={`rounded-[18px] w-[200px] relative right-[2px] px-4 py-1 text-sm font-medium
                        ${activetab === "Spare" ? "bg-white text-black shadow" : "text-gray-600"}`}> 
                        Spare
                    </button>
                    <button onClick={() => setactivetab("Component")} className={`rounded-[18px] w-[200px] px-4 py-1 text-sm font-medium
                        ${activetab === "Component" ? "bg-white text-balck shadow" : "text-gray-600"}`}>
                        Component
                </button>
               </div>

               {/* Form */}
               <div>
              {activetab==="Spare" && (            
                 <div>
                  <form onSubmit={savestock} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                            <label htmlFor="id" className="text-sm font-medium">Id</label>
                            <input type="text" id="id" 
                            placeholder="SPR-AUTO-GEN"
                            disabled
                            className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>
                        </div>
                        <div>
                            <label htmlFor="name" className="text-sm font-medium">Name</label>
                            <input type="text" id="name"
                            placeholder="Enter Spare Name"
                             value={sparedata.spare_name}
                             onChange={(e) => setsparedata({...sparedata, spare_name:e.target.value})}
                            className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>
                        </div>

                        <div className="relative">
                            <label htmlFor="type" className="text-sm font-medium">Type</label>
                            <input type="text" id="type" 
                            value={sparedata.type}
                            onClick={() => setopen(true)}
                            placeholder="Enter Type"
                            className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>
                           
                           {/* Drop down */}
                           {open &&(
                             <div className="absolute top-full left-0 mt-1 w-full bg-white shadow p-3 rounded-lg border z-10">
                                <ul className="leading-8 cursor-pointer">
                                    <li  onClick={() =>{setsparedata(prev =>({...prev, type:"Branded"})); setopen(false)} }>Branded</li>
                                     <li onClick={() =>{setsparedata(prev =>({...prev, type:"Non-Branded"})); setopen(false)}}>Non-Branded</li>
                                </ul>
                             </div>
                           )}
                        </div>
                        <div>
                            <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                            <input type="number" id="quantity"
                            value={sparedata.quantity}
                            onChange={(e) => setsparedata({...sparedata,quantity:e.target.value})}
                            placeholder="Enter Quantity" className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800">
                            Save Item
                        </button>
                    </div>
                  </form>
                  </div>
            )}


                  {/* Form-2 */}
                     {activetab==="Component" && (                 
                     <div>
                        <form className="space-y-6" onSubmit={savestock}>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                              <div>
                                 <label htmlFor="Component Name" className="text-sm font-medium">Component Name</label>
                                  <input type="text"
                                   value={componentdata.component_name}
                                   onChange={(e) => setcomponentdata({...componentdata, component_name:e.target.value}) }
                                  name="Component_Name"
                                  placeholder="Enter Component Name" className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>
                              </div>
                              {/*  */}
                                <div>
                                    <label htmlFor="Component_Id" className="text-sm font-medium">Component ID</label>
                                    <input type="text"
                                      placeholder="CMP-AUTO-GEN"  
                                      disabled
                                     className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>
                                </div>
                            </div>
                            {/* Quantity */}
                             <div>
                                <label htmlFor="Quantity" className="text-sm font-medium">Quantity</label>
                                 <input type="number" 
                                 value={componentdata.quantity}     
                                 onChange={(e) => setcomponentdata({...componentdata, quantity:e.target.value})}                         
                                 placeholder="Enter Quantity"
                                className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>
                             </div>
                    {/* Buttons */}
                     <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800">
                            Save Item
                        </button>
                    </div>
                        </form>
                     </div>
                     )}
               </div>
        </div>
    </div>
  )
}
export default StockForm;