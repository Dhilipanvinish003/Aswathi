import React from "react";
import { ShoppingCart, FileText, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
const PurchaseCard = ({ title, description, icon: Icon, bgColor, iconColor, onClick }) => {

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-5 p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
        >
            <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${bgColor}`}>
                <Icon size={26} className={iconColor} />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
        </div>
    );
};
const Purchase = () => {

    const navigate = useNavigate();
    const purchaseOptions = [
        {
            title: "Stock",
            description: "Record component purchases",
            icon: ShoppingCart,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            action: () => navigate("/purchase/stock"),

        },
        {
            title: "Supplier Bills",
            description: "Track repair service bills",
            icon: FileText,
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
            action: () => navigate("/purchase/bills"),
        },
        {
            title: "Purchase Reports",
            description: "View purchase analytics",
            icon: Package,
            bgColor: "bg-orange-50",
            iconColor: "text-orange-600",
            action: () => navigate("/purchase/reportss"),
        },
    ];

    return (
        <div className="min-h-screen s">
            {/* Header Section */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Purchase Module
                </h1>
                <p className="text-gray-500 mt-2 text-lg">
                    Manage spare parts, supplier bills, and payments
                </p>
            </div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
                {purchaseOptions.map((option, index) => (
                    <PurchaseCard
                        key={index}
                        title={option.title}
                        description={option.description}
                        icon={option.icon}
                        bgColor={option.bgColor}
                        iconColor={option.iconColor}
                        onClick={option.action}
                    />
                ))}
            </div>

        </div>
    );
};

export default Purchase;