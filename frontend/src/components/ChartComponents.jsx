import React from 'react';

// Bar Chart Component
export const BarChart = ({ data, labelKey, valueKey, color = 'blue', height = 200 }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }
  const maxValue = Math.max(...data.map(d => d[valueKey] || 0), 1);
  
  const colorClasses = {
    blue: 'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500',
    green: 'bg-gradient-to-t from-green-500 to-green-400 hover:from-green-600 hover:to-green-500',
    purple: 'bg-gradient-to-t from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500',
    orange: 'bg-gradient-to-t from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500',
    red: 'bg-gradient-to-t from-red-500 to-red-400 hover:from-red-600 hover:to-red-500',
  };
  
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="flex items-end justify-between h-full space-x-2">
        {data.map((item, index) => {
          const percentage = (item[valueKey] / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
                <div
                  className={`w-full rounded-t transition-all hover:opacity-80 ${colorClasses[color] || colorClasses.blue}`}
                  style={{ height: `${percentage}%`, minHeight: '4px' }}
                  title={`${item[labelKey]}: ${item[valueKey]}`}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center truncate w-full">
                {item[labelKey]}
              </div>
              <div className="text-xs font-semibold text-gray-900 mt-1">
                {typeof item[valueKey] === 'number' && item[valueKey] >= 1000
                  ? (item[valueKey] / 1000).toFixed(1) + 'k'
                  : item[valueKey]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Line Chart Component
export const LineChart = ({ data, labelKey, valueKey, color = 'blue', height = 200 }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }
  const maxValue = Math.max(...data.map(d => d[valueKey] || 0), 1);
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - (item[valueKey] / maxValue) * 100;
    return { x, y, value: item[valueKey], label: item[labelKey] };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const colorValues = {
    blue: { stroke: 'rgb(59, 130, 246)', fill: 'rgba(59, 130, 246, 0.3)' },
    green: { stroke: 'rgb(34, 197, 94)', fill: 'rgba(34, 197, 94, 0.3)' },
    purple: { stroke: 'rgb(168, 85, 247)', fill: 'rgba(168, 85, 247, 0.3)' },
    orange: { stroke: 'rgb(249, 115, 22)', fill: 'rgba(249, 115, 22, 0.3)' },
  };
  
  const colors = colorValues[color] || colorValues.blue;
  const gradientId = `gradient-${color}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L 100 100 L 0 100 Z`}
          fill={`url(#${gradientId})`}
        />
        <path
          d={pathData}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="1"
            fill={colors.stroke}
            className="hover:r-2 transition-all"
          />
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        {data.map((item, index) => (
          <span key={index} className="truncate" style={{ flex: 1, textAlign: 'center' }}>
            {item[labelKey]}
          </span>
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs font-semibold text-gray-900">
        {data.map((item, index) => (
          <span key={index} className="truncate" style={{ flex: 1, textAlign: 'center' }}>
            {item[valueKey]}
          </span>
        ))}
      </div>
    </div>
  );
};

// Pie Chart Component
export const PieChart = ({ data, labelKey, valueKey, colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'] }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }
  const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  if (total === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }
  let currentAngle = 0;

  const segments = data.map((item, index) => {
    const percentage = (item[valueKey] / total) * 100;
    const angle = (item[valueKey] / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const x1 = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180));
    const y1 = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180));
    const x2 = 50 + 40 * Math.cos((currentAngle - 90) * (Math.PI / 180));
    const y2 = 50 + 40 * Math.sin((currentAngle - 90) * (Math.PI / 180));
    const largeArc = angle > 180 ? 1 : 0;

    return {
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[index % colors.length],
      label: item[labelKey],
      value: item[valueKey],
      percentage: percentage.toFixed(1)
    };
  });

  return (
    <div className="flex items-center space-x-6">
      <div className="flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-32 h-32">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={segment.color}
              stroke="white"
              strokeWidth="0.5"
              className="hover:opacity-80 transition-opacity"
            />
          ))}
        </svg>
      </div>
      <div className="flex-1 space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              ></div>
              <span className="text-sm text-gray-700">{segment.label}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-900">{segment.value}</span>
              <span className="text-xs text-gray-500 ml-1">({segment.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Revenue Chart Component (with currency formatting)
export const RevenueChart = ({ data, labelKey, valueKey, height = 200 }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }
  const maxValue = Math.max(...data.map(d => d[valueKey] || 0), 1);
  
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="flex items-end justify-between h-full space-x-1">
        {data.map((item, index) => {
          const percentage = (item[valueKey] / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center group">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
                <div
                  className="w-full rounded-t transition-all hover:opacity-80 bg-gradient-to-t from-green-500 to-green-400 group-hover:from-green-600 group-hover:to-green-500"
                  style={{ height: `${percentage}%`, minHeight: '4px' }}
                  title={`${item[labelKey]}: $${item[valueKey].toLocaleString()}`}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center truncate w-full">
                {item[labelKey]}
              </div>
              <div className="text-xs font-semibold text-green-600 mt-1">
                ${item[valueKey] >= 1000 ? (item[valueKey] / 1000).toFixed(1) + 'k' : item[valueKey]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

