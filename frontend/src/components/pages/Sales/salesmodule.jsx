import React from "react";
import { FileText, Truck, FileCheck, Receipt, FileMinus, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * SalesCard - A reusable card component for the Sales Module.
 */
const SalesCard = ({ title, subtitle, icon: Icon, bgColor, iconColor, onClick }) => {
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
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>
        </div>
    );
};

const SalesModule = () => {
    const navigate = useNavigate();
    const salesOptions = [
        {
            title: "Quotation",
            subtitle: "Create price quotes",
            icon: FileText,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            action: () => navigate("/sales/quotations"),
        },
        {
            title: "Sales DC",
            subtitle: "Delivery challans",
            icon: Truck,
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
            action: () => console.log("Sales DC Clicked"),
        },
        {
            title: "Service Invoice",
            subtitle: "Job-linked invoicing",
            icon: FileCheck,
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
            action: () => navigate("/sales/service-invoices"),
        },
        {
            title: "Direct Invoice",
            subtitle: "Non-job invoices",
            icon: Receipt,
            bgColor: "bg-orange-50",
            iconColor: "text-orange-600",
            action: () => console.log("Direct Invoice Clicked"),
        },
        {
            title: "Credit Note",
            subtitle: "Issue credit notes",
            icon: FileMinus,
            bgColor: "bg-red-50",
            iconColor: "text-red-600",
            action: () => console.log("Credit Note Clicked"),
        },
        {
            title: "Receipts & Payments",
            subtitle: "Record customer payments",
            icon: CreditCard,
            bgColor: "bg-cyan-50",
            iconColor: "text-cyan-600",
            action: () => console.log("Receipts & Payments Clicked"),
        },
    ];

    return (
        <div className="min-h-screen pb-10">
            {/* Header Section */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Sales Module
                </h1>
                <p className="text-gray-500 mt-2 text-lg">
                    Invoicing, quotations, and payment collection
                </p>
            </div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
                {salesOptions.map((option, index) => (
                    <SalesCard
                        key={index}
                        title={option.title}
                        subtitle={option.subtitle}
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

export default SalesModule;
