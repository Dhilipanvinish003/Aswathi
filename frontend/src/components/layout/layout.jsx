import { Outlet } from "react-router-dom";
import Navbar from "./navbar";



const Layout = () => {
  return (
    <div>
      <div className="fixed top-0 w-full">
      <Navbar />
      </div>
      <div className=" pt-20 px-6 bg-[#F9FAFB]">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
