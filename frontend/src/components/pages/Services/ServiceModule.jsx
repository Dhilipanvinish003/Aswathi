import {
  Plus,
  ClipboardList,
  ArrowLeftRight,
  Truck,
} from "lucide-react";

function ServiceModule() {
  const cards = [
    {
      title: "Inward Entry",
      desc: "Create new service job",
      icon: Plus,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      title: "Job List",
      desc: "View all service jobs",
      icon: ClipboardList,
      bg: "bg-purple-100",
      color: "text-purple-600",
    },
    {
      title: "Standby PCB Management",
      desc: "Issue and track standby PCBs",
      icon: ArrowLeftRight,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      title: "DC Management",
      desc: "Delivery challan tracking",
      icon: Truck,
      bg: "bg-orange-100",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-8 py-8">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-900">
        Service Module
      </h1>
      <p className="text-gray-500 mt-1">
        Core PCB service operations and job management
      </p>

      {/* Cards – FULL WIDTH */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={index}
              className="
                flex items-center
                h-[104px]
                px-10
                gap-5
                bg-white
                border border-gray-200
                rounded-xl
                cursor-pointer
                transition
                hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group
              "
            >
              {/* Icon box */}
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-xl ${card.bg}`}
              >
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>

              {/* Text */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 leading-5 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 leading-5">
                  {card.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ServiceModule;
