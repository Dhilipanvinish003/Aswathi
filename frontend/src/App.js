import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
import Layout from "./components/layout/layout";
import Home from "./components/pages/Dashboard/dashboard";
import General from "./components/pages/Genral/general";
import PurchaseHome from "./components/pages/Purchase/purchasehome";
import {Toaster} from "react-hot-toast";
import ProductionStock from "./components/pages/Production/productionstock";
import SalesModule from "./components/pages/Sales/salesmodule";
import ServiceModule from "./components/pages/Services/ServiceModule";
import Reports from "./components/pages/Reports/reports";
import AddNewCustomerModal from "./components/pages/Genral/customer";
import Spare from "./components/pages/Genral/sparedetails";
import Employee from "./components/pages/Genral/employee";
import Servicemodel from "./components/pages/Genral/servicedata";
import ExpenseData from "./components/pages/Genral/expensedata";
 import PurchaseLayout from "./components/layout/purchaselayout";
 import Stock from "./components/pages/Purchase/stockpage";
 import SupplierBills from "./components/pages/Purchase/supplierbills";
 import Purchasereports from "./components/pages/Purchase/purchasereport";

function App() {

  if(!localStorage.getItem("adminPassword")){
  localStorage.setItem("adminPassword","Ashwitha@123");
}
  return (
    <BrowserRouter>
          <Toaster position="top-right" reverseOrder={false}/>

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="general" element={<General />}>
             <Route index element={<Navigate to="customer" replace />} />
            <Route path="customer" element={<AddNewCustomerModal/>}/>
             <Route path="spare" element={<Spare/>}/>
            <Route path="services" element={<Servicemodel/>}/> 
            <Route path="expense" element={<ExpenseData/>}/>
            <Route path="employee" element={<Employee/>}/>
{/* purchase module */}
           </Route>
           <Route path="purchase" element={<PurchaseLayout />}>
           <Route index element={<PurchaseHome/>} />
            <Route path="stock" element={<Stock />} />
            <Route path="bills" element={<SupplierBills/>}/>
            <Route path="reportss" element={<Purchasereports/>}/>
          </Route>

          <Route path="production" element={<ProductionStock />}/>
          <Route path="sales" element={<SalesModule/>}/>
          <Route path="services" element={<ServiceModule/>}/>
          <Route path="reports" element={<Reports/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


export default App;
