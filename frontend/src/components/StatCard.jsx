import React from "react";

export default function StatCard({ title, value, color = 'gray', icon }) {
  return (
    <div className={`bg-${color}-100 border-${color}-400 p-6 rounded-lg shadow-md text-center`}>
      {icon && <div className={`text-3xl mb-2 ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">${value.toLocaleString()}</p> 
    </div>
  );
}

