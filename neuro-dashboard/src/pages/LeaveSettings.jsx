import React, { useMemo, useState } from 'react';
import { Save, Trash2, Plane, ShieldAlert, Tag, Gift, CalendarRange } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData.js';
import { addLeavePeriod, deleteLeavePeriod, deleteOperationType, clearAllData } from '../db/actions.js';
import { computeFiscalYearSummary } from '../db/calculations.js';
import { fiscalYearOptions, formatArabicDate } from '../db/fiscalYear.js';
import { Card, SectionTitle, Field, DateInput, TextInput, Button, Badge, EmptyState, formatMoney } from '../components/ui/Controls.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function LeaveSettings() {
  const data = useFinanceData();
  const { leavePeriods, operationTypes } = data;

  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  async function handleAddLeave(e) {
    e.preventDefault();
    if (new Date(endDate) < new Date(startDate)) return;
    await addLeavePeriod({ startDate, endDate, note });
    setNote('');
  }

  const sortedLeave = useMemo(
    () => [...leavePeriods].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
    [leavePeriods]
  );

  const allDates = useMemo(
    () => [...data.monthlySalaries.map((s) => new Date(s.year, s.month - 1, 1)), ...leavePeriods.map((l) => l.startDate)],
    [data, leavePeriods]
  );
  const fyOptions = useMemo(() => fiscalYearOptions(allDates), [allDates]);
  const fySummaries = useMemo(() => fyOptions.map((label) => computeFiscalYearSummary(label, data)), [fyOptions, data]);

  async function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    await clearAllData();
    setConfirmClear(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">الإجازات والإعدادات</h1>
        <p className="text-sm text-muted mt-0.5">إجازات السفر تُحسب بالراتب الأساسي فقط، وعدم وجود إجازة في سنة كاملة يمنح مكافأة شهر إضافي</p>
      </div>

      <Card>
        <SectionTitle icon={Plane} title="تسجيل إجازة / سفر" />
        <form onSubmit={handleAddLeave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="تاريخ البداية" required>
              <DateInput value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </Field>
            <Field label="تاريخ النهاية" required>
              <DateInput value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate} />
            </Field>
          </div>
          <Field label="ملاحظة (اختياري)">
            <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: سفر سياحي" />
          </Field>
          <Button type="submit"><Save size={16} /> حفظ الإجازة</Button>
        </form>
      </Card>

      <Card>
        <SectionTitle title="الإجازات المسجّلة" />
        {sortedLeave.length === 0 ? (
          <EmptyState icon={Plane} title="لا توجد إجازات مسجّلة" />
        ) : (
          <div className="divide-y divide-primary-100/60">
            {sortedLeave.map((row) => (
              <div key={row.id} className="flex items-center justify-between py-3 gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {formatArabicDate(row.startDate)} ← {formatArabicDate(row.endDate)}
                  </p>
                  {row.note && <p className="text-xs text-muted mt-0.5">{row.note}</p>}
                </div>
                <button onClick={() => deleteLeavePeriod(row.id)} className="text-leave-500 p-2 hover:bg-leave-100 rounded-lg" aria-label="حذف">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle icon={CalendarRange} title="حالة السنوات المالية" subtitle="السفر والمكافآت لكل سنة" />
        <div className="space-y-2">
          {fySummaries.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-canvas">
              <p className="font-semibold text-ink">{s.label}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {s.hasLeaveOverlap ? (
                  <Badge tone="leave"><Plane size={12} /> يوجد سفر</Badge>
                ) : s.bonusEligible ? (
                  <Badge tone="success"><Gift size={12} /> مكافأة {formatMoney(s.bonus)} ج.م</Badge>
                ) : (
                  <Badge tone="muted">لم تكتمل</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={Tag} title="أنواع العمليات المحفوظة" subtitle="إزالة نوع من القائمة لا يحذف العمليات السابقة" />
        {operationTypes.length === 0 ? (
          <EmptyState icon={Tag} title="لم تُضف أي أنواع عمليات بعد" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {operationTypes.map((t) => (
              <span key={t.id} className="flex items-center gap-1.5 bg-primary-50 text-primary-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                {t.name}
                <button onClick={() => deleteOperationType(t.id)} aria-label="حذف النوع">
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-leave-500/30">
        <SectionTitle icon={ShieldAlert} title="منطقة الخطر" subtitle="حذف جميع البيانات المخزّنة على هذا الجهاز نهائيًا" />
        <Button variant="danger" onClick={handleClearAll}>
          <Trash2 size={16} /> {confirmClear ? 'اضغط مرة أخرى للتأكيد النهائي' : 'حذف كل البيانات'}
        </Button>
        {confirmClear && (
          <p className="text-xs text-leave-500 mt-2">
            تأكد من أخذ نسخة احتياطية من قسم «المزامنة والنسخ الاحتياطي» قبل الحذف.
          </p>
        )}
      </Card>
    </div>
  );
}
