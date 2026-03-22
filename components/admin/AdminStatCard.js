export default function AdminStatCard({ label, value, icon, color = "blue", trend }) {
  const colorMap = {
    blue:   { bg: "bg-blue-50",   icon: "bg-[#1a56db]",  text: "text-[#1a56db]"  },
    green:  { bg: "bg-green-50",  icon: "bg-green-500",  text: "text-green-600"  },
    orange: { bg: "bg-orange-50", icon: "bg-orange-500", text: "text-orange-600" },
    purple: { bg: "bg-purple-50", icon: "bg-purple-500", text: "text-purple-600" },
    red:    { bg: "bg-red-50",    icon: "bg-red-500",    text: "text-red-600"    },
  };
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      {icon && (
        <div className={`${c.icon} w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <span className="text-white w-5 h-5">{icon}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">
          {value ?? <span className="text-gray-300 text-lg">—</span>}
        </p>
        {trend && (
          <p className={`text-xs mt-1.5 font-medium ${c.text}`}>{trend}</p>
        )}
      </div>
    </div>
  );
}