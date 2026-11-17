import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CloudDownload,
  CloudUpload,
  Code2,
  Copy,
  Image as ImageIcon,
  KeyRound,
  Music,
  Palette,
  Plus,
  RefreshCw,
  Star,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { PRESET_THEMES } from '../data/themes';
import type {
  AdminTab,
  CreditHighlight,
  CustomThemeColors,
  PresetThemeId,
  StoreState,
  ThemePalette,
} from '../types/store';
import { CODE_GS_TEMPLATE } from '../utils/codeGsTemplate';
import { compressImageFile } from '../utils/imageUpload';
import { parseYouTubeUrl, sortReviewsNewestFirst } from '../utils/storeHelpers';
import { SmartImage } from './SmartImage';

interface AdminDashboardProps {
  state: StoreState;
  palette: ThemePalette;
  sheetUrl: string;
  onUpdateState: (updater: (prev: StoreState) => StoreState, syncSettingsKeys?: string[]) => void;
  onDeleteReview: (reviewId: string) => Promise<void> | void;
  onSaveSheetUrl: (url: string) => void;
  onPullFromSheets: (url: string) => Promise<void>;
  onPushAllToSheets: (url: string) => Promise<void>;
  onClose: () => void;
}

const BIO_MAX_CHARS = 300;

