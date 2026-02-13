import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/layout";
import Home from "./components/pages/Dashboard/dashboard";
import General from "./components/pages/Genral/general";
import Purchase from "./components/pages/Purchase/purchase";
import { Toaster } from "react-hot-toast";
import ProductionStock from "./components/pages/Production/productionstock";
import SalesModule from "./components/pages/Sales/salesmodule";
import ServiceModule from "./components/pages/Services/ServiceModule";
import Reports from "./components/pages/Reports/reports";
import AddNewCustomerModal from "./components/pages/Genral/customer";
import PCBMASTER from "./components/pages/Genral/pcbmasterdetail";


function App() {
  return (
    <BrowserRouter>
          <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="general" element={<General />}>
            <Route path="customer" element={<AddNewCustomerModal/>}/>
             <Route path="PCB" element={<PCBMASTER/>}/>
            <Route path="Service" element={<AddNewCustomerModal/>}/>
            <Route path="supplier" element={<AddNewCustomerModal/>}/>
            <Route path="standbypcb" element={<AddNewCustomerModal/>}/>
            <Route path="expense" element={<AddNewCustomerModal/>}/>
            <Route path="employee" element={<AddNewCustomerModal/>}/>


           </Route>
          <Route path="purchase" element={<Purchase />} />
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
