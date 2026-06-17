import React, { useMemo, useState } from 'react';
import { Save, Trash2, Scissors, Search, User } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData.js';
import { addOperation, deleteOperation, ensureOperationType } from '../db/actions.js';
import { formatArabicDate } from '../db/fiscalYear.js';
import { Card, SectionTitle, Field, DateInput, TextInput, TextArea, Button, EmptyState } from '../components/ui/Controls.jsx';
import ComboBox from '../components/ComboBox.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function OperationsLog() {
  const { operations, operationTypes } = useFinanceData();
  const [date, setDate] = useState(todayISO());
  const [patientName, setPatientName] = useState('');
  const [operationType, setOperationType] = useState('');
  const [details, setDetails] = useState('');
  const [search, setSearch] = useState('');

  const typeOptions = useMemo(() => operationTypes.map((t) => t.name).sort(), [operationTypes]);

  async function handleSave(e) {
    e.preventDefault();
    if (!patientName || !operationType) return;
    await addOperation({ date, patientName, operationType, details });
    setPatientName('');
    setOperationType('');
    setDetails('');
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return operations;
    return operations.filter(
      (o) =>
        o.patientName.toLowerCase().includes(q) ||
        o.operationType.toLowerCase().includes(q) ||
        (o.details || '').toLowerCase().includes(q)
    );
  }, [operations, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">قسم العمليات</h1>
        <p className="text-sm text-muted mt-0.5">سجل العمليات الجراحية وأنواعها</p>
      </div>

      <Card>
        <SectionTitle icon={Scissors} title="تسجيل عملية جديدة" />
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="التاريخ" required>
              <DateInput value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <Field label="اسم المريض" required>
              <TextInput value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </Field>
          </div>
          <Field label="نوع العملية" required hint="اكتب نوعًا جديدًا وسيُحفظ تلقائيًا للاستخدام لاحقًا">
            <ComboBox
              value={operationType}
              onChange={setOperationType}
              options={typeOptions}
              placeholder="ابحث أو أضف نوع عملية..."
              onCreateOption={ensureOperationType}
            />
          </Field>
          <Field label="تفاصيل (اختياري)">
            <TextArea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="ملاحظات عن الحالة أو العملية" />
          </Field>
          <Button type="submit">
            <Save size={16} /> حفظ العملية
          </Button>
        </form>
      </Card>

      <Card>
        <SectionTitle title={`سجل العمليات (${operations.length})`} />
        <div className="relative mb-3">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو نوع العملية..."
            className="pe-9"
          />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Scissors} title="لا توجد عمليات" hint="سجّل أول عملية من الأعلى" />
        ) : (
          <div className="divide-y divide-primary-100/60 max-h-[28rem] overflow-auto">
            {filtered.map((row) => (
              <div key={row.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-ink">{row.operationType}</p>
                    <span className="text-xs text-muted">{formatArabicDate(row.date)}</span>
                  </div>
                  <p className="text-sm text-muted flex items-center gap-1 mt-0.5">
                    <User size={12} /> {row.patientName}
                  </p>
                  {row.details && <p className="text-sm text-ink/80 mt-1">{row.details}</p>}
                </div>
                <button
                  onClick={() => deleteOperation(row.id)}
                  className="text-leave-500 p-2 hover:bg-leave-100 rounded-lg shrink-0"
                  aria-label="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
