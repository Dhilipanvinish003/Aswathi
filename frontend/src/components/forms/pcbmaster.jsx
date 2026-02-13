import React,{useEffect,useState} from "react";
import {X} from "lucide-react";

const PCBMASTER = ({onClose}) =>{
  
     const [open,setOpen] = useState(false);
     const [category,setCategory] = useState("");

    
     // Background overflow lock
        useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = "auto";
        };                                                              
      }, []);


    return(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
        <div className="bg-white w-[650px] mt-[180px] ml-[180px] rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
         <div className="flex items-start justify-between mb-4">
              <div>
                 <h2 className="text-lg font-semibold">Add New PCB Model</h2>
                  <p className="text-sm text-gray-500">Enter the details for the new PCB Model</p>
              </div>
               
            <button onClick={onClose}>
            <X className="text-gray-400 hover:text-gray-600" />
          </button>
         </div>

          {/* Forms */}
             <form action="">
                 <div className="grid grid-cols-2 gap-7">
                    <div>
                        <label className="text-sm font-medium" htmlFor="">Brand</label>
                      <input type="text" className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                       placeholder="Eg: Simen"/>
                     </div>

                     {/*  */}
                      <div>
                        <label className="text-sm font-medium" htmlFor="">Model</label>
                      <input type="text"
                       className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                       placeholder="Eg: Galaxy S21"/>
                     </div>

                     {/*  */}
                     <div className="relative">
                      <label className="text-sm font-medium" htmlFor="">Category</label>
                      <input value={category} onClick={(e) =>{ e.stopPropagation(); setOpen(!open)}}     
                       type="text" className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                        placeholder="Select Category"/>
                        
                    {open && (
                   <div className="absolute top-full left-0 mt-1 w-full bg-white shadow p-3 rounded-lg border z-10">
                   <ul className="leading-8 cursor-pointer">
                   <li onClick={() => {setCategory("Branded"); setOpen(false)}} className="hover:bg-gray-100 px-2 rounded">Branded</li>
                   <li onClick={() => {setCategory("Non-Branded"); setOpen(false) }} className="hover:bg-gray-100 px-2 rounded">Non-Branded</li>
                   </ul>
                 </div>
                 )}
                     </div>

                     {/*  */}

                      <div>
                        <label className="text-sm font-medium" htmlFor="">Serial Number</label>
                      <input type="text" className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>
                     </div>

                 </div>

             </form>
         </div>
      </div>
    )
};

export default PCBMASTER;