import { Outlet } from "react-router-dom";

const PurchaseLayout = () => {
  return (
    <div className="min-h-screen ">

      {/* Purchase Header */}
     
      {/* Child Page Loads Here */}
      <div className="p-10">
      <Outlet />
      </div>

    </div>
  );
};

export default PurchaseLayout;