import React, { useState } from 'react';
import { Camera, Loader2, Save, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { extractFromImage } from '../services/extract.js';
import { addOperation } from '../db/actions.js';
import { Card, SectionTitle, Button, DateInput, TextInput, TextArea, Badge } from '../components/ui/Controls.jsx';

export default function OperationsPhotoImport() {
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
      const extracted = await extractFromImage(file, 'operations');
      const normalized = extracted.map((r) => ({
        date: r.date || '',
        patientName: r.patientName || '',
        operationType: r.operationType || '',
        details: r.details || '',
        include: true
      }));
      if (normalized.length === 0) normalized.push({ date: '', patientName: '', operationType: '', details: '', include: true });
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
      if (!row.date || !row.patientName || !row.operationType) continue;
      await addOperation({
        date: row.date,
        patientName: row.patientName,
        operationType: row.operationType,
        details: row.details || ''
      });
      count += 1;
    }
    setSavedCount(count);
    setRows((prev) => prev.filter((r) => !(r.include && r.date && r.patientName && r.operationType)));
    if (count === rows.length) setStatus('idle');
  }

  return (
    <Card>
      <SectionTitle icon={Camera} title="استيراد من صورة سجل العمليات" subtitle="صوّر صفحة العمليات المكتوبة بخط اليد وسيقترح التطبيق البيانات تلقائيًا" />

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
          <CheckCircle2 size={14} /> تم حفظ {savedCount} عملية بنجاح
        </p>
      )}

      {status === 'review' && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted">
            راجع كل سطر وعدّل ما تحتاجه. الحقول الفارغة لم يستطع النظام قراءتها بثقة - أكملها يدويًا قبل الحفظ.
          </p>
          {rows.map((row, idx) => {
            const incomplete = !row.date || !row.patientName || !row.operationType;
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
                  <TextInput value={row.patientName} onChange={(e) => updateRow(idx, 'patientName', e.target.value)} placeholder="اسم المريض" />
                </div>
                <TextInput value={row.operationType} onChange={(e) => updateRow(idx, 'operationType', e.target.value)} placeholder="نوع العملية" />
                <TextArea value={row.details} onChange={(e) => updateRow(idx, 'details', e.target.value)} placeholder="تفاصيل (اختياري)" />
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
