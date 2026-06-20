import React, { useRef, useState } from 'react';
import { Camera, Trash2, X, Pencil, Check } from 'lucide-react';
import { addMonthlyPhoto, deleteMonthlyPhoto, updateMonthlyPhotoCaption } from '../db/actions.js';
import { Button, TextInput } from './ui/Controls.jsx';

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function PhotoCard({ photo, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption || '');
  const [expanded, setExpanded] = useState(false);

  async function saveCaption() {
    await updateMonthlyPhotoCaption(photo.id, caption);
    setEditing(false);
  }

  return (
    <>
      <div className="rounded-xl border border-primary-100 overflow-hidden bg-white">
        <img
          src={photo.photoBase64}
          alt={photo.caption || 'صورة شهرية'}
          className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setExpanded(true)}
        />
        <div className="px-2 py-1.5 flex items-center gap-1">
          {editing ? (
            <>
              <TextInput
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="text-xs py-1 flex-1"
                placeholder="وصف..."
                autoFocus
              />
              <button onClick={saveCaption} className="text-success-500 p-1 hover:bg-success-50 rounded-lg"><Check size={13} /></button>
              <button onClick={() => setEditing(false)} className="text-muted p-1 hover:bg-canvas rounded-lg"><X size={13} /></button>
            </>
          ) : (
            <>
              <span className="text-xs text-muted flex-1 truncate">{photo.caption || 'بدون وصف'}</span>
              <button onClick={() => setEditing(true)} className="text-muted p-1 hover:bg-canvas rounded-lg"><Pencil size={12} /></button>
              <button onClick={() => onDelete(photo.id)} className="text-leave-400 p-1 hover:bg-leave-50 rounded-lg"><Trash2 size={12} /></button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
          <img src={photo.photoBase64} alt={photo.caption} className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </>
  );
}

export default function MonthlyPhotos({ year, month, photos }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const monthPhotos = photos.filter((p) => p.year === year && p.month === month);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const b64 = await fileToBase64(file);
    await addMonthlyPhoto(year, month, b64, '');
    setUploading(false);
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted">صور الشهر ({monthPhotos.length})</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs"
        >
          <Camera size={13} /> {uploading ? 'جارٍ الرفع...' : 'إضافة صورة'}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      </div>
      {monthPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {monthPhotos.map((p) => (
            <PhotoCard key={p.id} photo={p} onDelete={deleteMonthlyPhoto} />
          ))}
        </div>
      )}
    </div>
  );
}
