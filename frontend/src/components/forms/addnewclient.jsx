import React,{useEffect, useState} from "react";
import { X } from "lucide-react";
import { successToast, errorToast, loadingToast } from "../ui/nottifications";
import toast from "react-hot-toast";


const AddNewCustomerModal = ({ onClose, customer, refresh }) => {
  const [customerType, selectCustomerType] = useState("new");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  


    // Background overflow lock
    useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);


  // Forms
  const [form, setForm] = useState({
  customer_name: "",
  phone: "",
  email: "",
  address: "",
  gst_number: "",
  customer_type: "new", 
});


  
  // Search and Select Customer;

 const selectCustomer = (c) => {
  setSelectedCustomer(c);
  selectCustomerType("existing");

  setForm({
    customer_name: c.customer_name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    gst_number: c.gst_number,
    customer_type: "existing", 
  });

  setSearchTerm(c.customer_name);
  setFilteredCustomers([]);
};




  // Save Customer

const saveCustomer = async (e) => {
  e.preventDefault();
     const toastId = loadingToast(
    customer ? "Updating customer..." : "Adding customer..."
  );
 try{
  const url = customer
    ? `http://localhost:3000/api/customers/update/${customer.id}`
    : "http://localhost:3000/api/customers/new";

  const method = customer ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_type: "new",
      ...form,
       
    }),
  });

    if (!res.ok) throw new Error("Failed");
    toast.dismiss(toastId);
    successToast(
      customer ? "Customer updated successfully" : "Customer added successfully"
    );
  

  if (res.ok) {
    refresh();
    onClose();

  }
  } catch(err){
    toast.dismiss(toastId);
    errorToast("Something Went Wrong");
  }

};


// / EDIT MODE → prefill

useEffect(() => {
    if (customer) {
      setForm({
        customer_name: customer.customer_name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        gst_number: customer.gst_number || "",
      });

      selectCustomerType("new");
    } else {
      // ADD MODE → reset
      setForm({
        customer_name: "",
        phone: "",
        email: "",
        address: "",
        gst_number: "",
      });

      setSelectedCustomer(null);
      setSearchTerm("");
      selectCustomerType("new");
    }
  }, [customer]);

// FetchSearch;
 
useEffect(() => {
  if (
    customerType !== "existing" ||
    searchTerm.trim() === "" ||
    selectedCustomer
  ) {
    setFilteredCustomers([]);
    return;
  }

  const delay = setTimeout(async () => {
    const res = await fetch(
      `http://localhost:3000/api/customers/search?q=${searchTerm}`
    );
    const data = await res.json();
    setFilteredCustomers(data);
  }, 300);

  return () => clearTimeout(delay);
}, [searchTerm, customerType, selectedCustomer]);



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
      
      {/* Modal Box */}
      <div className="bg-white w-[650px] mt-[220px] ml-20 rounded-xl shadow-lg p-6 flex flex-col mb-[80px]">
        
        {/* Header */}
         <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {customerType === "new"
                ? "Add New Customer"
                : "Select Existing Customer"}
            </h2>
            <p className="text-sm text-gray-500">
              {customerType === "existing"
                ? "Enter customer details below."
                : "Search and select a customer."}
            </p>
          </div>
          <button onClick={onClose}>
            <X className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={saveCustomer} className="space-y-4">
          {/* Customer Type */}
          <div>
            <label className="text-sm font-medium">Customer Type</label>
            <select value={customerType}  onChange={(e) => selectCustomerType(e.target.value)} className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none">
              <option value="new">New Customer</option>
              <option value="existing">Existing Customer</option>
            </select>
          </div>

          {/* Existing Client */}
          {customerType === "existing" && (
            <div className="p-6 flex flex-col space-y-4 ">           
            <div className="relative right-6">
            <label className="text-sm font-medium">Search Customer</label>
            <input
              type="text"
              placeholder="Search by name, phone, or GST..."
              value={searchTerm}
               onChange={(e) => {setSearchTerm(e.target.value); setSelectedCustomer(null)}}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1  w-[600px]"
            />
          </div>


           {/* Search Results */}

        {filteredCustomers.length > 0 && (
      <div className="border rounded-lg max-h-52 overflow-y-auto">
        {filteredCustomers.map((c) => (
          <div
            key={c.id}
            onClick={() => selectCustomer(c)}
            className="p-3 cursor-pointer hover:bg-gray-100 border-b"
          >
            <p className="font-medium">{c.customer_name}</p>
            <p className="text-xs text-gray-500">
              {c.phone} • {c.gst_number || "No GST"}
            </p>
          </div>
        ))}
      </div>
    )}
             

            {/* Buttons */}

            <div className="flex justify-end gap-3 relative top-5">
            <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm"
          >
            Cancel
          </button>

          <button type="submit" 
          disabled={!selectedCustomer}
           onClick={() => { selectCustomerType("new");}}
           className="px-5 py-2 rounded-lg bg-black text-white text-sm">
           Continue
          </button>
          </div>    
           </div>
          )}


          {/* Name + Phone */}
          {customerType === "new" && (
             <>          
             <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="text-sm font-medium">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm ({...form, customer_name: e.target.value})}
                placeholder="Enter customer name"
                className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm ({...form, phone: e.target.value})}
                placeholder="+91 XXXXX XXXXX"
                className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm ({...form, email: e.target.value})}
              placeholder="customer@example.com"
              className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Enter full address"
              value={form.address}
               onChange={(e) => setForm ({...form, address: e.target.value})}
              rows={2}
              className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none resize-none"
            />
          </div>

          {/* GST */}
          <div>
            <label className="text-sm font-medium">GST Number</label>
            <input
              type="text"
              placeholder="22AAAAA0000A1Z5"
              value={form.gst_number}
              onChange={(e) => setForm ({...form, gst_number: e.target.value})}
              className="mt-1 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
            />
          </div>

           <div className="relative p-4 top-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm"
          >
            Cancel
          </button>

          <button  type="submit" className="px-5 py-2 rounded-lg bg-black text-white text-sm">
            Save Customer
          </button>
        </div>
          </>
          )}
        </form>

        {/* Footer */}
       
      </div>
        
    </div>
         
  );
};

export default AddNewCustomerModal;
