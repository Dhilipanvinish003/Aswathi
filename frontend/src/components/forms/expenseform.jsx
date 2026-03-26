import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { successToast,errorToast, loadingToast } from '../ui/nottifications';
import axios from 'axios';
import toast from 'react-hot-toast';

const ExpenseForm = ({onClose,refresh}) => {
  const[open, setOpen] = useState(false);
  
  //Background Lock;

  useScrollLock(true);

  //click outside to close

  useEffect(() => {
    const handleClickOutside = () => setOpen(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);
  
// Set Format;

 const [formData, setFormData] = useState({
    expense_date: "",
    category: "",
    amount: "",
    expense_description: ""
  });

 //save Expenses;
 
 const Saveexpenses = async(e) =>{
 e.preventDefault();
 const toastId = loadingToast("Adding Expense...");

 try{
   await axios.post("http://localhost:3000/api/expenses/new", formData);

   toast.dismiss(toastId);
   successToast("Expense Added");
   onClose();
   refresh();

 } catch(err){
   toast.dismiss(toastId);
    errorToast(err.response?.data?.message || "Fail To Add");
   
 }
};
  

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
           <div className="bg-white w-[650px] mt-[180px] rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
            <div className="flex items-start justify-between mb-4">
             <div>
                 <h2 className="text-lg font-semibold">ADD NEW EXPENSE</h2>
             </div>
             {/*  */}
              <div>
                  <button onClick={onClose}>
                  <X className="text-gray-400 hover:text-gray-600" />
                  </button>
              </div>
          </div>

          {/* Forms */}

                <form onSubmit={Saveexpenses} className='space-y-5'>
                    <div>
                        <label htmlFor="">Date</label>
                        <input type="date"
                        className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                        placeholder='Select Date' value={formData.expense_date} onChange={(e)=> setFormData({...formData, expense_date:e.target.value})}/>
                    </div>

                 {/*Category  */}
                  
                      <div className="relative">
                        <label htmlFor="">Category</label>
                        <input value={formData.category}  onClick={(e) => { e.stopPropagation(); setOpen(!open) }} type="text" placeholder='Select Category' className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" />                         
                          {open && (
                           <div className="absolute top-full left-0 mt-1 w-full bg-white shadow p-3 rounded-lg border z-10">
                             <ul className="leading-8 cursor-pointer">
                                <li onClick={() => {setFormData({...formData, category: "Fuel & Transports"}); setOpen(false) }} className="hover:bg-gray-100 px-2 rounded">Fuel & Transports</li>
                                <li onClick={() => {setFormData({...formData, category: "Food & Snacks"}); setOpen(false)}} className="hover:bg-gray-100 px-2 rounded">Food & Snacks</li>
                                <li onClick={() => {setFormData({...formData,category: "Accommodation"}); setOpen(false)}} className="hover:bg-gray-100 px-2 rounded">Accommodation</li>
                                <li onClick={() => {setFormData({...formData,category: "Utilities"}); setOpen(false)}}className="hover:bg-gray-100 px-2 rounded">Utilities</li>
                                <li onClick={() => {setFormData({...formData,category: "Others"}); setOpen(false)}} className="hover:bg-gray-100 px-2 rounded">Others</li>  
                             </ul>
                          </div>
                          
                          )}
                      </div>

                      {/* Amount */}
                      
                       <div>
                         <label htmlFor="">Amount (₹)</label>
                          <input type="number" 
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"
                          placeholder="0.00" />
                         
                       </div>

                       {/* Description */}

                        <div>
                             <label htmlFor="">Description</label>
                             <input 
                              value={formData.expense_description}
                              onChange={(e) => setFormData({...formData, expense_description: e.target.value})}
                             className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer" rows="3" placeholder="Add description"/>

                        </div>

                        {/*Buttons  */}

                         <div className="relative p-5 top-4 flex justify-end gap-3 ">
                         <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
                          <button type="submit" className="px-5 py-2 rounded-lg bg-black text-white text-sm">Save Data</button>
                        </div>
                

                </form>
           </div>
     </div>
  )
};

export default ExpenseForm;