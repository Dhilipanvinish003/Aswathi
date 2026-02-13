import React from "react";
import {NavLink,Outlet} from "react-router-dom";

import {
  Users,
  Box,
  Wrench,
  UserCircle,
  Repeat,
  DollarSign,
  UserCog,
  Settings,
} from "lucide-react";
 

const General = () =>{

   const Generalmenu = [
     {title:"Customer Master", path:"/general/customer",icon:Users},
     {title:"PCB Master", path:"/general/PCB", icon:Box},
     {title:"Service Type Master", path:"/general/Service", icon:Wrench},
     {title:"Supplier Master", path:"/general/supplier",icon:UserCircle},
     {title:"Standby PCB Master", path:"/general/standbypcb",icon:Repeat},
     {title:"Expense Master", path:"/general/expense",icon:DollarSign},
     {title:"Employee Master", path:"/general/employee",icon:UserCog},
     {title:"System Settings", path:"/general/setting", icon:Settings}

   ]



    return(
      <div className="w-full min-h-screen ">
      <div className=" grid grid-cols-[260px_1fr] gap-6 p-6">
          <div className="bg-[#FFF] rounded-xl border border-[0.8px] border-[rgba(0, 0, 0, 0.10] p-5 py-[50px] w-[257.6px] h-[460px]">
              <ul className="flex flex-col gap-6 font-[Arial] text-[14px] align-item-center font-normal font-[400] ">
                 {Generalmenu.map((item,i) => {
                   const Icon = item.icon;
                   return(
                  <li key={i}>
                   <NavLink 
                   to={item.path} className={({isActive}) => `flex item-center gap-3 px-[3px] py-[3px] rounded-lg transaction
                      ${isActive ? "bg-[#ECEEF2] text-[#1447E6] border-l-4" : "hover:text-[#1447E6]"}`}>

                    <Icon size={18} />
                    <span>{item.title}</span>
                   </NavLink>
                   </li>
                   );
                 })}
              </ul>
         </div>
         {/*  */}
         {/* RIGHT CONTENT AREA */}
        <div >
       <Outlet />
       </div>
                
     </div>
    </div>
    )
}
export default General;