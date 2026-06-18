import React from 'react';
import { arabicMonthName } from '../../db/fiscalYear.js';
import { formatUSD, formatYER } from '../ui/Controls.jsx';

const CX = 100;
const CY = 100;
const OUTER_R = 92;
const INNER_R = 58;
const GAP_DEG = 2.4;

function polarToCartesian(r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function segmentPath(startAngle, endAngle) {
  const outerStart = polarToCartesian(OUTER_R, startAngle);
  const outerEnd = polarToCartesian(OUTER_R, endAngle);
  const innerStart = polarToCartesian(INNER_R, startAngle);
  const innerEnd = polarToCartesian(INNER_R, endAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER_R} ${INNER_R} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    'Z'
  ].join(' ');
}

export default function FiscalCycleRing({ months, label, grandTotalYER, grandTotalUSD, selectedIndex, onSelect }) {
  const now = new Date();
  const today = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const active = months[selectedIndex];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-56 h-56 shrink-0">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {months.map((m, i) => {
            const startAngle = i * 30 + GAP_DEG / 2;
            const endAngle = (i + 1) * 30 - GAP_DEG / 2;
            const isLeave = m.fullyOnLeave;
            const hasData = m.totalYER > 0;
            const isToday = m.year === today.year && m.month === today.month;
            const isSelected = selectedIndex === i;
            const fill = isLeave ? '#C45B4F' : hasData ? '#0F6B68' : '#E2E6EA';
            const labelPos = polarToCartesian((OUTER_R + INNER_R) / 2, (startAngle + endAngle) / 2);
            return (
              <g key={i} className="cursor-pointer" onClick={() => onSelect(i)}>
                <path
                  d={segmentPath(startAngle, endAngle)}
                  fill={fill}
                  opacity={isSelected ? 1 : hasData || isLeave ? 0.85 : 0.6}
                  stroke={isSelected ? '#C9962C' : isToday ? '#1B2430' : 'none'}
                  strokeWidth={isSelected ? 3 : isToday ? 1.5 : 0}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill={hasData || isLeave ? '#FFFFFF' : '#5B6675'}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <span className="text-[11px] text-muted font-semibold">{label}</span>
          <span className="text-lg font-extrabold text-ink tnum mt-0.5 leading-tight">{formatYER(grandTotalYER)}</span>
          <span className="text-[10px] text-muted">إجمالي باقي الدخل</span>
          <span className="text-sm font-bold text-accent-600 tnum mt-1.5 leading-tight">{formatUSD(grandTotalUSD)}</span>
          <span className="text-[10px] text-muted">الراتب + المكافأة</span>
        </div>
      </div>

      <div className="flex-1 w-full">
        {active ? (
          <div className="bg-canvas rounded-xl p-4">
            <p className="font-bold text-ink">
              {arabicMonthName(active.month)} {active.year}
            </p>
            {active.fullyOnLeave ? (
              <p className="text-sm text-leave-500 mt-1 font-semibold">إجازة كاملة - الراتب الأساسي فقط</p>
            ) : (
              <p className="text-sm text-muted mt-1">دخل الشهر الكامل</p>
            )}
            <p className="text-2xl font-extrabold text-primary-700 tnum mt-2">{formatYER(active.totalYER)}</p>
            <p className="text-sm font-semibold text-accent-600 tnum mt-1">الراتب: {formatUSD(active.salaryUSD)}</p>
            {active.excludedCount > 0 && (
              <p className="text-xs text-leave-500 mt-1">
                تم استثناء {active.excludedCount} مدخل بسبب الإجازة
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">اضغط على أي شهر في الحلقة لعرض تفاصيله</p>
        )}
        <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-500 inline-block" /> يوجد دخل
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-leave-500 inline-block" /> إجازة كاملة
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2E6EA] inline-block" /> بدون بيانات
          </span>
        </div>
      </div>
    </div>
  );
}
