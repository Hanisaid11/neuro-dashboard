import React, { useMemo, useRef, useState } from 'react';
import {
  Save, Trash2, Scissors, Search, User, Pencil, X,
  BarChart2, ChevronDown, ChevronUp, Calendar, Camera, Image
} from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData.js';
import { addOperation, updateOperation, deleteOperation, ensureOperationType } from '../db/actions.js';
import { formatArabicDate, arabicMonthName, isDateInRange } from '../db/fiscalYear.js';
import { isDateOnLeave } from '../db/calculations.js';
import {
  Card, SectionTitle, Field, DateInput, TextInput, TextArea,
  Button, EmptyState, Badge
} from '../components/ui/Controls.jsx';
import ComboBox from '../components/ComboBox.jsx';
import OperationsPhotoImport from '../components/OperationsPhotoImport.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

const RANGES = [
  { key: '1m', label: 'شهر' },
  { key: '3m', label: '3 أشهر' },
  { key: '6m', label: '6 أشهر' },
  { key: '1y', label: 'سنة' },
  { key: 'all', label: 'الكل' }
];

function rangeStart(key) {
  const now = new Date();
  if (key === '1m') return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  if (key === '3m') return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  if (key === '6m') return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  if (key === '1y') return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return new Date('2000-01-01');
}

function groupByMonth(ops) {
  const map = {};
  ops.forEach((op) => {
    const d = new Date(op.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = [];
    map[key].push(op);
  });
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
}

// Convert a File to base64 string
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); // includes data: prefix
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── Photo thumbnail ───────────────────────────────────────────────────────────
function PhotoThumb({ src, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  if (!src) return null;
  return (
    <div className="mt-2">
      <div className="relative inline-block">
        <img
          src={src}
          alt="صورة العملية"
          onClick={() => setExpanded(true)}
          className="h-20 w-20 object-cover rounded-lg border border-primary-100 cursor-pointer hover:opacity-90"
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-1.5 -left-1.5 bg-leave-500 text-white rounded-full p-0.5"
            aria-label="حذف الصورة"
          >
            <X size={10} />
          </button>
        )}
      </div>
      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
          <img src={src} alt="صورة العملية" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ op, typeOptions, onSave, onClose }) {
  const [date, setDate] = useState(op.date);
  const [patientName, setPatientName] = useState(op.patientName);
  const [operationType, setOperationType] = useState(op.operationType);
  const [details, setDetails] = useState(op.details || '');
  const [photo, setPhoto] = useState(op.photoBase64 || null);
  const [afterShift, setAfterShift] = useState(op.afterShift || false);
  const fileRef = useRef();

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setPhoto(b64);
  }

  async function handleSave() {
    if (!patientName || !operationType) return;
    await updateOperation(op.id, { date, patientName, operationType, details, photoBase64: photo || null, afterShift });
    onSave();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl space-y-4 p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-ink text-lg">تعديل العملية</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary-50"><X size={18} /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="التاريخ" required><DateInput value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="اسم المريض" required><TextInput value={patientName} onChange={(e) => setPatientName(e.target.value)} /></Field>
        </div>
        <Field label="نوع العملية" required>
          <ComboBox value={operationType} onChange={setOperationType} options={typeOptions} placeholder="نوع العملية..." onCreateOption={ensureOperationType} />
        </Field>
        <Field label="تفاصيل (اختياري)"><TextArea value={details} onChange={(e) => setDetails(e.target.value)} /></Field>
        <Field label="صورة العملية (اختياري)">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Camera size={14} /> {photo ? 'تغيير الصورة' : 'إضافة صورة'}
          </Button>
          {photo && <PhotoThumb src={photo} onRemove={() => setPhoto(null)} />}
        </Field>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setAfterShift((v) => !v)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${afterShift ? 'bg-primary-500' : 'bg-primary-100'}`}
          >
            <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${afterShift ? 'translate-x-5' : 'translate-x-0'}`} style={{ direction: 'ltr' }} />
          </div>
          <span className="text-sm font-semibold text-ink">بعد الدوام</span>
        </label>
        <div className="flex gap-2">
          <Button onClick={handleSave}><Save size={16} /> حفظ التعديل</Button>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
        </div>
      </div>
    </div>
  );
}

