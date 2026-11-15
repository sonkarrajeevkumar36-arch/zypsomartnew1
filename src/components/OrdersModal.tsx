import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Package,
  PackageOpen,
  RotateCcw,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  ShoppingBag,
  Sparkles,
  Truck,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  ShoppingBasket,
  Banknote,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GeoCoords, Order, Language } from '../types';
import { getTranslation } from '../translations';
import { OrderLiveMap } from './OrderLiveMap';

interface OrdersModalProps {
  isOpen: boolean;
  orders: Order[];
  lang: Language;
  onClose: () => void;
  onCancelOrder: (orderId: string) => void;
  onRequestReturn: (order: Order) => void;
  onReorder: (order: Order) => void;
  onSelectCategory?: (category: string) => void;
  isLoggedIn?: boolean;
  onOpenAuth?: () => void;
  storeLocation?: GeoCoords | null;
  isMapsEnabled?: boolean;
}

// Safely convert any Firestore timestamp, string, or number to milliseconds
export const getTimestampMs = (ts: any): number | null => {
  if (!ts) return null;
  if (typeof ts === 'number') return ts;
  if (typeof ts?.toMillis === 'function') return ts.toMillis();
  if (typeof ts?.toDate === 'function') return ts.toDate().getTime();
  if (ts.seconds) return ts.seconds * 1000;
  if (typeof ts === 'string') {
    const parsed = new Date(ts).getTime();
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// 5-minute auto-transition: When admin accepts order ('packaging' / 'preparing'),
// after 5 minutes (300,000ms), order automatically shows 'out for delivery' ('On The Way')
export const resolveEffectiveOrderStatus = (order: Order, nowMs: number): string => {
  const s = (order.status || 'placed').toLowerCase().trim();
  if (s === 'preparing' || s === 'packaging' || s === 'packing') {
    const acceptedMs =
      getTimestampMs(order.packagingAt) ||
      getTimestampMs(order.acceptedAt) ||
      getTimestampMs(order.updatedAt) ||
      getTimestampMs(order.createdAt);
    if (acceptedMs && nowMs - acceptedMs >= 5 * 60 * 1000) {
      return 'out for delivery';
    }
  }
  return s;
};


// High-fidelity delivery boy riding motorcycle toward customer
const DeliveryBoyMotorcycleBanner = ({ lang }: { lang: Language }) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-teal-50/90 to-emerald-50 border border-emerald-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs"
  >
    <div className="flex items-center gap-2.5 sm:gap-3">
      {/* Animated Delivery Boy SVG */}
      <div className="relative shrink-0 w-14 h-9 sm:w-16 sm:h-10">
        <motion.div
          animate={{ x: [-2, 3, -2], y: [0, -1.5, 0] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
          className="w-full h-full"
        >
          <svg viewBox="0 0 100 60" fill="none" className="w-full h-full drop-shadow-2xs">
            {/* Speed / wind lines behind rider */}
            <motion.path
              d="M6 32 H18 M2 38 H14 M8 44 H16"
              stroke="#059669"
              strokeWidth="2.2"
              strokeLinecap="round"
              animate={{ opacity: [0.2, 0.9, 0.2], x: [-3, 0, -3] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            />
            {/* Golden headlight beam */}
            <path d="M78 35 L98 28 L98 44 L78 38 Z" fill="url(#dbHeadlight)" opacity="0.55" />
            {/* Rear wheel */}
            <g>
              <circle cx="28" cy="45" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
              <circle cx="28" cy="45" r="7" fill="#E2E8F0" />
              <circle cx="28" cy="45" r="3" fill="#0F172A" />
              <line x1="28" y1="38" x2="28" y2="52" stroke="#64748B" strokeWidth="1.5" />
              <line x1="21" y1="45" x2="35" y2="45" stroke="#64748B" strokeWidth="1.5" />
            </g>
            {/* Front wheel */}
            <g>
              <circle cx="76" cy="45" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
              <circle cx="76" cy="45" r="7" fill="#E2E8F0" />
              <circle cx="76" cy="45" r="3" fill="#0F172A" />
              <line x1="76" y1="38" x2="76" y2="52" stroke="#64748B" strokeWidth="1.5" />
              <line x1="69" y1="45" x2="83" y2="45" stroke="#64748B" strokeWidth="1.5" />
            </g>
            {/* Motorcycle frame */}
            <path d="M28 45 L42 45 L54 36 L70 36 L76 45" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Exhaust pipe */}
            <path d="M38 45 L20 45" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
            {/* Engine */}
            <rect x="42" y="38" width="10" height="8" rx="2" fill="#334155" />
            {/* Handlebar fork */}
            <path d="M76 45 L66 22 L62 23" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            <circle cx="76" cy="35" r="3" fill="#FBBF24" />
            {/* Zypsomart green grocery box */}
            <rect x="19" y="17" width="17" height="17" rx="3.5" fill="#059669" stroke="#047857" strokeWidth="1.5" />
            <path d="M29 19 L26 26 H30 L27 32" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Rider torso leaning forward */}
            <path d="M38 32 C40 24 45 22 52 23 L62 33 L48 37 Z" fill="#047857" />
            <path d="M50 25 L64 24" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M48 34 L54 41 L50 44" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {/* Helmet */}
            <circle cx="53" cy="14" r="7.5" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
            <path d="M54 12 C57 12 59 14 59 16 H53 Z" fill="#0F172A" />
            <path d="M49 10 C51 9 55 9 56 10" stroke="#A7F3D0" strokeWidth="1.2" strokeLinecap="round" />
            <defs>
              <linearGradient id="dbHeadlight" x1="78" y1="36" x2="98" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE047" stopOpacity="0.85" />
                <stop offset="1" stopColor="#FDE047" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-[13px] font-black text-emerald-900 tracking-tight">
            {lang === 'hi' ? 'डिलीवरी पार्टनर रास्ते में है!' : 'Rider is on the way!'}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-600 text-white uppercase tracking-wider animate-pulse">
            LIVE
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold leading-tight mt-0.5">
          {lang === 'hi'
            ? 'डिलीवरी बॉय ताज़ा सामान लेकर तेज़ी से आपके पते पर पहुंच रहा है'
            : 'Delivery boy is speeding toward your address with fresh items'}
        </p>
      </div>
    </div>
  </motion.div>
);

export function OrdersModal({
  isOpen,
  orders,
  lang,
  onClose,
  onCancelOrder,
  onRequestReturn,
  onReorder,
  onSelectCategory,
  isLoggedIn,
  onOpenAuth,
  storeLocation = null,
  isMapsEnabled = false
}: OrdersModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('all');
  const [currentNow, setCurrentNow] = useState<number>(() => Date.now());
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [expandedMaps, setExpandedMaps] = useState<Record<string, boolean>>({});
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const toggleOrderItems = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const toggleOrderMap = (orderId: string, currentlyOpen: boolean) => {
    setExpandedMaps((prev) => ({
      ...prev,
      [orderId]: !currentlyOpen
    }));
  };

  // Live timer tick so the 5-minute "Packaging" -> "On The Way" transition triggers dynamically
  useEffect(() => {
    if (!isOpen) return;
    setCurrentNow(Date.now());
    const interval = setInterval(() => {
      setCurrentNow(Date.now());
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  const handleStartShopping = (categoryName?: string) => {
    if (categoryName && onSelectCategory) {
      onSelectCategory(categoryName);
    }
    onClose();
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const section = document.getElementById('products-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleCopyOrderId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard?.writeText(id);
    } catch {
      // ignore clipboard errors in restricted frames
    }
    setCopiedId(id);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || 'placed').toLowerCase().trim();
    switch (s) {
      case 'delivered':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black',
          dot: 'bg-emerald-600',
          text: t('statusText.delivered') || (lang === 'hi' ? 'डिलीवर हो गया' : 'Delivered')
        };
      case 'out for delivery':
      case 'out_for_delivery':
      case 'on the way':
      case 'on_the_way':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
          dot: 'bg-purple-500 animate-ping',
          text: t('statusText.out_for_delivery') || (lang === 'hi' ? 'रास्ते में है' : 'On The Way')
        };
      case 'packaging':
      case 'preparing':
      case 'packing':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
          dot: 'bg-amber-500 animate-pulse',
          text: t('statusText.packaging') || (lang === 'hi' ? 'पैकिंग हो रही है' : 'Packaging')
        };
      case 'accepted':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
          dot: 'bg-emerald-500 animate-pulse',
          text: t('statusText.accepted') || (lang === 'hi' ? 'स्वीकृत' : 'Accepted')
        };
      case 'placed':
      case 'pending':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500 animate-pulse',
          text: t('statusText.placed') || (lang === 'hi' ? 'ऑर्डर प्राप्त हुआ' : 'Order Placed')
        };
      case 'return_requested':
      case 'return_pending':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          dot: 'bg-orange-500',
          text: t('statusText.return_requested') || (lang === 'hi' ? 'वापसी अनुरोध' : 'Return Requested')
        };
      case 'return_approved':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          text: t('statusText.return_approved') || (lang === 'hi' ? 'वापसी स्वीकृत' : 'Return Approved')
        };
      case 'return_rejected':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          text: t('statusText.return_rejected') || (lang === 'hi' ? 'वापसी अस्वीकृत' : 'Return Rejected')
        };
      case 'returned':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          dot: 'bg-teal-500',
          text: t('statusText.returned') || (lang === 'hi' ? 'वापस किया गया' : 'Returned & Refunded')
        };
      case 'cancelled':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          text: t('statusText.cancelled') || (lang === 'hi' ? 'रद्द किया गया' : 'Cancelled')
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          text: status
        };
    }
  };

  // 5-Stage Stepper calculation (1: Placed, 2: Accepted, 3: Packaging, 4: On the Way, 5: Delivered)
  const getStepIndex = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'delivered') return 5;
    if (s === 'out for delivery' || s === 'out_for_delivery' || s === 'on the way' || s === 'on_the_way') return 4;
    if (s === 'packaging' || s === 'preparing' || s === 'packing') return 3;
    if (s === 'accepted') return 2;
    if (s === 'placed' || s === 'pending') return 1;
    return 0;
  };

  // Filter orders by tab
  const filteredOrders = orders.filter((order) => {
    if (filterTab === 'all') return true;
    const effectiveStatus = resolveEffectiveOrderStatus(order, currentNow);
    const isActive =
      effectiveStatus === 'placed' ||
      effectiveStatus === 'pending' ||
      effectiveStatus === 'accepted' ||
      effectiveStatus === 'packaging' ||
      effectiveStatus === 'preparing' ||
      effectiveStatus === 'packing' ||
      effectiveStatus === 'out for delivery' ||
      effectiveStatus === 'out_for_delivery' ||
      effectiveStatus === 'on the way' ||
      effectiveStatus === 'on_the_way';
    if (filterTab === 'active') return isActive;
    if (filterTab === 'completed') return !isActive;
    return true;
  });

  const popularCategories = [
    { name: 'Vegetables', label: lang === 'hi' ? 'सब्जियां' : 'Vegetables', icon: '🥬' },
    { name: 'Fruits', label: lang === 'hi' ? 'फल' : 'Fruits', icon: '🍎' },
    { name: 'Drinks', label: lang === 'hi' ? 'पेय पदार्थ' : 'Dairy & Drinks', icon: '🥛' },
    { name: 'Fast Food', label: lang === 'hi' ? 'स्नैक्स' : 'Snacks & Bites', icon: '🍿' }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[180] flex justify-center items-end sm:items-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 240 }}
          className="bg-white w-full max-w-xl md:max-w-2xl h-[92vh] sm:h-auto sm:max-h-[88vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col p-5 sm:p-6 overflow-hidden text-slate-900 border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shadow-2xs">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {t('myOrders')}
                  </h2>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black px-2 py-0.5 rounded-full text-[11px]">
                    {orders.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {lang === 'hi' ? 'लाइव ट्रैकिंग व पिछले ऑर्डर्स का विवरण' : 'Live tracking & purchase history'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs if there are multiple orders */}
          {orders.length > 1 && (
            <div className="flex items-center gap-1.5 pt-3 pb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {lang === 'hi' ? 'सभी ऑर्डर्स' : 'All'} ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('active')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'active'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {lang === 'hi' ? 'चालू' : 'Active'} (
                {
                  orders.filter((o) => {
                    const s = resolveEffectiveOrderStatus(o, currentNow);
                    return s === 'placed' || s === 'pending' || s === 'accepted' || s === 'packaging' || s === 'preparing' || s === 'packing' || s === 'out for delivery' || s === 'out_for_delivery' || s === 'on the way' || s === 'on_the_way';
                  }).length
                }
                )
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('completed')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'completed'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {lang === 'hi' ? 'पूर्ण / अन्य' : 'Completed'}
              </button>
            </div>
          )}

          {/* Orders Stream / Empty State */}
          <div className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar py-3.5 space-y-4">
            {orders.length === 0 ? (
              /* Professional, Beautifully Styled Empty State */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="min-h-full flex flex-col items-center justify-between text-center px-3 py-4 sm:py-6"
              >
                {/* Center Card */}
                <div className="w-full flex flex-col items-center max-w-sm my-auto">
                  {/* Decorative Icon Badge */}
                  <div className="relative mb-5">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-emerald-100 via-green-50 to-emerald-200/50 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-600/10 border border-emerald-100/90">
                      <PackageOpen className="w-10 h-10 sm:w-11 sm:h-11 text-emerald-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center shadow-md">
                      <Sparkles className="w-4 h-4 fill-current" />
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1.5 tracking-tight">
                    {lang === 'hi' ? 'कोई पिछला ऑर्डर नहीं मिला' : 'No Orders Placed Yet'}
                  </h3>

                  <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed max-w-xs mb-6">
                    {lang === 'hi'
                      ? 'आपकी रसोई के लिए ताज़ा फल, सब्जियां और दैनिक किराना सुपरफास्ट 15-30 मिनट में उपलब्ध हैं।'
                      : 'Looks like you have not placed any orders yet. Fresh farm groceries, dairy, and daily essentials are ready for 15-30 min delivery!'}
                  </p>

                  {/* Primary Call to Action */}
                  <button
                    type="button"
                    onClick={() => handleStartShopping()}
                    className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider mb-3"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'अभी खरीदारी शुरू करें' : 'Start Shopping Now'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {!isLoggedIn && onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline mb-5 cursor-pointer flex items-center gap-1"
                    >
                      <span>{lang === 'hi' ? 'पुराने ऑर्डर ट्रैक करने के लिए लॉगिन करें' : 'Have an account? Sign in to view past orders'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Quick Categories Bar */}
                  <div className="w-full pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                      {lang === 'hi' ? 'लोकप्रिय श्रेणियां' : 'Quick Category Picks'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {popularCategories.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => handleStartShopping(cat.name)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Professional Value Props Banner at bottom of empty state */}
                <div className="w-full grid grid-cols-3 gap-2 pt-6 mt-4 border-t border-slate-100 text-slate-600">
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                    <Zap className="w-4 h-4 text-emerald-600 mb-1" />
                    <span className="text-[10px] font-black text-slate-800 leading-tight">
                      {lang === 'hi' ? '15-30 मिनट' : '15-30 Mins'}
                    </span>
                    <span className="text-[8px] text-slate-400 font-medium">
                      {lang === 'hi' ? 'सुपरफास्ट' : 'Fast Delivery'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-green-600 mb-1" />
                    <span className="text-[10px] font-black text-slate-800 leading-tight">
                      {lang === 'hi' ? 'ताज़ा व सुरक्षित' : '100% Fresh'}
                    </span>
                    <span className="text-[8px] text-slate-400 font-medium">
                      {lang === 'hi' ? 'गुणवत्ता' : 'Quality Assured'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                    <RotateCcw className="w-4 h-4 text-blue-600 mb-1" />
                    <span className="text-[10px] font-black text-slate-800 leading-tight">
                      {lang === 'hi' ? 'सरल वापसी' : 'Easy Return'}
                    </span>
                    <span className="text-[8px] text-slate-400 font-medium">
                      {lang === 'hi' ? 'डोरस्टेप पिकअप' : 'Doorstep Pickup'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-xs font-semibold">
                  {lang === 'hi' ? 'इस फ़िल्टर में कोई ऑर्डर नहीं है' : 'No orders found in this category'}
                </p>
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className="mt-2 text-xs font-bold text-emerald-600 underline cursor-pointer"
                >
                  {lang === 'hi' ? 'सभी ऑर्डर्स देखें' : 'View all orders'}
                </button>
              </div>
            ) : (
              /* Enhanced Order Cards */
              filteredOrders.map((order) => {
                const effectiveStatus = resolveEffectiveOrderStatus(order, currentNow);
                const normStatus = effectiveStatus;
                const rawStatus = (order.status || 'placed').toLowerCase().trim();
                const badge = getStatusBadge(effectiveStatus);
                const step = getStepIndex(effectiveStatus);

                let formattedDate = 'Just now';
                const createdMs = getTimestampMs(order.createdAt);
                if (createdMs) {
                  formattedDate = new Date(createdMs).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                }

                const canCancel = rawStatus === 'placed' || rawStatus === 'pending';
                const canReturn = normStatus === 'delivered' || rawStatus === 'delivered';
                const isReturned = normStatus === 'returned' || rawStatus === 'returned';
                const isReturnRequested = normStatus === 'return_requested' || normStatus === 'return_pending' || rawStatus === 'return_requested' || rawStatus === 'return_pending';
                const isReturnApproved = normStatus === 'return_approved' || rawStatus === 'return_approved';
                const isReturnRejected = normStatus === 'return_rejected' || rawStatus === 'return_rejected';
                const canReorder =
                  normStatus === 'delivered' ||
                  normStatus === 'cancelled' ||
                  normStatus === 'returned' ||
                  isReturnApproved ||
                  isReturnRejected;

                const itemsList = order.items || [];
                const itemsCount = itemsList.reduce((sum, it) => sum + (Number(it?.qty) || 1), 0);
                const calculatedSubtotal = itemsList.reduce(
                  (sum, it) => sum + (Number(it?.price) || 0) * (Number(it?.qty) || 1),
                  0
                );
                const orderTotal = Number(order.total) || calculatedSubtotal;
                const calculatedDeliveryFee = Math.max(0, orderTotal - calculatedSubtotal);
                const isFreeDelivery = calculatedDeliveryFee <= 0 || calculatedSubtotal >= 100;
                const isExpanded = !!expandedOrders[order.id];
                const itemsSummaryText =
                  itemsList.length > 0
                    ? itemsList.map((it) => `${it.name || 'Item'} × ${it.qty || 1}`).join(', ')
                    : (lang === 'hi' ? 'कोई सामान नहीं' : 'No items');

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3.5"
                  >
                    {/* Top Row: Order ID, Date, Address & Status Badge */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-800 tracking-tight font-mono">
                            #{(order.id || '').slice(-6).toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyOrderId(order.id, e)}
                            title="Copy full Order ID"
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded cursor-pointer"
                          >
                            {copiedId === order.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                        {order.customerAddress && (
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{order.customerAddress}</span>
                            </div>
                            {isMapsEnabled && (order.deliveryLocation || order.customerAddress) && (
                              (() => {
                                const hasExplicitPref = order.id in expandedMaps;
                                const isMapOpen = hasExplicitPref
                                  ? !!expandedMaps[order.id]
                                  : step === 4 && !!order.deliveryLocation;
                                return (
                                  <button
                                    type="button"
                                    onClick={() => toggleOrderMap(order.id, isMapOpen)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                                  >
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span>
                                      {isMapOpen
                                        ? lang === 'hi'
                                          ? 'मैप छुपाएं'
                                          : 'Hide Map'
                                        : step === 4
                                        ? lang === 'hi'
                                          ? 'लाइव मैप देखें'
                                          : 'Track on Map'
                                        : lang === 'hi'
                                        ? 'मैप देखें'
                                        : 'View Map'}
                                    </span>
                                  </button>
                                );
                              })()
                            )}
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tight shadow-2xs shrink-0 ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{badge.text}</span>
                      </div>
                    </div>

                    {/* 5-Stage Live Order Tracking Stepper */}
                    {step > 0 && !isReturnRequested && !isReturnApproved && !isReturnRejected && !isReturned && (
                      <div
                        className={`rounded-2xl p-3 sm:p-4 border transition-all duration-300 space-y-3 ${
                          step === 5
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-slate-50/90 border-slate-100'
                        }`}
                      >
                        {/* Horizontal Stepper with Progress Line */}
                        <div className="relative pt-1.5 pb-1">
                          {/* Progress Line connecting all 5 steps */}
                          <div className="absolute top-[16px] sm:top-[17px] left-[10%] right-[10%] h-1 sm:h-1.5 bg-slate-200 rounded-full z-0 overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full transition-all duration-700 ease-out"
                              style={{
                                width: `${Math.min(100, Math.max(0, ((step - 1) / 4) * 100))}%`
                              }}
                            />
                          </div>

                          {/* 5 Stepper Stage Nodes */}
                          <div className="relative z-10 grid grid-cols-5 gap-1">
                            {[
                              { num: 1, title: lang === 'hi' ? 'प्राप्त' : 'Placed', full: 'Placed' },
                              { num: 2, title: lang === 'hi' ? 'स्वीकृत' : 'Accepted', full: 'Accepted' },
                              { num: 3, title: lang === 'hi' ? 'पैकिंग' : 'Packaging', full: 'Packaging' },
                              { num: 4, title: lang === 'hi' ? 'रास्ते में' : 'On the Way', full: 'On the Way' },
                              { num: 5, title: lang === 'hi' ? 'डिलीवर' : 'Delivered', full: 'Delivered' }
                            ].map((sNode) => {
                              const isDone = sNode.num < step;
                              const isCurrent = sNode.num === step;
                              const isUpcoming = sNode.num > step;

                              return (
                                <div key={sNode.num} className="relative flex flex-col items-center text-center">

                                  {/* Node Circle */}
                                  {isDone ? (
                                    // Completed steps with green circles and checkmarks
                                    <div
                                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-xs transition-transform duration-300"
                                      title={`${sNode.full} - Completed`}
                                    >
                                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[3]" />
                                    </div>
                                  ) : isCurrent ? (
                                    // Highlight the current status with a larger green circle
                                    <div
                                      className="relative w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 -mt-0.5 sm:-mt-1 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-md ring-4 ring-emerald-100 transition-all duration-300"
                                      title={`${sNode.full} - Current Status`}
                                    >
                                      {sNode.num === 5 ? (
                                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[3]" />
                                      ) : (
                                        <>
                                          <span className="w-2.5 h-2.5 rounded-full bg-white opacity-75 animate-ping absolute" />
                                          <span className="w-2.5 h-2.5 rounded-full bg-white relative shadow-xs" />
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    // Upcoming steps in light grey
                                    <div
                                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300"
                                      title={`${sNode.full} - Upcoming`}
                                    >
                                      <span>{sNode.num}</span>
                                    </div>
                                  )}

                                  {/* Stage Label */}
                                  <span
                                    className={`text-[9.5px] sm:text-[11px] mt-1.5 leading-tight tracking-tight transition-colors ${
                                      isCurrent
                                        ? 'font-black text-emerald-800'
                                        : isDone
                                        ? 'font-bold text-emerald-700'
                                        : 'font-medium text-slate-400'
                                    }`}
                                  >
                                    {sNode.title}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Stage Details Context Card & Delivery Boy Animation */}
                        {/* 1. Placed */}
                        {step === 1 && (
                          <div className="flex items-center gap-2 text-[10.5px] sm:text-xs text-blue-800 font-bold bg-blue-50/80 p-2.5 rounded-xl border border-blue-100">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                            <span>
                              {lang === 'hi'
                                ? 'ऑर्डर प्राप्त हुआ: स्टोर को आपका ऑर्डर मिल गया है'
                                : 'Order Placed: Store is receiving your order'}
                            </span>
                          </div>
                        )}

                        {/* 2. Accepted */}
                        {step === 2 && (
                          <div className="flex items-center gap-2 text-[10.5px] sm:text-xs text-emerald-800 font-bold bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/80">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>
                              {lang === 'hi'
                                ? 'ऑर्डर स्वीकृत: स्टोर ने आपका ऑर्डर कन्फर्म कर लिया है'
                                : 'Order Accepted: Store has confirmed and verified your order'}
                            </span>
                          </div>
                        )}

                        {/* 3. Packaging */}
                        {step === 3 && (
                          <div className="flex items-center gap-2 text-[10.5px] sm:text-xs text-amber-800 font-bold bg-amber-50/90 p-2.5 rounded-xl border border-amber-200/80">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span>
                              {lang === 'hi'
                                ? 'पैकिंग जारी है: आपका ताज़ा सामान सुरक्षित रूप से पैक किया जा रहा है'
                                : 'Packaging in progress: Fresh items are being packed securely'}
                            </span>
                          </div>
                        )}

                        {/* 4. On The Way: Small attractive delivery boy riding motorcycle toward customer */}
                        {step === 4 && <DeliveryBoyMotorcycleBanner lang={lang} />}

                        {/* 5. Delivered: Green success celebration banner, rider hidden */}
                        {step === 5 && (
                          <div className="flex items-center gap-2 text-[10.5px] sm:text-xs text-emerald-800 font-black bg-emerald-100/90 p-2.5 rounded-xl border border-emerald-300 shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              {lang === 'hi'
                                ? 'ऑर्डर सफलतापूर्वक डिलीवर हो गया! जिप्सोमार्ट से खरीदारी के लिए धन्यवाद।'
                                : 'Order Delivered: Thank you for shopping with Zypsomart! Enjoy your fresh items.'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Collapsible Live Delivery Route & Pin Map */}
                    {isMapsEnabled &&
                      (order.deliveryLocation || order.customerAddress) &&
                      (order.id in expandedMaps
                        ? !!expandedMaps[order.id]
                        : step === 4 && !!order.deliveryLocation) && (
                        <OrderLiveMap
                          customerAddress={order.customerAddress || ''}
                          deliveryLocation={order.deliveryLocation}
                          storeLocation={storeLocation}
                          lang={lang}
                          isOnTheWay={step === 4}
                        />
                      )}

                    {/* Compact Collapsible "Items Ordered" Section */}
                    <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 overflow-hidden transition-all shadow-2xs">
                      {/* Compact Header / Toggle Bar */}
                      <div
                        onClick={() => toggleOrderItems(order.id)}
                        className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleOrderItems(order.id);
                          }
                        }}
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-emerald-600 shadow-2xs">
                            <ShoppingBasket className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                                {lang === 'hi' ? 'ऑर्डर किए गए सामान' : 'Items Ordered'} ({itemsCount})
                              </span>
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md font-mono">
                                ₹{calculatedSubtotal}
                              </span>
                            </div>
                            {/* Short summary text */}
                            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[190px] sm:max-w-xs md:max-w-md mt-0.5">
                              {itemsSummaryText}
                            </p>
                          </div>
                        </div>

                        {/* "View Items" / "Hide Items" toggle button with dropdown arrow */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrderItems(order.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
                          title={isExpanded ? 'Collapse items' : 'Expand items'}
                        >
                          <span>
                            {isExpanded
                              ? (lang === 'hi' ? 'सामान छिपाएं' : 'Hide Items')
                              : (lang === 'hi' ? 'सामान देखें' : 'View Items')}
                          </span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </motion.div>
                        </button>
                      </div>

                      {/* Collapsible Ordered Products List & Bill Breakdown */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key="order-items-expansion"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 sm:px-4 pb-3.5 pt-2 border-t border-slate-200/70 space-y-3 bg-white/60">
                              {/* Individual Items List */}
                              <div className="space-y-2.5 divide-y divide-slate-100/90">
                                {itemsList.map((item, idx) => {
                                  const itemQty = Number(item?.qty) || 1;
                                  const itemPrice = Number(item?.price) || 0;
                                  const lineTotal = itemPrice * itemQty;

                                  return (
                                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                                      {/* Left: Thumbnail & Item Info */}
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                          {item?.imageUrl ? (
                                            <img
                                              src={item.imageUrl}
                                              alt={item.name || 'Item'}
                                              className="w-full h-full object-contain"
                                              onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                              }}
                                            />
                                          ) : (
                                            <Package className="w-5 h-5 text-slate-300" />
                                          )}
                                        </div>

                                        <div className="min-w-0">
                                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                            {item?.name || 'Item'}
                                          </h4>
                                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5 flex-wrap">
                                            {item?.unit && (
                                              <span className="text-slate-500">{item.unit}</span>
                                            )}
                                            {item?.unit && <span className="text-slate-300">•</span>}
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[10px] font-black">
                                              Qty: {itemQty}
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-500 font-mono text-[11px]">₹{itemPrice}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right: Line Total */}
                                      <div className="text-right shrink-0">
                                        <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                                          ₹{lineTotal}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Bill Breakdown (Item Total & Delivery Fee) */}
                              <div className="pt-2.5 border-t border-slate-200/80 space-y-1.5 text-xs">
                                <div className="flex justify-between items-center text-slate-600 text-[11px] font-medium">
                                  <span>{lang === 'hi' ? 'सामान का कुल मूल्य' : 'Item Total'}</span>
                                  <span className="font-mono font-bold text-slate-800">₹{calculatedSubtotal}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 text-[11px] font-medium">
                                  <span className="flex items-center gap-1.5">
                                    <span>{lang === 'hi' ? 'डिलीवरी शुल्क' : 'Delivery Fee'}</span>
                                    {isFreeDelivery && (
                                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded tracking-wide">
                                        {lang === 'hi' ? 'मुफ़्त' : 'FREE'}
                                      </span>
                                    )}
                                  </span>
                                  {isFreeDelivery ? (
                                    <div className="flex items-center gap-1">
                                      <span className="line-through text-slate-400 font-mono text-[10px]">₹30</span>
                                      <span className="font-mono font-black text-emerald-600">₹0</span>
                                    </div>
                                  ) : (
                                    <span className="font-mono font-bold text-slate-800">₹{calculatedDeliveryFee}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Return Info Box if Return was requested, approved, rejected, or completed */}
                    {(isReturnRequested || isReturnApproved || isReturnRejected || isReturned) && (
                      <div
                        className={`p-3 rounded-xl text-xs space-y-1.5 ${
                          isReturnApproved
                            ? 'bg-emerald-50/95 border border-emerald-200 text-emerald-950'
                            : isReturnRejected
                            ? 'bg-rose-50/95 border border-rose-200 text-rose-950'
                            : 'bg-amber-50/95 border border-amber-200 text-amber-950'
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider ${
                            isReturnApproved
                              ? 'text-emerald-800'
                              : isReturnRejected
                              ? 'text-rose-800'
                              : 'text-amber-800'
                          }`}
                        >
                          {isReturnApproved ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isReturnRejected ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>
                            {isReturnApproved
                              ? (lang === 'hi' ? 'वापसी अनुरोध स्वीकृत' : 'Return Request Approved')
                              : isReturnRejected
                              ? (lang === 'hi' ? 'वापसी अनुरोध अस्वीकृत' : 'Return Request Rejected')
                              : isReturned
                              ? (lang === 'hi' ? 'वापसी पूर्ण' : 'Return Completed')
                              : (lang === 'hi' ? 'वापसी अनुरोध विचाराधीन' : 'Return Request In Review')}
                          </span>
                        </div>

                        {isReturnApproved && (
                          <p className="text-[11px] text-emerald-800 font-medium">
                            {lang === 'hi'
                              ? 'आपकी वापसी स्वीकार कर ली गई है। डिलीवरी पार्टनर जल्द ही सामान लेने पहुंचेगा और रिफंड प्रोसेस होगा।'
                              : 'Your return has been approved. A pickup partner will collect the items soon and initiate your refund.'}
                          </p>
                        )}
                        {isReturnRejected && (
                          <p className="text-[11px] text-rose-800 font-medium">
                            {lang === 'hi'
                              ? 'दुकानदार द्वारा यह वापसी अनुरोध समीक्षा के बाद अस्वीकार कर दिया गया है।'
                              : 'This return request was reviewed and could not be approved.'}
                          </p>
                        )}
                        {isReturnRequested && (
                          <p className="text-[11px] text-amber-800 font-medium">
                            {lang === 'hi'
                              ? 'आपका वापसी अनुरोध स्टोर टीम द्वारा समीक्षा के अधीन है।'
                              : 'Your return request is currently under review by our store team.'}
                          </p>
                        )}

                        {order.returnReason && (
                          <p className="text-[11px] font-semibold text-slate-800 pt-0.5">
                            <span className="font-bold opacity-75">{lang === 'hi' ? 'कारण:' : 'Reason:'}</span> {order.returnReason}
                          </p>
                        )}
                        {order.returnNotes && (
                          <p className="text-[10px] text-slate-600 italic">
                            "{order.returnNotes}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bottom Row: Subtotal, Grand Total + Payment Badge & Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Left: Subtotal, Grand Total & Payment Method Pill */}
                      <div className="flex items-center justify-between sm:justify-start sm:gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          {/* Subtotal */}
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              {lang === 'hi' ? 'रकम' : 'Subtotal'}
                            </span>
                            <span className="font-bold text-sm text-slate-700 font-mono">
                              ₹{calculatedSubtotal}
                            </span>
                          </div>

                          {/* Subtle Divider */}
                          <div className="h-6 w-px bg-slate-200" />

                          {/* Grand Total */}
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              {t('grandTotal')}
                            </span>
                            <span className="font-black text-lg sm:text-xl text-slate-950 font-mono tracking-tight leading-tight">
                              ₹{orderTotal}
                            </span>
                          </div>
                        </div>

                        {/* Payment Method Badge */}
                        <div>
                          {order.paymentMethod === 'online' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                {order.paymentStatus === 'paid'
                                  ? (lang === 'hi' ? 'ऑनलाइन भुगतान' : 'Paid Online')
                                  : (lang === 'hi' ? 'भुगतान प्रतीक्षारत' : 'Payment Pending')}
                              </span>
                            </span>
                          ) : order.paymentMethod === 'upi_qr' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-2xs">
                              <Zap className="w-3.5 h-3.5 text-indigo-600" />
                              <span>
                                {order.paymentStatus === 'paid'
                                  ? (lang === 'hi' ? 'UPI सत्यापित' : 'UPI Verified')
                                  : (lang === 'hi' ? 'UPI सत्यापन जारी' : 'UPI Verification')}
                                {order.upiTransactionId ? ` (${order.upiTransactionId.slice(-4)})` : ''}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs">
                              <Banknote className="w-3.5 h-3.5 text-amber-700" />
                              <span>{lang === 'hi' ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Action Buttons (Cancel, Return, Reorder) */}
                      <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
                        {/* Cancel Order */}
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => onCancelOrder(order.id)}
                            className="text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-tight shadow-2xs"
                          >
                            {t('cancel')}
                          </button>
                        )}

                        {/* Return Order */}
                        {canReturn && (
                          <button
                            type="button"
                            onClick={() => onRequestReturn(order)}
                            className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-tight shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                            <span>{t('return')}</span>
                          </button>
                        )}

                        {/* Reorder Button - High Visibility Primary Quick-Commerce CTA */}
                        {canReorder && (
                          <button
                            type="button"
                            onClick={() => onReorder(order)}
                            className="text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 uppercase tracking-tight shadow-sm hover:shadow-md"
                          >
                            <ShoppingBag className="w-4 h-4 text-emerald-100" />
                            <span>{t('reorder')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
