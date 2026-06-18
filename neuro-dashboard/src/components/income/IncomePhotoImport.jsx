import React, { useState } from 'react';
import { Camera, Loader2, Save, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { extractFromImage } from '../../services/extract.js';
import {
  addOnCallEntry, addMedicationEntry, upsertFixedPercentages, upsertMonthlySalary
} from '../../db/actions.js';
import { Card, SectionTitle, Button, Select, DateInput, NumberInput, TextInput, Badge } from '../ui/Controls.jsx';

const CATEGORY_LABELS = {
  oldHospital: 'استدعاء - مستشفى قديم (ريال)',
  newHospital: 'استدعاء - مستشفى جديد (ريال)',
  medication: 'نسب أدوية (ريال)',
  hospitalPct: 'نسب مستشفى (ريال)',
  mriPct: 'نسب رنين (ريال)',
  nervePct: 'نسب تخطيط أعصاب (ريال)',
  eegPct: 'نسب تخطيط دماغ (ريال)',
  implantsPct: 'نسب براغي وشنتات (ريال)',
  salary: 'الراتب الأساسي (دولار)'
};

const FIXED_PCT_KEYS = ['hospitalPct', 'mriPct', 'nervePct', 'eegPct', 'implantsPct'];

function emptyRow() {
  return { date: '', category: '', amount: '', note: '', include: true };
}

export default function IncomePhotoImport() {
  const [status, setStatus] = useState('idle'); // idle | loading | review | error
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [savedCount, setSavedCount] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStatus('loading');
    setSavedCount(null);
    try {
      const extracted = await extractFromImage(file, 'income');
      const normalized = extracted.map((r) => ({
        date: r.date || '',
        category: r.category && CATEGORY_LABELS[r.category] ? r.category : '',
        amount: r.amount ?? '',
        note: r.note || '',
        include: true
      }));
      if (normalized.length === 0) normalized.push(emptyRow());
      setRows(normalized);
      setStatus('review');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  function updateRow(idx, field, value) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function removeRow(idx) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveAll() {
    let count = 0;
    for (const row of rows) {
      if (!row.include) continue;
      if (!row.date || !row.category || row.amount === '' || row.amount === null) continue;
      const amount = Number(row.amount);
      const d = new Date(row.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      if (row.category === 'oldHospital' || row.category === 'newHospital') {
        await addOnCallEntry({
          date: row.date,
          hospital: row.category === 'oldHospital' ? 'old' : 'new',
          amount,
          note: row.note || '',
          isBulk: false
        });
      } else if (row.category === 'medication') {
        await addMedicationEntry({ date: row.date, itemName: row.note || '', amount, isBulk: false });
      } else if (row.category === 'salary') {
        await upsertMonthlySalary(year, month, amount);
      } else if (FIXED_PCT_KEYS.includes(row.category)) {
        await upsertFixedPercentages(year, month, { [row.category]: amount });
      }
      count += 1;
    }
    setSavedCount(count);
    setRows((prev) => prev.filter((r) => !(r.include && r.date && r.category && r.amount !== '')));
    if (rows.length === count) setStatus('idle');
  }

  return (
    <Card>
      <SectionTitle icon={Camera} title="استيراد من صورة الدفتر" subtitle="صوّر صفحة النسب المكتوبة بخط اليد وسيقترح التطبيق القيم تلقائيًا" />

      {status !== 'review' && (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary-200 rounded-xl py-8 cursor-pointer hover:bg-primary-50/50 transition-colors">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} disabled={status === 'loading'} />
          {status === 'loading' ? (
            <>
              <Loader2 size={28} className="text-primary-500 animate-spin" />
              <span className="text-sm text-muted">جارٍ تحليل الصورة...</span>
            </>
          ) : (
            <>
              <Camera size={28} className="text-primary-500" />
              <span className="text-sm font-semibold text-primary-700">اضغط لاختيار صورة أو تصوير الدفتر</span>
            </>
          )}
        </label>
      )}

      {status === 'error' && (
        <p className="flex items-center gap-2 text-sm text-leave-500 mt-3">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {savedCount !== null && (
        <p className="flex items-center gap-2 text-sm text-success-500 font-semibold mt-3">
          <CheckCircle2 size={14} /> تم حفظ {savedCount} إدخال بنجاح
        </p>
      )}

      {status === 'review' && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted">
            راجع كل سطر وعدّل ما تحتاجه. الحقول الفارغة لم يستطع النظام قراءتها بثقة - أكملها يدويًا قبل الحفظ.
          </p>
          {rows.map((row, idx) => {
            const incomplete = !row.date || !row.category || row.amount === '';
            return (
              <div key={idx} className={`rounded-xl border p-3 space-y-2 ${incomplete ? 'border-accent-400/60 bg-accent-400/5' : 'border-primary-100 bg-canvas'}`}>
                <div className="flex items-center justify-between">
                  {incomplete ? <Badge tone="accent">يحتاج إكمال</Badge> : <Badge tone="success">جاهز</Badge>}
                  <button onClick={() => removeRow(idx)} className="text-leave-500 p-1.5 hover:bg-leave-100 rounded-lg" aria-label="حذف السطر">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <DateInput value={row.date} onChange={(e) => updateRow(idx, 'date', e.target.value)} />
                  <Select value={row.category} onChange={(e) => updateRow(idx, 'category', e.target.value)}>
                    <option value="">اختر الفئة...</option>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput value={row.amount} onChange={(e) => updateRow(idx, 'amount', e.target.value)} placeholder="القيمة" />
                  <TextInput value={row.note} onChange={(e) => updateRow(idx, 'note', e.target.value)} placeholder="ملاحظة (اختياري)" />
                </div>
              </div>
            );
          })}
          <div className="flex gap-2">
            <Button onClick={handleSaveAll}><Save size={16} /> حفظ الجاهز منها</Button>
            <Button variant="outline" onClick={() => { setRows([]); setStatus('idle'); }}>إلغاء</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