export function AdminDashboard({
  state,
  palette,
  sheetUrl,
  onUpdateState,
  onDeleteReview,
  onSaveSheetUrl,
  onPullFromSheets,
  onPushAllToSheets,
  onClose,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('store');
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );

  // Store & PIN local edit helpers
  const [newPin, setNewPin] = useState(state.adminPin);
  const [pinSavedMsg, setPinSavedMsg] = useState('');

  // Credit highlight form
  const [creditUrlInput, setCreditUrlInput] = useState('');
  const [creditCaptionInput, setCreditCaptionInput] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Google Sheets form
  const [sheetUrlInput, setSheetUrlInput] = useState(sheetUrl);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [showCodeGs, setShowCodeGs] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setSheetUrlInput(sheetUrl);
  }, [sheetUrl]);

  const lightPresets = useMemo(
    () => PRESET_THEMES.filter((t) => t.mode === 'light'),
    [],
  );
  const darkPresets = useMemo(
    () => PRESET_THEMES.filter((t) => t.mode === 'dark'),
    [],
  );
  const sortedReviews = useMemo(() => sortReviewsNewestFirst(state.reviews), [state.reviews]);
  const parsedMusic = useMemo(
    () => parseYouTubeUrl(state.musicConfig.youtubeUrl),
    [state.musicConfig.youtubeUrl],
  );

  const showToast = (type: 'ok' | 'err', text: string) => {
    setStatusMessage({ type, text });
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const handleImageFileUpload = async (
    file: File | undefined,
    onSuccess: (compressedBase64: string) => void,
  ) => {
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 400,
        quality: 0.5,
        maxChars: 25000,
      });
      onSuccess(compressed);
      showToast(
        'ok',
        `บีบอัดรูปภาพเรียบร้อย (${compressed.length.toLocaleString()} ตัวอักษร)`,
      );
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'ไม่สามารถบีบอัดรูปภาพได้');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSelectThemePreset = (presetId: PresetThemeId) => {
    onUpdateState(
      (prev) => ({
        ...prev,
        theme: {
          ...prev.theme,
          presetId,
        },
      }),
      ['theme'],
    );
  };

  const handleCustomColorChange = (field: keyof CustomThemeColors, value: string) => {
    onUpdateState(
      (prev) => ({
        ...prev,
        theme: {
          presetId: 'custom',
          customColors: {
            ...prev.theme.customColors,
            [field]: value,
          },
        },
      }),
      ['theme'],
    );
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPin.trim();
    if (trimmed.length < 4) {
      setPinSavedMsg('รหัส PIN ควรมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    onUpdateState((prev) => ({ ...prev, adminPin: trimmed }), ['adminPin']);
    setPinSavedMsg('บันทึกรหัส PIN ใหม่เรียบร้อย');
    setTimeout(() => setPinSavedMsg(''), 3000);
  };

  const handleAddCredit = (imageUrl: string, caption: string) => {
    const cleanUrl = imageUrl.trim();
    if (!cleanUrl) {
      showToast('err', 'กรุณาอัปโหลดรูปหรือวางลิงก์รูปสลิปเครดิต');
      return;
    }
    const newItem: CreditHighlight = {
      id: `credit-${Date.now()}`,
      imageUrl: cleanUrl,
      caption: caption.trim() || `เครดิตลูกค้า #${state.creditHighlights.length + 1}`,
    };
    onUpdateState(
      (prev) => ({
        ...prev,
        creditHighlights: [newItem, ...prev.creditHighlights],
      }),
      ['creditHighlights'],
    );
    setCreditUrlInput('');
    setCreditCaptionInput('');
    showToast('ok', 'เพิ่มรูปเครดิตลูกค้าแล้ว');
  };

  const handleDeleteCredit = (id: string) => {
    onUpdateState(
      (prev) => ({
        ...prev,
        creditHighlights: prev.creditHighlights.filter((c) => c.id !== id),
      }),
      ['creditHighlights'],
    );
    showToast('ok', 'ลบรูปเครดิตลูกค้าแล้ว');
  };

  const handleCopyCodeGs = async () => {
    try {
      await navigator.clipboard.writeText(CODE_GS_TEMPLATE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      showToast('err', 'ไม่สามารถคัดลอกอัตโนมัติได้ กรุณาเลือกข้อความเพื่อคัดลอก');
    }
  };

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'store', label: 'ข้อมูลร้าน', icon: <Store className="w-4 h-4" /> },
    { id: 'media', label: 'เครดิตและเพลง', icon: <Music className="w-4 h-4" /> },
    { id: 'reviews', label: `จัดการรีวิว (${state.reviews.length})`, icon: <Star className="w-4 h-4" /> },
    { id: 'sheets', label: 'เชื่อมต่อ Google Sheets', icon: <CloudUpload className="w-4 h-4" /> },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="หน้าจัดการหลังบ้านร้าน"
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4"
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        style={{
          backgroundColor: palette.bg,
          color: palette.text,
          border: `1px solid ${palette.border}`,
        }}
      >
        {/* Top Bar */}
        <header
          className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4 shrink-0"
          style={{
            backgroundColor: palette.card,
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              จัดการหลังบ้านร้าน
            </h2>
            <p className="text-xs" style={{ color: palette.textMuted }}>
              ปรับแต่งข้อมูลร้าน ธีมสี เพลง เครดิตลูกค้า และซิงค์ Google Sheets
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าจัดการหลังบ้าน"
            className="min-w-[44px] min-h-[44px] px-3.5 rounded-2xl flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
            style={{ backgroundColor: palette.cardSubtle, color: palette.text }}
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">กลับหน้าร้าน</span>
          </button>
        </header>

        {/* Tab Strip */}
        <nav
          aria-label="เมนูจัดการหลังบ้าน"
          className="px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0"
          style={{
            backgroundColor: palette.card,
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.id)}
                className="min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
                style={{
                  backgroundColor: active ? palette.accent : palette.cardSubtle,
                  color: active ? palette.accentText : palette.textMuted,
                }}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Toast */}
        {statusMessage && (
          <div
            role="status"
            className="mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-2xl text-xs font-medium shrink-0"
            style={{
              backgroundColor:
                statusMessage.type === 'ok' ? palette.accentSoft : 'rgba(225, 29, 72, 0.14)',
              color: statusMessage.type === 'ok' ? palette.text : '#E11D48',
              border: `1px solid ${
                statusMessage.type === 'ok' ? palette.border : 'rgba(225, 29, 72, 0.35)'
              }`,
            }}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: ข้อมูลร้าน */}
          {activeTab === 'store' && (
            <div className="space-y-6">
              {/* Store Name & 3-Line Bio */}
              <section
                className="rounded-3xl p-4 sm:p-5 space-y-4"
                style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
              >
                <h3 className="text-sm font-bold">ข้อมูลโปรไฟล์ร้าน</h3>

                <div>
                  <label htmlFor="admin-store-name" className="block text-xs font-semibold mb-1.5">
                    ชื่อร้าน
                  </label>
                  <input
                    id="admin-store-name"
                    type="text"
                    value={state.storeInfo.name}
                    onChange={(e) =>
                      onUpdateState(
                        (prev) => ({
                          ...prev,
                          storeInfo: { ...prev.storeInfo, name: e.target.value },
                        }),
                        ['storeInfo'],
                      )
                    }
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl text-sm outline-none"
                    style={{
                      backgroundColor: palette.cardSubtle,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="admin-store-bio" className="text-xs font-semibold">
                      คำโปรยใต้ชื่อร้าน (แนะนำ 3 บรรทัด)
                    </label>
                    <span
                      className="text-xs font-mono tabular-nums"
                      style={{
                        color:
                          state.storeInfo.bio.length >= BIO_MAX_CHARS
                            ? '#E11D48'
                            : palette.textMuted,
                      }}
                    >
                      {state.storeInfo.bio.length} / {BIO_MAX_CHARS}
                    </span>
                  </div>
                  <textarea
                    id="admin-store-bio"
                    rows={3}
                    maxLength={BIO_MAX_CHARS}
                    value={state.storeInfo.bio}
                    onChange={(e) =>
                      onUpdateState(
                        (prev) => ({
                          ...prev,
                          storeInfo: {
                            ...prev.storeInfo,
                            bio: e.target.value.slice(0, BIO_MAX_CHARS),
                          },
                        }),
                        ['storeInfo'],
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl text-sm outline-none resize-none"
                    style={{
                      backgroundColor: palette.cardSubtle,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                    }}
                  />
                </div>
              </section>

              {/* Avatar & Banner Upload/URL */}
              <section
                className="rounded-3xl p-4 sm:p-5 space-y-4"
                style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">รูปโปรไฟล์ &amp; รูปแบนเนอร์</h3>
                  <span className="text-[11px]" style={{ color: palette.textMuted }}>
                    ย่อขนาดอัตโนมัติ (Max 400px · JPEG 0.5)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Avatar */}
                  <div
                    className="rounded-2xl p-3.5 space-y-3"
                    style={{
                      backgroundColor: palette.cardSubtle,
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0">
                        <SmartImage
                          src={state.avatarUrl}
                          alt="ตัวอย่างรูปโปรไฟล์ร้าน"
                          palette={palette}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">รูปโปรไฟล์วงกลม</p>
                        <label className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                          style={{ backgroundColor: palette.accent, color: palette.accentText }}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isCompressing ? 'กำลังบีบอัด...' : 'อัปโหลดรูป'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleImageFileUpload(file, (url) =>
                                onUpdateState((prev) => ({ ...prev, avatarUrl: url }), ['avatarUrl']),
                              );
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="admin-avatar-url" className="block text-[11px] mb-1" style={{ color: palette.textMuted }}>
                        หรือวางลิงก์ URL รูปโปรไฟล์
                      </label>
                      <input
                        id="admin-avatar-url"
                        type="url"
                        value={state.avatarUrl}
                        onChange={(e) =>
                          onUpdateState(
                            (prev) => ({ ...prev, avatarUrl: e.target.value }),
                            ['avatarUrl'],
                          )
                        }
                        placeholder="https://..."
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs outline-none"
                        style={{
                          backgroundColor: palette.card,
                          color: palette.text,
                          border: `1px solid ${palette.border}`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Banner */}
                  <div
                    className="rounded-2xl p-3.5 space-y-3"
                    style={{
                      backgroundColor: palette.cardSubtle,
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-14 rounded-xl overflow-hidden shrink-0">
                        <SmartImage
                          src={state.bannerUrl}
                          alt="ตัวอย่างรูปแบนเนอร์ร้าน"
                          palette={palette}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">รูปแบนเนอร์ด้านบน</p>
                        <label className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                          style={{ backgroundColor: palette.accent, color: palette.accentText }}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isCompressing ? 'กำลังบีบอัด...' : 'อัปโหลดรูป'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleImageFileUpload(file, (url) =>
                                onUpdateState((prev) => ({ ...prev, bannerUrl: url }), ['bannerUrl']),
                              );
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="admin-banner-url" className="block text-[11px] mb-1" style={{ color: palette.textMuted }}>
                        หรือวางลิงก์ URL รูปแบนเนอร์
                      </label>
                      <input
                        id="admin-banner-url"
                        type="url"
                        value={state.bannerUrl}
                        onChange={(e) =>
                          onUpdateState(
                            (prev) => ({ ...prev, bannerUrl: e.target.value }),
                            ['bannerUrl'],
                          )
                        }
                        placeholder="https://..."
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs outline-none"
                        style={{
                          backgroundColor: palette.card,
                          color: palette.text,
                          border: `1px solid ${palette.border}`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 12 Preset Themes + Custom Color Picker */}
              <section
                className="rounded-3xl p-4 sm:p-5 space-y-4"
                style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" style={{ color: palette.accent }} />
                  <h3 className="text-sm font-bold">ธีมสีร้าน (12 โทนสำเร็จรูป + สีของร้านเอง)</h3>
                </div>

                {/* 6 Light Pastel */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: palette.textMuted }}>
                    6 โทนพาสเทลสว่าง
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {lightPresets.map((preset) => {
                      const selected = state.theme.presetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectThemePreset(preset.id)}
                          aria-pressed={selected}
                          className="min-h-[48px] px-3 py-2.5 rounded-2xl flex items-center gap-2.5 text-left transition-transform active:scale-[0.98]"
                          style={{
                            backgroundColor: preset.bg,
                            color: preset.text,
                            border: selected
                              ? `2px solid ${preset.accent}`
                              : `1px solid ${preset.border}`,
                          }}
                        >
                          <span
                            className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: preset.accent, color: preset.accentText }}
                          >
                            {selected && <Check className="w-3 h-3" />}
                          </span>
                          <span className="text-xs font-semibold truncate">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6 Luxury Dark */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: palette.textMuted }}>
                    6 โทนดาร์กหรู
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {darkPresets.map((preset) => {
                      const selected = state.theme.presetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectThemePreset(preset.id)}
                          aria-pressed={selected}
                          className="min-h-[48px] px-3 py-2.5 rounded-2xl flex items-center gap-2.5 text-left transition-transform active:scale-[0.98]"
                          style={{
                            backgroundColor: preset.bg,
                            color: preset.text,
                            border: selected
                              ? `2px solid ${preset.accent}`
                              : `1px solid ${preset.border}`,
                          }}
                        >
                          <span
                            className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: preset.accent, color: preset.accentText }}
                          >
                            {selected && <Check className="w-3 h-3" />}
                          </span>
                          <span className="text-xs font-semibold truncate">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Picker */}
                <div
                  className="rounded-2xl p-4 space-y-3"
                  style={{
                    backgroundColor: palette.cardSubtle,
                    border:
                      state.theme.presetId === 'custom'
                        ? `2px solid ${palette.accent}`
                        : `1px solid ${palette.border}`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">สีของร้านเอง (Custom Color Picker)</span>
                    <button
                      type="button"
                      onClick={() => handleSelectThemePreset('custom')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{
                        backgroundColor:
                          state.theme.presetId === 'custom' ? palette.accent : palette.card,
                        color:
                          state.theme.presetId === 'custom' ? palette.accentText : palette.text,
                        border: `1px solid ${palette.border}`,
                      }}
                    >
                      {state.theme.presetId === 'custom' ? 'กำลังใช้งาน' : 'ใช้สีที่กำหนดเอง'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        { key: 'bg', label: 'สีพื้นหลัง' },
                        { key: 'card', label: 'สีการ์ด' },
                        { key: 'accent', label: 'สีปุ่ม/ไฮไลต์' },
                        { key: 'text', label: 'สีตัวอักษร' },
                      ] as const
                    ).map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer"
                        style={{
                          backgroundColor: palette.card,
                          border: `1px solid ${palette.border}`,
                        }}
                      >
                        <input
                          type="color"
                          value={state.theme.customColors[item.key]}
                          onChange={(e) => handleCustomColorChange(item.key, e.target.value)}
                          className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="block text-[11px] font-semibold truncate">
                            {item.label}
                          </span>
                          <span
                            className="block text-[10px] font-mono uppercase"
                            style={{ color: palette.textMuted }}
                          >
                            {state.theme.customColors[item.key]}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              {/* Change Admin PIN */}
              <section
                className="rounded-3xl p-4 sm:p-5 space-y-3"
                style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" style={{ color: palette.accent }} />
                  <h3 className="text-sm font-bold">เปลี่ยนรหัสผ่าน PIN หลังบ้าน</h3>
                </div>
                <form onSubmit={handleSavePin} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="รหัส PIN ใหม่"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="อย่างน้อย 4 ตัว เช่น 1234"
                    className="flex-1 min-h-[44px] px-3.5 py-2 rounded-2xl text-sm font-mono outline-none"
                    style={{
                      backgroundColor: palette.cardSubtle,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                    }}
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 rounded-2xl text-xs font-semibold whitespace-nowrap"
                    style={{ backgroundColor: palette.accent, color: palette.accentText }}
                  >
                    บันทึกรหัส PIN
                  </button>
                </form>
                {pinSavedMsg && (
                  <p className="text-xs font-medium" style={{ color: palette.accent }}>
                    {pinSavedMsg}
                  </p>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: เครดิตและเพลง */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* YouTube Mini Player Settings */}
              <section
                className="rounded-3xl p-4 sm:p-5 space-y-4"
                style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
              >
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" style={{ color: palette.accent }} />
                  <h3 className="text-sm font-bold">ตั้งค่าเครื่องเล่นเพลง YouTube</h3>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="admin-yt-url" className="text-xs font-semibold">
                      ลิงก์เพลงหรือเพลย์ลิสต์ YouTube
                    </label>
                    <span className="text-[11px] font-medium" style={{ color: palette.accent }}>
                      {parsedMusic.type === 'playlist'
                        ? 'ตรวจพบ: เพลย์ลิสต์ YouTube'
                        : parsedMusic.type === 'video'
                          ? 'ตรวจพบ: เพลงเดี่ยว YouTube'
                          : 'กรุณาวางลิงก์ YouTube ที่ถูกต้อง'}
                    </span>
                  </div>
                  <input
                    id="admin-yt-url"
                    type="url"
                    value={state.musicConfig.youtubeUrl}
                    onChange={(e) =>
                      onUpdateState(
                        (prev) => ({
                          ...prev,
                          musicConfig: { ...prev.musicConfig, youtubeUrl: e.target.value },
                        }),
                        ['musicConfig'],
                      )
                    }
                    placeholder="https://www.youtube.com/watch?v=... หรือ https://www.youtube.com/playlist?list=..."
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl text-sm outline-none"
                    style={{
                      backgroundColor: palette.cardSubtle,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="admin-music-title" className="block text-xs font-semibold mb-1.5">
                    ชื่อเพลง / ชื่อเพลย์ลิสต์ (แสดงในมินิเพลเยอร์)
                  </label>
                  <input
                    id="admin-music-title"
                    type="text"
                    value={state.musicConfig.title}
                    onChange={(e) =>
                      onUpdateState(
                        (prev) => ({
                          ...prev,
                          musicConfig: { ...prev.musicConfig, title: e.target.value },
                        }),
                        ['musicConfig'],
                      )
                    }
                    placeholder="เช่น Lofi Pastel Café · Chill Beats ♡"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl text-sm outline-none"
                    style={{
                      backgroundColor: palette.cardSubtle,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                    }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                    <SmartImage
                      src={state.musicConfig.coverUrl}
                      alt="รูปปกเครื่องเล่นเพลง"
                      palette={palette}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                        style={{ backgroundColor: palette.accent, color: palette.accentText }}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลดรูปปกเพลง</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleImageFileUpload(file, (url) =>
                              onUpdateState(
                                (prev) => ({
                                  ...prev,
                                  musicConfig: { ...prev.musicConfig, coverUrl: url },
                                }),
                                ['musicConfig'],
                              ),
                            );
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      aria-label="ลิงก์ URL รูปปกเพลง"
                      value={state.musicConfig.coverUrl}
                      onChange={(e) =>
                        onUpdateState(
                          (prev) => ({
                            ...prev,
                            musicConfig: { ...prev.musicConfig, coverUrl: e.target.value },
                          }),
                          ['musicConfig'],
                        )
                      }
                      placeholder="หรือวาง URL รูปปกเพลง"
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs outline-none"
                      style={{
                        backgroundColor: palette.cardSubtle,
                        color: palette.text,
                        border: `1px solid ${palette.border}`,
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* Credit Highlights Management */}
              <section
                className="rounded-3xl p-4 sm:p-5 space-y-4"
                style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" style={{ color: palette.accent }} />
                  <h3 className="text-sm font-bold">เพิ่ม / ลบรูปไฮไลต์เครดิตลูกค้า ♡</h3>
                </div>

                <div
                  className="rounded-2xl p-4 space-y-3"
                  style={{
                    backgroundColor: palette.cardSubtle,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="credit-caption-input" className="block text-xs font-semibold mb-1">
                        คำอธิบายสั้นๆ (Caption)
                      </label>
                      <input
                        id="credit-caption-input"
                        type="text"
                        value={creditCaptionInput}
                        onChange={(e) => setCreditCaptionInput(e.target.value)}
                        placeholder="เช่น สลิปโอนออเดอร์คุณมิ้นท์"
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs outline-none"
                        style={{
                          backgroundColor: palette.card,
                          color: palette.text,
                          border: `1px solid ${palette.border}`,
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="credit-url-input" className="block text-xs font-semibold mb-1">
                        ลิงก์ URL รูปเครดิต
                      </label>
                      <input
                        id="credit-url-input"
                        type="url"
                        value={creditUrlInput}
                        onChange={(e) => setCreditUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs outline-none"
                        style={{
                          backgroundColor: palette.card,
                          color: palette.text,
                          border: `1px solid ${palette.border}`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <label
                      className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      style={{ backgroundColor: palette.accent, color: palette.accentText }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isCompressing ? 'กำลังบีบอัด...' : 'อัปโหลดรูปจากเครื่อง'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleImageFileUpload(file, (url) =>
                            handleAddCredit(url, creditCaptionInput),
                          );
                          e.target.value = '';
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleAddCredit(creditUrlInput, creditCaptionInput)}
                      className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                      style={{
                        backgroundColor: palette.card,
                        color: palette.text,
                        border: `1px solid ${palette.border}`,
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มจากลิงก์ URL</span>
                    </button>
                  </div>
                </div>

                {/* Existing Credits Grid */}
                {state.creditHighlights.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: palette.textMuted }}>
                    ยังไม่มีรูปไฮไลต์เครดิตลูกค้า
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {state.creditHighlights.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl overflow-hidden flex flex-col"
                        style={{
                          backgroundColor: palette.cardSubtle,
                          border: `1px solid ${palette.border}`,
                        }}
                      >
                        <div className="aspect-[3/4] w-full overflow-hidden">
                          <SmartImage
                            src={item.imageUrl}
                            alt={item.caption}
                            palette={palette}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2.5 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium truncate">
                            {item.caption}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCredit(item.id)}
                            aria-label={`ลบเครดิต ${item.caption}`}
                            className="min-w-[34px] min-h-[34px] rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500/10 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 3: จัดการรีวิว */}
          {activeTab === 'reviews' && (
            <section
              className="rounded-3xl p-4 sm:p-5 space-y-4"
              style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">รายการรีวิวทั้งหมด ({sortedReviews.length})</h3>
                <span className="text-xs" style={{ color: palette.textMuted }}>
                  เรียงจากใหม่ไปเก่า
                </span>
              </div>

              {sortedReviews.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: palette.textMuted }}>
                  ยังไม่มีรีวิวลูกค้าในระบบ
                </p>
              ) : (
                <ul className="space-y-3">
                  {sortedReviews.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-2xl p-3.5 flex items-start justify-between gap-3"
                      style={{
                        backgroundColor: palette.cardSubtle,
                        border: `1px solid ${palette.border}`,
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{r.name}</span>
                          <span className="text-xs" style={{ color: palette.textMuted }}>
                            · {r.product} · {r.date} · {r.rating}★
                          </span>
                        </div>
                        <p className="text-xs mt-1.5 leading-relaxed">{r.comment}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteReview(r.id);
                          showToast('ok', `ลบรีวิวของ ${r.name} เรียบร้อยแล้ว`);
                        }}
                        aria-label={`ลบรีวิวของ ${r.name}`}
                        className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500/15 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* TAB 4: เชื่อมต่อ Google Sheets */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              <section
                className="rounded-3xl p-4 sm:p-5 space-y-4"
                style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
              >
                <h3 className="text-sm font-bold">เชื่อมต่อฐานข้อมูล Google Sheets (Apps Script)</h3>
                <p className="text-xs leading-relaxed" style={{ color: palette.textMuted }}>
                  รองรับการเก็บข้อมูลแบบ Key-Value ในแท็บ StoreSettings (ตัดแบ่งข้อความเกิน 45,000 ตัวอักษรไปคอลัมน์ถัดไปอัตโนมัติ) และเก็บรีวิวในแท็บ Reviews คอลัมน์ id, name, product, rating, comment, date
                </p>

                <div>
                  <label htmlFor="admin-sheet-url" className="block text-xs font-semibold mb-1.5">
                    Google Apps Script Web App URL (หรือกำหนดผ่าน VITE_GOOGLE_SHEET_URL)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      id="admin-sheet-url"
                      type="url"
                      value={sheetUrlInput}
                      onChange={(e) => setSheetUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-mono outline-none"
                      style={{
                        backgroundColor: palette.cardSubtle,
                        color: palette.text,
                        border: `1px solid ${palette.border}`,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onSaveSheetUrl(sheetUrlInput);
                        showToast(
                          'ok',
                          sheetUrlInput.trim()
                            ? 'บันทึก Web App URL เรียบร้อยแล้ว'
                            : 'รีเซ็ตกลับไปใช้ค่าเริ่มต้น VITE_GOOGLE_SHEET_URL แล้ว',
                        );
                      }}
                      className="min-h-[44px] px-5 rounded-2xl text-xs font-semibold whitespace-nowrap"
                      style={{ backgroundColor: palette.accent, color: palette.accentText }}
                    >
                      บันทึก URL
                    </button>
                  </div>
                  <p className="text-[11px] mt-1.5" style={{ color: palette.textMuted }}>
                    หากเว้นว่างแล้วกดบันทึก ระบบจะกลับไปใช้ค่าเริ่มต้นจาก Environment Variable (VITE_GOOGLE_SHEET_URL) อัตโนมัติ
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isSyncingSheets}
                    onClick={async () => {
                      setIsSyncingSheets(true);
                      try {
                        await onPullFromSheets(sheetUrlInput);
                        showToast('ok', 'ดึงข้อมูลล่าสุดจาก Google Sheets เรียบร้อยแล้ว');
                      } catch (err) {
                        showToast(
                          'err',
                          err instanceof Error ? err.message : 'ดึงข้อมูลจากชีตไม่สำเร็จ',
                        );
                      } finally {
                        setIsSyncingSheets(false);
                      }
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-2xl text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                    style={{
                      backgroundColor: palette.cardSubtle,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    {isSyncingSheets ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudDownload className="w-4 h-4" />
                    )}
                    <span>ดึงข้อมูลล่าสุดจากชีต</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSyncingSheets}
                    onClick={async () => {
                      setIsSyncingSheets(true);
                      try {
                        await onPushAllToSheets(sheetUrlInput);
                        showToast('ok', 'อัปโหลดข้อมูลทั้งหมดขึ้น Google Sheets เรียบร้อยแล้ว');
                      } catch (err) {
                        showToast(
                          'err',
                          err instanceof Error ? err.message : 'อัปโหลดข้อมูลขึ้นชีตไม่สำเร็จ',
                        );
                      } finally {
                        setIsSyncingSheets(false);
                      }
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-2xl text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: palette.accent, color: palette.accentText }}
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>อัปโหลดข้อมูลทั้งหมดขึ้นชีต</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCodeGs((prev) => !prev)}
                    className="min-h-[44px] px-4 py-2 rounded-2xl text-xs font-semibold inline-flex items-center gap-2"
                    style={{
                      backgroundColor: palette.cardSubtle,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    <Code2 className="w-4 h-4" />
                    <span>{showCodeGs ? 'ซ่อนโค้ด Code.gs' : 'ดู / คัดลอกโค้ด Code.gs'}</span>
                  </button>
                </div>
              </section>

              {showCodeGs && (
                <section
                  className="rounded-3xl p-4 sm:p-5 space-y-3"
                  style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold">โค้ด Google Apps Script (Code.gs)</h4>
                    <button
                      type="button"
                      onClick={handleCopyCodeGs}
                      className="min-h-[38px] px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                      style={{ backgroundColor: palette.accent, color: palette.accentText }}
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                    </button>
                  </div>
                  <pre
                    className="p-3.5 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed"
                    style={{
                      backgroundColor: palette.cardSubtle,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    {CODE_GS_TEMPLATE}
                  </pre>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
