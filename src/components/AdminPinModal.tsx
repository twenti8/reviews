import { useState } from 'react';
import { Eye, EyeOff, Lock, X } from 'lucide-react';
import type { ThemePalette } from '../types/store';

interface AdminPinModalProps {
  expectedPin: string;
  palette: ThemePalette;
  onUnlock: () => void;
  onClose: () => void;
}

export function AdminPinModal({
  expectedPin,
  palette,
  onUnlock,
  onClose,
}: AdminPinModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === expectedPin.trim()) {
      setError('');
      onUnlock();
    } else {
      setError('รหัสผ่าน PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
        style={{
          backgroundColor: palette.card,
          color: palette.text,
          border: `1px solid ${palette.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: palette.accentSoft, color: palette.accent }}
            >
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <h2 id="pin-modal-title" className="text-base font-bold leading-tight">
                เข้าสู่หลังบ้านร้าน
              </h2>
              <p className="text-xs" style={{ color: palette.textMuted }}>
                กรุณากรอกรหัส PIN เพื่อจัดการร้าน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างกรอกรหัส PIN"
            className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center"
            style={{ backgroundColor: palette.cardSubtle, color: palette.textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="admin-pin-input" className="block text-xs font-semibold mb-1.5">
              รหัส PIN (ค่าเริ่มต้น: 1234)
            </label>
            <div className="relative">
              <input
                id="admin-pin-input"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (error) setError('');
                }}
                placeholder="กรอกรหัส PIN"
                className="w-full min-h-[46px] pl-4 pr-12 py-2.5 rounded-2xl text-sm font-mono tracking-widest outline-none"
                style={{
                  backgroundColor: palette.cardSubtle,
                  color: palette.text,
                  border: `1px solid ${error ? '#E11D48' : palette.border}`,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPin((prev) => !prev)}
                aria-label={showPin ? 'ซ่อนรหัส PIN' : 'แสดงรหัส PIN'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[38px] min-h-[38px] rounded-xl flex items-center justify-center"
                style={{ color: palette.textMuted }}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs mt-1.5 text-rose-500">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: palette.cardSubtle, color: palette.textMuted }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: palette.accent, color: palette.accentText }}
            >
              ปลดล็อกหลังบ้าน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