// ── Stats panel (operations + income) ────────────────────────────────────────
function StatsPanel({ operations, leavePeriods, incomeData }) {
  const [range, setRange] = useState('3m');

  const filteredOps = useMemo(() => {
    const start = rangeStart(range);
    return operations
      .filter((o) => isDateInRange(o.date, start, new Date()))
      .filter((o) => !isDateOnLeave(o.date, leavePeriods));
  }, [operations, leavePeriods, range]);

  const byType = useMemo(() => {
    const map = {};
    filteredOps.forEach((o) => { map[o.operationType] = (map[o.operationType] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredOps]);

  const byMonth = useMemo(() => groupByMonth(filteredOps), [filteredOps]);

  return (
    <Card>
      <SectionTitle icon={BarChart2} title="الإحصائيات الشاملة" subtitle="العمليات والدخل — مع استبعاد فترات الإجازة" />
      <div className="flex gap-2 flex-wrap mb-4">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${range === r.key ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Operations stats */}
      <p className="text-xs font-bold text-muted uppercase mb-2 mt-1">العمليات الجراحية</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-primary-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-primary-700">{filteredOps.length}</p>
          <p className="text-xs text-muted">إجمالي العمليات</p>
        </div>
        <div className="bg-accent-400/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-accent-600">{byType.length}</p>
          <p className="text-xs text-muted">أنواع مختلفة</p>
        </div>
        <div className="bg-canvas rounded-xl p-3 text-center">
          <p className="text-sm font-extrabold text-ink truncate">{byType[0]?.[0] ?? '—'}</p>
          <p className="text-xs text-muted">الأكثر تكرارًا</p>
        </div>
      </div>

      {byType.length > 0 && (
        <div className="mb-5 space-y-2">
          {byType.map(([type, count]) => {
            const pct = Math.round((count / filteredOps.length) * 100);
            return (
              <div key={type}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="font-medium text-ink truncate">{type}</span>
                  <span className="font-bold text-primary-700 shrink-0 ms-2">{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-primary-100 rounded-full">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {byMonth.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-muted mb-2">توزيع حسب الشهر</p>
          <div className="space-y-1.5">
            {byMonth.map(([key, ops]) => {
              const [y, m] = key.split('-').map(Number);
              return (
                <div key={key} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                  <span className="text-sm text-ink">{arabicMonthName(m)} {y}</span>
                  <span className="text-sm font-bold text-primary-700">{ops.length} عملية</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredOps.length === 0 && (
        <p className="text-sm text-muted text-center py-2">لا توجد عمليات في هذه الفترة</p>
      )}
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OperationsLog() {
  const data = useFinanceData();
  const { operations, operationTypes, leavePeriods } = data;
  const [date, setDate] = useState(todayISO());
  const [patientName, setPatientName] = useState('');
  const [operationType, setOperationType] = useState('');
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState(null);
  const [afterShift, setAfterShift] = useState(false);
  const [search, setSearch] = useState('');
  const [editingOp, setEditingOp] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});
  const fileRef = useRef();

  const typeOptions = useMemo(() => operationTypes.map((t) => t.name).sort(), [operationTypes]);

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(await fileToBase64(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!patientName || !operationType) return;
    await addOperation({ date, patientName, operationType, details, photoBase64: photo || null, afterShift });
    setPatientName('');
    setOperationType('');
    setDetails('');
    setPhoto(null);
    setAfterShift(false);
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

  const monthGroups = useMemo(() => groupByMonth(filtered), [filtered]);

  function toggleMonth(key) {
    setExpandedMonths((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">قسم العمليات</h1>
        <p className="text-sm text-muted mt-0.5">سجل العمليات الجراحية وأنواعها</p>
      </div>

      {editingOp && (
        <EditModal op={editingOp} typeOptions={typeOptions} onSave={() => setEditingOp(null)} onClose={() => setEditingOp(null)} />
      )}

      {/* Entry form */}
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
          <Field label="نوع العملية" required hint="اكتب نوعًا جديدًا وسيُحفظ تلقائيًا">
            <ComboBox value={operationType} onChange={setOperationType} options={typeOptions} placeholder="ابحث أو أضف نوع عملية..." onCreateOption={ensureOperationType} />
          </Field>
          <Field label="تفاصيل (اختياري)">
            <TextArea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="ملاحظات عن الحالة أو العملية" />
          </Field>
          <Field label="صورة (اختياري)">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera size={14} /> {photo ? 'تغيير الصورة' : 'إضافة صورة'}
            </Button>
            {photo && <PhotoThumb src={photo} onRemove={() => setPhoto(null)} />}
          </Field>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setAfterShift((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${afterShift ? 'bg-primary-500' : 'bg-primary-100'}`}
            >
              <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${afterShift ? 'translate-x-5' : 'translate-x-0'}`} style={{ direction: 'ltr' }} />
            </div>
            <span className="text-sm font-semibold text-ink">بعد الدوام</span>
          </label>
          <Button type="submit"><Save size={16} /> حفظ العملية</Button>
        </form>
      </Card>

      <OperationsPhotoImport />
      <StatsPanel operations={operations} leavePeriods={leavePeriods} incomeData={data} />

      {/* Monthly grouped log */}
      <Card>
        <SectionTitle title={`سجل العمليات (${operations.length})`} icon={Calendar} />
        <div className="relative mb-3">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو نوع العملية..." className="pe-9" />
        </div>

        {monthGroups.length === 0 ? (
          <EmptyState icon={Scissors} title="لا توجد عمليات" hint="سجّل أول عملية من الأعلى" />
        ) : (
          <div className="space-y-2">
            {monthGroups.map(([key, ops]) => {
              const [y, m] = key.split('-').map(Number);
              const isOpen = !!expandedMonths[key];
              return (
                <div key={key} className="border border-primary-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleMonth(key)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-primary-50/60 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink">{arabicMonthName(m)} {y}</span>
                      <Badge tone="primary">{ops.length} عملية</Badge>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-primary-100/60">
                      {ops.map((row) => (
                        <div key={row.id} className="py-3 px-4 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-ink">{row.operationType}</p>
                              <span className="text-xs text-muted">{formatArabicDate(row.date)}</span>
                              {row.afterShift && <Badge tone="accent">بعد الدوام</Badge>}
                            </div>
                            <p className="text-sm text-muted flex items-center gap-1 mt-0.5">
                              <User size={12} /> {row.patientName}
                            </p>
                            {row.details && <p className="text-sm text-ink/80 mt-1">{row.details}</p>}
                            {row.photoBase64 && <PhotoThumb src={row.photoBase64} />}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setEditingOp(row)} className="text-primary-500 p-2 hover:bg-primary-100 rounded-lg" aria-label="تعديل">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => deleteOperation(row.id)} className="text-leave-500 p-2 hover:bg-leave-100 rounded-lg" aria-label="حذف">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
