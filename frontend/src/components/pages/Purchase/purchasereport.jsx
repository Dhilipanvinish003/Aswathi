import { useNavigate } from 'react-router-dom';
import React from "react";      
import { ArrowLeft, Plus} from "lucide-react";
import Purchasereportform from '../../forms/purchasereportform';

const Purchasereport = () => {
const navigate = useNavigate();

const [showform, setShowform] =React.useState(false);

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
       Purchase Reports
     </h2>
     <p className="text-[14px] text-[#667085] mt-1">
      View payment history and reports
     </p>
   </div>
 </div>
   
   {/* Add Button */}
      <div>
  <button onClick={ ()=> setShowform(true)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">
     <Plus size={16}/>
     Record Payment
   </button>
</div>
</div>

  <div>
     {showform && <Purchasereportform onClose={()=>setShowform(false)}/>}
  </div>


   {/* Table */}
        <div className='bg-white rounded-xl border h-[70vh] overflow-y-auto p-5'>
             <table className='w-full'>
                <thead>
                     <tr className='border-b border-gray-200"'>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">S.NO</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">BILL NO</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">SUPPLIER NAME</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">DATE</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">AMOUNT</th>
                     </tr>
                </thead>
             </table>
        </div>
</div>
  )
};
export default Purchasereport;