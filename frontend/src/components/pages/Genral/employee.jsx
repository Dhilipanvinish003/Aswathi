import React,{useState} from "react";
import EmployeeForm from "../../forms/addemployee";
import {Plus,SquarePen } from "lucide-react";
import Addpassword from "../../forms/addeditpassword";
const Employee = () => {
    const [open, setOpen] = React.useState(false);
    const [employeeData, setEmployeeData] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [verifyOpen,setVerifyOpen] = useState(false);
    const [editOpen,setEditOpen] = useState(false);
    const [selectedEmployee,setSelectedEmployee] = useState(null);


    // All Employees data fetch
     const fetchEmployees = async () => {
       const res = await fetch("http://localhost:3000/api/employees/all");
       const data = await res.json();
       setEmployeeData(data.employees);
     };
      React.useEffect(() => {
        fetchEmployees();
      }, []);


      // Pasword Validation;
      const handleEditClick = (emp)=>{
      setSelectedEmployee(emp);
       setVerifyOpen(true);
       }


      // Search functionality
    const handleSearch = async (query) => {
      setSearchTerm(query);
      if (query.trim() === "") { 
        fetchEmployees();
        return;
      }
      const res = await fetch(`http://localhost:3000/api/employees/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setEmployeeData(data.employees);
    };

    const highlightText = (text) => {
      if (!searchTerm) return text;
      const regex = new RegExp(`(${searchTerm})`, "gi");
      const parts = text.split(regex);

      return parts.map((part, i) =>
       part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={i} className="bg-yellow-300 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      ));
    };

  return (
    <div className="bg-white rounded-xl border p-6 overflow-y-auto h-[70vh]">
       <div className="flex items-center justify-between mb-5">
             <div>
                 <h1 className="text-lg font-semibold">Employee Master</h1>
             </div>

              <div className="flex items-center gap-9">
               <div>
                <input type="text" className=" border border-gray-300 rounded-md px-4 py-2 w-full outline-none focus:border-[#98A2B3]     border border-[#D0D5DD]  transition-all duration-200 bg-[#F2F4F7]" placeholder="Search employees..."
                 onChange={(e) => handleSearch(e.target.value)} />
              </div>
                {/*  */}
                <button onClick={() => setOpen(true)}  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg">
                  <Plus size={16} />
                  Add Employee</button>
              </div>
            </div>
   
               <div>
                {open && <EmployeeForm onClose={() => setOpen(false)} refreshEmployees={fetchEmployees}/>}
                
                 {/* PASSWORD VERIFY MODAL */}
                {verifyOpen && (<Addpassword onClose={()=>setVerifyOpen(false)} onSuccess={()=>{
                 setVerifyOpen(false); setEditOpen(true);   
                  // open edit form only after success 
                   }}/>
                 )}
               
               {editOpen && selectedEmployee && (<EmployeeForm
                employee={selectedEmployee}
                onClose={()=>setEditOpen(false)}
                refreshEmployees={fetchEmployees}/>)}  
               </div>

             {/* Table */}

             <div className="overflow-y-auto">
                    <table className="w-full border-collapse">
                         <thead>
                           <tr className=" text-left text-[12px] font-[400]  font-[Arial] text-[#6A7282] border-b ">
                              <th className="py-2 pl-2">EMPLOYEE ID</th>
                              <th className="pr-9">NAME</th>
                               <th>DESIGNATION</th>
                                <th>DEPARTMENT</th>
                                 <th>CONTACT</th>
                                <th>ACTIONS</th>
                           </tr>
                        </thead>

                           {/* body */}
                            <tbody>
                               {employeeData.map((e,index)=>(
                                 <tr key={e.id}  className="border-b text-[#101828] font-[Arial] text-[14px] font-[400] text-sm hover:bg-gray-50">
                                     <td className="p-2"> EMP{String(index + 1).padStart(3, "0")}</td>
                                     <td>{highlightText(e.employee_name)}</td>
                                      <td>{highlightText(e.designation)}</td>
                                       <td>{highlightText(e.department)}</td>
                                        <td>{e.contact}</td>

                                        <td className="pl-5">
                                           <SquarePen size={16} className="cursor-pointer text-gray-600 hover:text-black" onClick={() => handleEditClick(e)} />
                                        </td>

                                   </tr>
                               ))}
                               
                            </tbody>
                    </table>
               </div>

       
    </div>
  );

}
export default Employee;