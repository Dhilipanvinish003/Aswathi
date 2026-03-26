import { ArrowLeft, Search, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StockForm from "../../forms/stockform";
import React from "react";
import { X } from "lucide-react";
import { errorToast, successToast } from "../../ui/nottifications";

const Stock = ({onClose}) => {
      
const navigate = useNavigate();
const [activeTab,setActiveTab] = useState("spares");
const[showform,setShowform] = useState(false);
const [sparedata,setsapredata]=useState([]);
const[componentdata,setcomponentdata] = useState([]);

const [editOpen,setEditOpen] = useState(false);
const [selectedId,setSelectedId] = useState(null);
const [editQty,setEditQty] = useState("");
const [searchTerm,setSearchTerm] = useState("");

// Edit;



// api
 const Api_url = "http://localhost:3000/api";

// Fetch all Spare Data;
const spare = () => {
   fetch (`${Api_url}/spares/all`)
    .then(res => res.json())
    .then(data => setsapredata(data))
    .catch(err => console.log(err)); 
} 

React.useEffect(  () => {
    spare();
  },[] );

 //Fetch all Component Data;
 
 const component = () =>{
  fetch (`${Api_url}/components/all`)
   .then(res => res.json())
   .then(data => setcomponentdata(data))
   .catch(err => console.log(err));
 }

 React.useEffect(
  () => {
    component();
  },[])
  
  //Edit quantity;
  
 const updateqty = async () => {
   try{
     if(!editQty){
      return errorToast("Quantity is required");
     }
   
      let Endpoint = "";
      
      if(activeTab === "spares"){
        Endpoint = `${Api_url}/spares/updateqty/${selectedId}`;
      }else if(activeTab === "Components"){
        Endpoint = `${Api_url}/components/updateqty/${selectedId}`;
      }
      
     const response = await fetch(Endpoint,{
        method:"PUT",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify({quantity:parseInt(editQty),}),
      });
     
      if(!response.ok){
        const errorData = await response.json();
        return errorToast(errorData.message || "Failed to update quantity");
       }
       successToast("Quantity updated successfully");
       setEditOpen(false);

       activeTab === "spares" ?  spare() : component();
   }
    catch(error){
      errorToast("Update Failed");
    }

 };
  



// Prefill;
  const prefill = (id) =>{
    setSelectedId(id);
     if(activeTab === "spares"){
      const selected = sparedata.find(item => item.id === id);
      if(selected) setEditQty(selected.quantity.toString());
     }
     if(activeTab === "Components"){
      const selected = componentdata.find(item => item.id === id);
       if(selected) setEditQty(selected.quantity.toString());
     }
  }

//Search Item;

const search = async () => {

  if (!searchTerm.trim()) {
    activeTab === "spares" ? spare() : component();
    return;
  }

  let endpoint = "";

  if (activeTab === "spares") {
    endpoint = `${Api_url}/spares/search/${searchTerm}`;
  } 
  else if (activeTab === "Components") {
    endpoint = `${Api_url}/components/search/${searchTerm}`;
  }

  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    if (activeTab === "spares") {
      setsapredata(data);
    } else {
      setcomponentdata(data);
    }

  } catch (error) {
    console.log(error);
    errorToast("Failed to search items");
  }
};


//Search highlights Text;

const highlightText = (text) => {

  if (!text) return "";

  const value = text.toString();

  if (!searchTerm) return value;

  const regex = new RegExp(`(${searchTerm})`, "gi");
  const parts = value.split(regex);

  return parts.map((part, i) =>
    part.toLowerCase() === searchTerm.toLowerCase()
      ? (
        <span key={i} className="bg-yellow-300 px-1 rounded">
          {part}
        </span>
      )
      : part
  );
};  

 return (

<div className="min-h-screen">
{/* Header */}
<div className="flex items-center justify-between mb-6">
 {/* Left side */}
 <div className="flex items-center gap-6">
   {/* Back Button */}
   <button
     onClick={()=>navigate("/purchase")}
     className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 text-[15px] font-medium"
   >
     <ArrowLeft size={16}/>
     Back
   </button>

   {/* HEADING */}
   <div>
     <h2 className="text-[24px] font-semibold text-[#101828]">
       Stock & Purchase
     </h2>
     <p className="text-[14px] text-[#667085] mt-1">
       Manage spares and component inventory
     </p>
   </div>

 </div>

 {/* RIGHT SIDE */}
 <div className="flex items-center gap-4">

   {/* TABS */}
   <div className="flex items-center bg-gray-100 p-1 py-1.5 pl-3 rounded-[18px] ">

     <button onClick={()=>setActiveTab("spares")} className={`px-4 py-1.5 rounded-lg text-sm font-medium  text-gray-600
        ${activeTab === "spares" ? "bg-white text-black shadow" : "text-gray-600"}`}>
       Spares
     </button>

     <button onClick={()=> setActiveTab("Components")} className={`px-4 py-1.5 text-sm rounded-lg font-medium text-gray-600
        ${activeTab === "Components" ? "bg-white text-black shadow" : "text-gray-600"}`}>
       Components
     </button>

   </div>

   {/* New Item*/}
   <button onClick={() => setShowform(!showform)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">
     <Plus size={16}/>
     New Item
   </button>

 </div>

</div>

{/* SEARCH */}
<div className="mb-6">
 <div className="flex items-center bg-gray-100 px-4 py-3 rounded-xl w-[400px]">
   <Search size={18} className="text-gray-400"/>
   <input
     type="text"
     value={searchTerm}
     onChange={(e) =>{setSearchTerm(e.target.value); search()}}
     placeholder="Search by ID or Name..."
     className="bg-transparent outline-none ml-2 text-sm w-full"
   />
 </div>
</div>

   <div>
     {showform && <StockForm onClose={()=>setShowform(false)}/>}
   </div>



{/* Table Date */}
{activeTab==="spares" && (
  <div className="bg-white rounded-xl border h-[70vh] overflow-y-auto p-5">
      {/* Table */}
        <table className="w-full">
             <thead > 
                <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">ID</th>
                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">SPARE ID</th>
                      <th className="text-left py-3 px-4  text-xs font-medium text-gray-500 ">SPARE NAME</th>
                       <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">TYPE</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">QUANTITY</th>
                         <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">ACTIONS</th>
                </tr>
             </thead>
             {/* body */}
               <tbody>
                 {sparedata.map((data, index)=>(
                   <tr key={data.id} className="border-b border-gray-100 hover:bg-gray-50" >
                       <td className="py-3 px-4 text-sm text-gray-900">{ highlightText(data.id)}</td>
                       <td className="py-3 px-4 text-sm text-gray-700">SPR{String(data.id).padStart(3, "0")}</td>
                       <td className="py-3 px-4 text-sm font-medium text-gray-900">{ highlightText(data.spare_name)}</td>
                       <td className="py-3 px-2 text-sm text-gray-700">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              data.id % 2 === 0 ? 'bg-gray-100 text-gray-800':'bg-blue-100 text-blue-800' 
                            }`}>
                              {data.id % 2 === 0 ? 'Non-Branded' : 'Branded'}
                            </span>
                          </td>

                       <td className="py-3 px-7 text-sm text-gray-700">{data.quantity}</td>
                       <td className="py-4 px-6">
                       <button onClick={() =>{ prefill(data.id); setEditOpen(true)}} className="text-blue-500 hover:text-blue-700">Edit</button>

                        {editOpen && (
                         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 overflow-y-auto">
                        <div className="bg-white w-[400px] mt-[180px] rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">

                        <div className="flex justify-between mb-4">
                          <div>
                         <h2 className="font-semibold">Edit Quantity</h2>
                         <p className="text-sm"> Update the stock quantity for IC Chips - Mixed.</p>
                         </div>

                        <button onClick={()=>setEditOpen(false)}>
                          <X size={18}/>
                         </button>
                      </div>

                      <label className="text-sm font-medium">Quantity</label>
                        <input
                       type="number"
                       value={editQty}
                       onChange={(e)=>setEditQty(e.target.value)}
                       className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>

                        <div className="flex justify-end gap-3 mt-4"> 
                        <button onClick={()=>setEditOpen(false)}>Cancel</button>

                        <button
                         onClick={updateqty}
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
)}

  {/* Table-2 */}
  {activeTab==="Components" && (
         <div className="bg-white rounded-xl border h-[70vh] overflow-y-auto p-6">
      {/* Table */}
        <table className="w-full">
             <thead> 
                <tr className="border-b border-gray-200 ">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">S.NO</th>
                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">ID</th>
                      <th className="text-left py-3 px-4  text-xs font-medium text-gray-500 ">COMPONENT NAME</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">QUANTITY</th>
                         <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 ">ACTIONS</th>
                </tr>
             </thead>
              {/* body */}
               <tbody>
                 {componentdata.map((data,index)=>(
                   <tr key={data.id} className="border-b border-gray-100 hover:bg-gray-50"  >
                       <td className="py-3 px-4 text-sm text-gray-900">{index+1}</td>
                       <td className="py-3 px-4 text-sm text-gray-700">CMP{String(data.id).padStart(3,"0")}</td>
                       <td className="py-3 px-4 text-sm font-medium text-gray-900">{highlightText(data.component_name)}</td>
                       <td className="py-3 px-7 text-sm text-gray-700">{data.quantity}</td>
                       <td className="py-4 px-6">
                       <button onClick={() =>{ prefill(data.id); setEditOpen(true)}} className="text-blue-500 hover:text-blue-700">Edit</button>

                        {editOpen && (
                         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 overflow-y-auto">
                        <div className="bg-white w-[400px] mt-[180px] rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">

                        <div className="flex justify-between mb-4">
                          <div>
                         <h2 className="font-semibold">Edit Quantity</h2>
                         <p className="text-sm"> Update the stock quantity for IC Chips - Mixed.</p>
                         </div>

                        <button onClick={()=>setEditOpen(false)}>
                          <X size={18}/>
                         </button>
                      </div>

                      <label className="text-sm font-medium">Quantity</label>
                        <input
                       type="number"
                       value={editQty}
                       onChange={(e)=>setEditQty(e.target.value)}
                       className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none cursor-pointer"/>

                        <div className="flex justify-end gap-3 mt-4"> 
                        <button onClick={()=>setEditOpen(false)}>Cancel</button>

                        <button
                         onClick={updateqty}
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
  )}

</div>
 );
};

export default Stock;