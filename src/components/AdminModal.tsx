import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Package,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  DollarSign,
  Store,
  Phone,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Key,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Zap,
  Smartphone,
  ExternalLink,
  Sparkles,
  Flame,
  Calendar,
  ArrowUp,
  ArrowDown,
  Truck
} from 'lucide-react';
import { doc, updateDoc, setDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth, getFriendlyErrorMessage } from '../firebase';
import { Order, Product, Category, Language, FestivalBanner } from '../types';
import { DEFAULT_FESTIVAL_BANNERS } from '../utils/festivalScheduler';
import {
  saveBannerToFirestore,
  deleteBannerFromFirestore,
  updateBannerImageInFirestore,
  seedBannersCollectionToFirestore
} from '../utils/bannerService';
import storeUpiQrImage from '../assets/images/regenerated_image_1793187511318.jpg';

interface AdminModalProps {
  isOpen: boolean;
  orders: Order[];
  products: Product[];
  categories: Category[];
  isShopClosed: boolean;
  supportNumber: string;
  appLogoUrl: string;
  festivalBanners?: FestivalBanner[];
  onSaveFestivalBanners?: (banners: FestivalBanner[]) => Promise<void>;
  upiId?: string;
  upiPayeeName?: string;
  enableCod?: boolean;
  enableOnline?: boolean;
  enableUpiQr?: boolean;
  lang: Language;
  onClose: () => void;
  onRefreshProducts: () => void;
  onShowSuccess: (title: string, msg: string) => void;
  onShowError: (title: string, msg: string) => void;
  onPreviewDiwaliAnimation?: () => void;
}

export function AdminModal({
  isOpen,
  orders,
  products,
  categories,
  isShopClosed,
  supportNumber,
  appLogoUrl,
  festivalBanners,
  onSaveFestivalBanners,
  upiId = '8090315246@upi',
  upiPayeeName = 'Zypsomart',
  enableCod = true,
  enableOnline = true,
  enableUpiQr = true,
  lang,
  onClose,
  onRefreshProducts,
  onShowSuccess,
  onShowError,
  onPreviewDiwaliAnimation
}: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'banners' | 'payments' | 'analytics' | 'settings'>('orders');

  // Category creation state
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('📦');

  // Product edit/create state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState<{
    name: string;
    price: string;
    unit: string;
    imageUrl: string;
    category: string;
    description: string;
    status: 'Available' | 'Out of Stock' | 'Unavailable';
  }>({
    name: '',
    price: '',
    unit: 'kg',
    imageUrl: '',
    category: '',
    description: '',
    status: 'Available'
  });

  // Settings state
  const [logoInput, setLogoInput] = useState<string>(appLogoUrl || '');
  const [supportInput, setSupportInput] = useState<string>(supportNumber || '8090315246');

  // Payment Gateway System state
  const [upiIdInput, setUpiIdInput] = useState<string>(upiId || 'sonkarrajeevkumar36@okhdfcbank');
  const [upiPayeeInput, setUpiPayeeInput] = useState<string>(upiPayeeName || 'Zypsomart');
  const [codEnabled, setCodEnabled] = useState<boolean>(enableCod !== false);
  const [onlineEnabled, setOnlineEnabled] = useState<boolean>(enableOnline !== false);
  const [upiQrEnabled, setUpiQrEnabled] = useState<boolean>(enableUpiQr !== false);
  const [isSavingPayments, setIsSavingPayments] = useState<boolean>(false);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);

  // Operation states
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);
  const [confirmDeleteProdId, setConfirmDeleteProdId] = useState<string | null>(null);
  const currentAdminEmail = (auth.currentUser?.email || '').toLowerCase().trim();
  const [adminAuthEmail, setAdminAuthEmail] = useState<string>(currentAdminEmail || 'sonkarrajeevkumar36@gmail.com');
  const [adminAuthPassword, setAdminAuthPassword] = useState<string>('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState<boolean>(false);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);

  // Festival Banners state
  const [adminBanners, setAdminBanners] = useState<FestivalBanner[]>(() => {
    if (festivalBanners && festivalBanners.length > 0) return festivalBanners;
    return DEFAULT_FESTIVAL_BANNERS;
  });
  const [isSavingBanners, setIsSavingBanners] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<FestivalBanner | null>(null);
  const [showBannerModal, setShowBannerModal] = useState<boolean>(false);
  const [bannerForm, setBannerForm] = useState<Partial<FestivalBanner>>({
    festivalName: '',
    headline: 'Celebrate Every Festival with Zypsomart!',
    subtitle: 'Bumper Offers – Order Now!',
    imageUrl: '/diwali_festival_banner.jpg',
    badgeText: 'Diwali Special',
    ctaText: 'Shop Bumper Offers',
    categoryTarget: 'Sweets',
    startDate: '2026-10-25',
    endDate: '2026-11-15',
    isActive: true,
    priority: 10,
    accentColor: '#f59e0b'
  });

  // Dedicated Quick Change Image State
  const [changeImageBanner, setChangeImageBanner] = useState<FestivalBanner | null>(null);
  const [quickImageUrl, setQuickImageUrl] = useState<string>('');
  const [isUpdatingImage, setIsUpdatingImage] = useState<boolean>(false);

  // Sync if prop updates
  React.useEffect(() => {
    if (festivalBanners && festivalBanners.length > 0) {
      setAdminBanners(festivalBanners);
    }
  }, [festivalBanners]);

  const saveBannersList = async (updatedList: FestivalBanner[]) => {
    setIsSavingBanners(true);
    setAdminBanners(updatedList);
    try {
      if (onSaveFestivalBanners) {
        await onSaveFestivalBanners(updatedList);
      } else {
        for (const b of updatedList) {
          await saveBannerToFirestore(b);
        }
        await setDoc(
          doc(db, 'shopControl', 'status'),
          {
            festivalBanners: updatedList,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      }
      onShowSuccess('Festival Banners Updated', 'Festival banners saved and live in Firestore "banners" collection.');
    } catch (err: any) {
      console.error('[Save Festival Banners Error]:', err);
      onShowError('Save Failed', getFriendlyErrorMessage(err));
    } finally {
      setIsSavingBanners(false);
    }
  };

  const handleToggleBannerActive = async (bannerId: string) => {
    const nextList = adminBanners.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b));
    await saveBannersList(nextList);
  };

  const handleAdjustPriority = async (bannerId: string, delta: number) => {
    const nextList = adminBanners.map((b) =>
      b.id === bannerId ? { ...b, priority: Math.max(1, (b.priority || 1) + delta) } : b
    );
    await saveBannersList(nextList);
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      await deleteBannerFromFirestore(bannerId);
    } catch (err) {
      console.warn('Failed to delete from Firestore banners collection:', err);
    }
    const nextList = adminBanners.filter((b) => b.id !== bannerId);
    await saveBannersList(nextList);
  };

  const handleOpenQuickChangeImage = (banner: FestivalBanner) => {
    setChangeImageBanner(banner);
    setQuickImageUrl(banner.imageUrl || '');
  };

  const handleSaveQuickImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeImageBanner || !quickImageUrl.trim()) return;
    setIsUpdatingImage(true);
    try {
      const finalUrl = quickImageUrl.trim();
      await updateBannerImageInFirestore(changeImageBanner.id, finalUrl);
      const nextList = adminBanners.map((b) =>
        b.id === changeImageBanner.id ? { ...b, imageUrl: finalUrl } : b
      );
      await saveBannersList(nextList);
      onShowSuccess('Banner Image Updated', `Banner image for "${changeImageBanner.festivalName}" successfully updated in Firestore collection "banners"!`);
      setChangeImageBanner(null);
    } catch (err: any) {
      onShowError('Image Update Failed', getFriendlyErrorMessage(err));
    } finally {
      setIsUpdatingImage(false);
    }
  };

  const handleSyncAllBannersToFirestore = async () => {
    setIsSavingBanners(true);
    try {
      const count = await seedBannersCollectionToFirestore(adminBanners);
      onShowSuccess('Firebase Synced', `Successfully synced ${count} banners to Firebase Firestore collection "banners". You can view, add, or edit them anytime in Firebase Console!`);
    } catch (err: any) {
      onShowError('Sync Failed', getFriendlyErrorMessage(err));
    } finally {
      setIsSavingBanners(false);
    }
  };

  const handleActivateDiwaliBanner = async () => {
    let exists = false;
    const maxPriority = Math.max(...adminBanners.map((b) => b.priority || 1), 10);
    const nextList = adminBanners.map((b) => {
      if (b.id === 'diwali_special' || b.festivalName.toLowerCase().includes('diwali')) {
        exists = true;
        return {
          ...b,
          isActive: true,
          priority: maxPriority + 10,
          imageUrl: b.imageUrl || '/diwali_festival_banner.jpg',
          headline: b.headline || 'Celebrate Every Festival with Zypsomart!',
          subtitle: b.subtitle || 'Bumper Offers – Order Now!'
        };
      }
      return b;
    });

    if (!exists) {
      const diwaliDefault: FestivalBanner = {
        id: 'diwali_special',
        festivalName: 'Diwali',
        headline: 'Celebrate Every Festival with Zypsomart!',
        subtitle: 'Bumper Offers – Order Now!',
        imageUrl: '/diwali_festival_banner.jpg',
        badgeText: 'Diwali Special 🪔',
        ctaText: 'Shop Festive Deals',
        categoryTarget: 'Sweets',
        startDate: '2026-10-25',
        endDate: '2026-11-15',
        isActive: true,
        priority: 100,
        accentColor: '#f59e0b'
      };
      nextList.unshift(diwaliDefault);
    }

    await saveBannersList(nextList);
    onShowSuccess('Diwali Special Live!', 'Diwali Special Banner is now active with highest priority!');
  };

  const handleResetBannersToDefault = async () => {
    await saveBannersList(DEFAULT_FESTIVAL_BANNERS);
    onShowSuccess('Reset Complete', 'Festival calendar reset to standard Indian festival dates.');
  };

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      festivalName: '',
      headline: 'Celebrate Every Festival with Zypsomart!',
      subtitle: 'Bumper Offers – Order Now!',
      imageUrl: '/diwali_festival_banner.jpg',
      badgeText: 'Festive Special',
      ctaText: 'Shop Bumper Offers',
      categoryTarget: 'Sweets',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      isActive: true,
      priority: 10,
      accentColor: '#f59e0b'
    });
    setShowBannerModal(true);
  };

  const handleOpenEditBanner = (b: FestivalBanner) => {
    setEditingBanner(b);
    setBannerForm({ ...b });
    setShowBannerModal(true);
  };

  const handleSaveBannerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.festivalName?.trim() || !bannerForm.imageUrl?.trim()) {
      onShowError('Missing Fields', 'Please provide a festival name and banner image URL.');
      return;
    }

    const payload: FestivalBanner = {
      id: editingBanner?.id || `banner_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      festivalName: bannerForm.festivalName.trim(),
      headline: bannerForm.headline?.trim() || 'Celebrate Every Festival with Zypsomart!',
      subtitle: bannerForm.subtitle?.trim() || 'Bumper Offers – Order Now!',
      imageUrl: bannerForm.imageUrl.trim(),
      badgeText: bannerForm.badgeText?.trim() || 'Festive Dhamaka',
      ctaText: bannerForm.ctaText?.trim() || 'Shop Bumper Offers',
      categoryTarget: bannerForm.categoryTarget?.trim() || 'All',
      startDate: bannerForm.startDate || new Date().toISOString().slice(0, 10),
      endDate: bannerForm.endDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      isActive: bannerForm.isActive !== false,
      priority: Number(bannerForm.priority) || 5,
      accentColor: bannerForm.accentColor || '#f59e0b'
    };

    let nextList: FestivalBanner[];
    if (editingBanner) {
      nextList = adminBanners.map((b) => (b.id === editingBanner.id ? payload : b));
    } else {
      nextList = [payload, ...adminBanners];
    }

    setShowBannerModal(false);
    await saveBannersList(nextList);
  };

  if (!isOpen) return null;

  const isDirectStoreAdmin =
    currentAdminEmail === 'sonkarrajeevkumar36@gmail.com' ||
    currentAdminEmail === 'rajeevkumar59040@gmail.com';

  const handleAdminDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAuthEmail || !adminAuthPassword) {
      onShowError('Missing Credentials', 'Please enter admin password.');
      return;
    }
    setIsAdminLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, adminAuthEmail.trim(), adminAuthPassword);
      onShowSuccess('Admin Authenticated', `Successfully signed in as ${adminAuthEmail.trim()}`);
      setAdminAuthPassword('');
    } catch (err: any) {
      console.error('[Admin Direct Auth Error]:', err);
      onShowError('Login Failed', getFriendlyErrorMessage(err));
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (updatingOrderId) return; // Prevent double-clicks or concurrent writes
    setUpdatingOrderId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updatePayload: Record<string, any> = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      if (newStatus === 'preparing') {
        updatePayload.acceptedAt = serverTimestamp();
      } else if (newStatus === 'return_approved') {
        updatePayload.returnApprovedAt = serverTimestamp();
      } else if (newStatus === 'return_rejected') {
        updatePayload.returnRejectedAt = serverTimestamp();
      } else if (newStatus === 'delivered') {
        updatePayload.deliveredAt = serverTimestamp();
      }

      await updateDoc(orderRef, updatePayload);

      let successLabel = newStatus.toUpperCase();
      if (newStatus === 'preparing') successLabel = 'PACKING (ACCEPTED)';
      if (newStatus === 'out for delivery') successLabel = 'ON THE WAY';
      if (newStatus === 'delivered') successLabel = 'DELIVERED';
      if (newStatus === 'return_approved') successLabel = 'RETURN APPROVED';
      if (newStatus === 'return_rejected') successLabel = 'RETURN REJECTED';

      onShowSuccess('Status Updated', `Order #${orderId.slice(-6).toUpperCase()} is now ${successLabel}`);
    } catch (err: any) {
      console.error('[Admin Order Update Error]:', err);
      onShowError('Update Failed', getFriendlyErrorMessage(err));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingCategory) return;
    if (!newCatName.trim()) return;

    const normName = newCatName.trim().toLowerCase();
    if (categories.some((c) => (c.normalizedName || (c?.name || '').toLowerCase()) === normName)) {
      onShowError('Duplicate Category', 'A category with this name already exists.');
      return;
    }

    setIsCreatingCategory(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCatName.trim(),
        normalizedName: normName,
        icon: newCatIcon || '📦',
        createdAt: serverTimestamp()
      });
      setNewCatName('');
      setNewCatIcon('📦');
      onShowSuccess('Category Added', 'New category created successfully.');
      onRefreshProducts();
    } catch (err: any) {
      onShowError('Failed to Create Category', getFriendlyErrorMessage(err));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const executeDeleteCategory = async (catId: string) => {
    try {
      await deleteDoc(doc(db, 'categories', catId));
      onShowSuccess('Category Deleted', 'Category removed successfully.');
      onRefreshProducts();
    } catch (err: any) {
      onShowError('Delete Failed', getFriendlyErrorMessage(err));
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProduct) return;
    const current = editingProduct || prodForm;

    if (!current.name || !current.price || !current.category) {
      onShowError('Missing Fields', 'Please fill in product name, price, and category.');
      return;
    }

    const priceNum = Number(current.price);
    if (isNaN(priceNum) || priceNum < 0) {
      onShowError('Invalid Price', 'Please enter a valid price amount.');
      return;
    }

    setIsSavingProduct(true);
    try {
      const productPayload = {
        name: current.name.trim(),
        price: priceNum,
        unit: current.unit || 'kg',
        imageUrl: current.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
        category: current.category,
        normalizedCategory: current.category.trim().toLowerCase(),
        status: current.status || 'Available',
        description: (current.description || '').trim(),
        updatedAt: serverTimestamp()
      };

      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productPayload);
        onShowSuccess('Product Updated', 'Product details saved successfully.');
        setEditingProduct(null);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productPayload,
          createdAt: serverTimestamp()
        });
        onShowSuccess('Product Added', 'New item added to grocery inventory.');
      }

      setProdForm({
        name: '',
        price: '',
        unit: 'kg',
        imageUrl: '',
        category: '',
        description: '',
        status: 'Available'
      });
      onRefreshProducts();
    } catch (err: any) {
      onShowError('Failed to Save Product', getFriendlyErrorMessage(err));
    } finally {
      setIsSavingProduct(false);
    }
  };

  const executeDeleteProduct = async (prodId: string) => {
    try {
      await deleteDoc(doc(db, 'products', prodId));
      onShowSuccess('Product Deleted', 'Item removed from inventory.');
      onRefreshProducts();
    } catch (err: any) {
      onShowError('Delete Failed', getFriendlyErrorMessage(err));
    }
  };

  const handleToggleShopStatus = async () => {
    try {
      await setDoc(doc(db, 'shopControl', 'status'), {
        isClosed: !isShopClosed,
        updatedAt: serverTimestamp()
      }, { merge: true });
      onShowSuccess('Shop Status Changed', isShopClosed ? 'Shop is now OPEN for customer orders.' : 'Shop is now CLOSED for restocking.');
    } catch (err: any) {
      onShowError('Status Update Failed', getFriendlyErrorMessage(err));
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'shopControl', 'status'), {
        appLogoUrl: logoInput.trim(),
        supportNumber: supportInput.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      onShowSuccess('Settings Saved', 'Logo URL and support number have been updated.');
    } catch (err: any) {
      onShowError('Settings Error', getFriendlyErrorMessage(err));
    }
  };

  const handleSavePaymentSettings = async () => {
    setIsSavingPayments(true);
    try {
      await setDoc(doc(db, 'shopControl', 'status'), {
        upiId: upiIdInput.trim() || '8090315246@upi',
        upiPayeeName: upiPayeeInput.trim() || 'Zypsomart',
        enableCod: codEnabled,
        enableOnline: false,
        enableUpiQr: upiQrEnabled,
        updatedAt: serverTimestamp()
      }, { merge: true });
      onShowSuccess('Payment Settings Saved', 'Store payment settings updated successfully.');
    } catch (err: any) {
      console.error('[Save Payment Settings Error]:', err);
      onShowError('Settings Failed', getFriendlyErrorMessage(err));
    } finally {
      setIsSavingPayments(false);
    }
  };

  const handleMarkPaymentPaid = async (orderId: string) => {
    if (updatingOrderId) return;
    setUpdatingOrderId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'paid',
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onShowSuccess('Payment Verified', `Order #${orderId.slice(-6).toUpperCase()} is verified and marked as PAID.`);
    } catch (err: any) {
      console.error('[Mark Payment Paid Error]:', err);
      onShowError('Payment Verification Failed', getFriendlyErrorMessage(err));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-900 flex flex-col text-slate-100"
      >
        {/* Top Navbar */}
        <div className="border-b border-slate-800 bg-slate-950">
          <div className="max-w-6xl mx-auto flex items-center justify-between p-4 sm:p-5">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-green-500" />
                <span>Admin Management</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                Live orders, return requests & grocery inventory
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto flex px-4">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'text-green-400 border-green-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'text-green-400 border-green-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Inventory ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('banners')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'banners'
                  ? 'text-amber-400 border-amber-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Festivals 🪔
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'text-green-400 border-green-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Payments 💳
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'text-green-400 border-green-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Analytics 📊
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-green-400 border-green-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Settings ⚙️
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 bg-slate-900 text-slate-100">
          <div className="max-w-6xl mx-auto space-y-6">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Admin Session Authorization Banner */}
              {!isDirectStoreAdmin ? (
                <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-200">
                        Store Admin Authorization Required: {currentAdminEmail ? `Currently signed in as ${currentAdminEmail}` : 'Currently Guest'}
                      </p>
                      <p className="text-amber-300/80 text-[11px] mt-0.5">
                        Firestore security rules require the store administrator account (<strong className="text-white">sonkarrajeevkumar36@gmail.com</strong>) to update order statuses, approve/reject returns, and modify inventory.
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleAdminDirectLogin} className="flex flex-wrap items-center gap-2">
                    <input
                      type="password"
                      placeholder="Admin Password"
                      value={adminAuthPassword}
                      onChange={(e) => setAdminAuthPassword(e.target.value)}
                      className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={isAdminLoggingIn || !adminAuthPassword}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isAdminLoggingIn ? (
                        <>
                          <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5" />
                          <span>Authenticate Admin</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-emerald-950/30 border border-emerald-500/30 px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-[11px]">
                      Store Admin Active: <span className="text-white">sonkarrajeevkumar36@gmail.com</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Full Admin Access
                  </span>
                </div>
              )}

              {/* Quick Status Bar */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-300">Store Acceptance</h3>
                  <p className="text-xs font-extrabold text-white">
                    {isShopClosed ? '🔴 Shop is currently CLOSED' : '🟢 Shop is currently OPEN'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleShopStatus}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isShopClosed
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isShopClosed ? 'OPEN SHOP' : 'CLOSE SHOP'}
                </button>
              </div>

              {/* Orders Stream */}
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-800 rounded-2xl py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-wider">No active orders</p>
                  </div>
                ) : (
                  orders.map((order) => {
                    const normStatus = (order.status || 'placed').toLowerCase().trim();
                    const isReturnReq = normStatus === 'return_requested' || normStatus === 'return_pending';
                    const isReturnApproved = normStatus === 'return_approved';
                    const isReturnRejected = normStatus === 'return_rejected';
                    const isReturned = normStatus === 'returned';

                    return (
                      <div
                        key={order.id}
                        className={`bg-slate-800 rounded-2xl border overflow-hidden shadow-sm space-y-3 p-4 transition-all ${
                          isReturnReq
                            ? 'border-amber-500/60 bg-amber-950/20'
                            : isReturnApproved
                            ? 'border-emerald-500/50 bg-emerald-950/15'
                            : isReturnRejected
                            ? 'border-rose-500/40 bg-rose-950/15'
                            : 'border-slate-700'
                        }`}
                      >
                        {/* Order Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">
                                #{order.id.slice(-6).toUpperCase()}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tight ${
                                  normStatus === 'delivered'
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : isReturnApproved
                                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                    : isReturnRejected
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : isReturnReq
                                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                                    : isReturned
                                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                    : normStatus === 'cancelled'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {isReturnApproved
                                  ? 'Return Approved'
                                  : isReturnRejected
                                  ? 'Return Rejected'
                                  : isReturnReq
                                  ? 'Return Requested'
                                  : isReturned
                                  ? 'Returned (Legacy)'
                                  : order.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                              Customer: <strong className="text-slate-200">{order.customerName}</strong> • 📞 {order.customerPhone}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              📍 {order.customerAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-green-400 block">
                              ₹{order.total}
                            </span>
                            {order.paymentMethod === 'online' ? (
                              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {order.paymentStatus === 'paid' ? 'Paid Online' : 'Payment Pending'}
                                {order.razorpayPaymentId ? ` (${order.razorpayPaymentId.slice(-6)})` : ''}
                              </span>
                            ) : order.paymentMethod === 'upi_qr' ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  order.paymentStatus === 'paid'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                }`}>
                                  ⚡ UPI QR {order.paymentStatus === 'paid' ? '(Paid)' : '(Verify UTR)'}
                                </span>
                                {order.upiTransactionId && (
                                  <span className="text-[10px] text-indigo-200 font-mono bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800">
                                    UTR: {order.upiTransactionId}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Cash on Delivery
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-xs space-y-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-slate-300">
                              <span>{item.name} × {item.qty}</span>
                              <span className="font-semibold text-white">₹{item.price * item.qty}</span>
                            </div>
                          ))}
                        </div>

                        {/* Return Request Details in Admin */}
                        {isReturnReq && (
                          <div className="bg-amber-900/30 border border-amber-500/40 p-3 rounded-xl text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-400 font-black uppercase text-[10px]">
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Customer Return Requested</span>
                            </div>
                            {order.returnReason && (
                              <p className="text-amber-200">
                                <strong>Reason:</strong> {order.returnReason}
                              </p>
                            )}
                            {order.returnNotes && (
                              <p className="text-amber-300 text-[11px] italic">
                                Notes: "{order.returnNotes}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Return Approved Banner */}
                        {isReturnApproved && (
                          <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-black uppercase text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Return Request Approved</span>
                            </div>
                            <p className="text-emerald-200 text-[11px]">
                              Return approved by admin. Pickup & refund are in progress.
                            </p>
                            {order.returnReason && (
                              <p className="text-emerald-300/90 text-[11px]">
                                <strong>Reason:</strong> {order.returnReason}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Return Rejected Banner */}
                        {isReturnRejected && (
                          <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-rose-400 font-black uppercase text-[10px]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Return Request Rejected</span>
                            </div>
                            <p className="text-rose-200 text-[11px]">
                              This return request was reviewed and rejected.
                            </p>
                            {order.returnReason && (
                              <p className="text-rose-300/90 text-[11px]">
                                <strong>Reason:</strong> {order.returnReason}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Legacy Returned Banner */}
                        {isReturned && (
                          <div className="bg-teal-950/40 border border-teal-500/40 p-3 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-teal-400 font-black uppercase text-[10px]">
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Returned & Refunded (Legacy Order)</span>
                            </div>
                            <p className="text-teal-200 text-[11px]">
                              Completed under legacy return flow.
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-700/60">
                          {/* Standard Delivery State Flow */}
                          {(normStatus === 'placed' || normStatus === 'pending') && (
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                              className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                            >
                              {updatingOrderId === order.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Accept Order (Start Packing)</span>
                            </button>
                          )}
                          {normStatus === 'preparing' && (
                            <div className="flex flex-1 flex-col sm:flex-row gap-2">
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleUpdateOrderStatus(order.id, 'out for delivery')}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                              >
                                {updatingOrderId === order.id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Truck className="w-3.5 h-3.5" />
                                )}
                                <span>Send for Delivery (On The Way)</span>
                              </button>
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Delivered</span>
                              </button>
                            </div>
                          )}
                          {(normStatus === 'out for delivery' || normStatus === 'out_for_delivery') && (
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                            >
                              {updatingOrderId === order.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Mark as Delivered</span>
                            </button>
                          )}

                          {/* Return Management Flow in Admin: Approve and Reject */}
                          {isReturnReq && (
                            <div className="flex flex-1 flex-col sm:flex-row gap-2">
                              {/* Approve Return Button */}
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleUpdateOrderStatus(order.id, 'return_approved')}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                              >
                                {updatingOrderId === order.id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Approve Return</span>
                              </button>

                              {/* Reject Return Button */}
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleUpdateOrderStatus(order.id, 'return_rejected')}
                                className="bg-rose-900/70 hover:bg-rose-800/90 border border-rose-700/60 disabled:opacity-50 disabled:cursor-not-allowed text-rose-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                              >
                                {updatingOrderId === order.id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-rose-200 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                )}
                                <span>Reject Return</span>
                              </button>
                            </div>
                          )}

                          {/* Payment Verification for UPI QR or Pending Online Payments */}
                          {order.paymentStatus !== 'paid' && (order.paymentMethod === 'upi_qr' || order.paymentMethod === 'online') && (
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleMarkPaymentPaid(order.id)}
                              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                            >
                              {updatingOrderId === order.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Verify & Mark Paid</span>
                            </button>
                          )}

                          {/* Cancel button for non-finalized orders */}
                          {normStatus !== 'delivered' &&
                            normStatus !== 'cancelled' &&
                            normStatus !== 'returned' &&
                            normStatus !== 'return_approved' &&
                            normStatus !== 'return_rejected' &&
                            !isReturnReq && (
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                className="bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white disabled:opacity-50 text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Category Creator */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Add / Manage Categories
                </h3>
                <form onSubmit={handleCreateCategory} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Icon (e.g. 🍎)"
                    className="w-16 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-center text-sm outline-none"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Category Name"
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isCreatingCategory}
                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isCreatingCategory ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    <span>Add</span>
                  </button>
                </form>

                {/* Category List */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id || Math.random().toString()}
                      className="flex items-center gap-2 bg-slate-900 border border-slate-700 pl-3 pr-2 py-1 rounded-full text-xs font-medium text-slate-300"
                    >
                      <span>{cat.icon || '📦'}</span>
                      <span>{cat.name || 'Category'}</span>
                      {confirmDeleteCatId === cat.id ? (
                        <div className="flex items-center gap-1 pl-1">
                          <button
                            type="button"
                            onClick={() => {
                              executeDeleteCategory(cat.id);
                              setConfirmDeleteCatId(null);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded cursor-pointer"
                          >
                            Del?
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCatId(null)}
                            className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] rounded cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCatId(cat.id)}
                          className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors cursor-pointer"
                          title="Delete category"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Form */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {editingProduct ? 'Edit Grocery Item' : 'Add New Grocery Item'}
                  </h3>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="text-xs font-bold text-amber-400 underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Product Name (e.g. Fresh Milk, Red Apples)"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                    value={editingProduct ? editingProduct.name : prodForm.name}
                    onChange={(e) => {
                      if (editingProduct) setEditingProduct({ ...editingProduct, name: e.target.value });
                      else setProdForm({ ...prodForm, name: e.target.value });
                    }}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Price in ₹"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                      value={editingProduct ? editingProduct.price : prodForm.price}
                      onChange={(e) => {
                        if (editingProduct) setEditingProduct({ ...editingProduct, price: Number(e.target.value) });
                        else setProdForm({ ...prodForm, price: e.target.value });
                      }}
                      required
                    />

                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none text-slate-200"
                      value={editingProduct ? editingProduct.unit : prodForm.unit}
                      onChange={(e) => {
                        if (editingProduct) setEditingProduct({ ...editingProduct, unit: e.target.value });
                        else setProdForm({ ...prodForm, unit: e.target.value });
                      }}
                    >
                      <option value="kg">kg</option>
                      <option value="gram">gram</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                      <option value="piece">piece</option>
                      <option value="pack">pack</option>
                      <option value="bunch">bunch</option>
                      <option value="plate">plate</option>
                      <option value="dozen">dozen</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Image URL"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                    value={editingProduct ? editingProduct.imageUrl : prodForm.imageUrl}
                    onChange={(e) => {
                      if (editingProduct) setEditingProduct({ ...editingProduct, imageUrl: e.target.value });
                      else setProdForm({ ...prodForm, imageUrl: e.target.value });
                    }}
                  />

                  <textarea
                    placeholder="Product Description (e.g. Farm fresh organic apples, rich in dietary fiber and vitamins...)"
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none text-slate-200 resize-none placeholder-slate-500 focus:border-green-500 transition-colors"
                    value={editingProduct ? (editingProduct.description || '') : prodForm.description}
                    onChange={(e) => {
                      if (editingProduct) setEditingProduct({ ...editingProduct, description: e.target.value });
                      else setProdForm({ ...prodForm, description: e.target.value });
                    }}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none text-slate-200"
                      value={editingProduct ? editingProduct.category : prodForm.category}
                      onChange={(e) => {
                        if (editingProduct) setEditingProduct({ ...editingProduct, category: e.target.value });
                        else setProdForm({ ...prodForm, category: e.target.value });
                      }}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none text-slate-200"
                      value={editingProduct ? editingProduct.status : prodForm.status}
                      onChange={(e) => {
                        const statusVal = e.target.value as any;
                        if (editingProduct) setEditingProduct({ ...editingProduct, status: statusVal });
                        else setProdForm({ ...prodForm, status: statusVal });
                      }}
                    >
                      <option value="Available">Available</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingProduct ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    <span>{editingProduct ? 'Update Product' : 'Add to Stock'}</span>
                  </button>
                </form>
              </div>

              {/* Product Listing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-bold text-slate-300">Inventory Items ({products.length})</h3>
                  <button
                    type="button"
                    onClick={onRefreshProducts}
                    className="text-[10px] font-bold text-green-400 hover:underline cursor-pointer"
                  >
                    Refresh List
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {(products || []).map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="w-10 h-10 bg-slate-900 rounded-lg p-1 flex items-center justify-center shrink-0">
                        <img
                          src={prod.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80'}
                          alt={prod.name || 'Product'}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{prod.name || 'Item'}</h4>
                        <p className="text-[10px] text-slate-400">
                          ₹{Number(prod.price) || 0} / {prod.unit || 'unit'} • {prod.category || 'General'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(prod)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteProdId === prod.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                executeDeleteProduct(prod.id);
                                setConfirmDeleteProdId(null);
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg cursor-pointer shadow-xs"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProdId(null)}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProdId(prod.id)}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg cursor-pointer transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <span className="text-xl">💰</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Delivered Revenue</p>
                  <h4 className="text-lg font-black text-green-400">
                    ₹{orders.filter((o) => (o.status || '').toLowerCase() === 'delivered').reduce((s, o) => s + (o.total || 0), 0)}
                  </h4>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <span className="text-xl">📦</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Orders</p>
                  <h4 className="text-lg font-black text-white">{orders.length}</h4>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <span className="text-xl">🔄</span>
                  <p className="text-[10px] font-bold text-amber-400 uppercase mt-1">Return Requests</p>
                  <h4 className="text-lg font-black text-amber-300">
                    {orders.filter((o) => {
                      const s = (o.status || '').toLowerCase();
                      return s === 'return_requested' || s === 'return_pending';
                    }).length}
                  </h4>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <span className="text-xl">⚡</span>
                  <p className="text-[10px] font-bold text-blue-400 uppercase mt-1">Active Deliveries</p>
                  <h4 className="text-lg font-black text-blue-300">
                    {orders.filter((o) => {
                      const s = (o.status || '').toLowerCase();
                      return s === 'placed' || s === 'preparing' || s === 'out for delivery';
                    }).length}
                  </h4>
                </div>
              </div>
            </div>
          )}

          {/* FESTIVAL BANNERS TAB */}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Automatic Festival Banners & Bumper Offers</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Auto-switches based on Indian Standard Time (IST). Live preview, priority ordering, and custom banner control.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleActivateDiwaliBanner}
                      disabled={isSavingBanners}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Activate Diwali Special Now</span>
                    </button>
                    {onPreviewDiwaliAnimation && (
                      <button
                        type="button"
                        onClick={() => {
                          onPreviewDiwaliAnimation();
                          onClose();
                        }}
                        className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                        title="Preview the full-screen Diwali Welcome Animation"
                      >
                        <span>🪔 Preview Welcome Animation</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleOpenAddBanner}
                      className="px-3.5 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Banner</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncAllBannersToFirestore}
                      disabled={isSavingBanners}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Sync all current banners to Firestore collection 'banners'"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Sync to Firebase Collection</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetBannersToDefault}
                      disabled={isSavingBanners}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      title="Reset to default calendar (Diwali, Chhath, Holi, Navratri, Eid, Christmas)"
                    >
                      Reset Calendar
                    </button>
                  </div>
                </div>

                {/* Banner Status Overview Notice */}
                <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-200">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Firebase Firestore Collection: </span>
                      <span className="bg-amber-400/20 px-1.5 py-0.5 rounded font-mono font-bold text-amber-200">banners</span>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Each banner has its own document. You can change image URLs or details anytime here or directly in Firebase Console—updates reflect live without redeploying.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banners List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Configured Festival Banners ({adminBanners.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Highest priority appears first
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {adminBanners.map((banner) => {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    const isWithinDates = todayStr >= banner.startDate && todayStr <= banner.endDate;
                    const isCurrentlyLive = banner.isActive && isWithinDates;

                    return (
                      <div
                        key={banner.id}
                        className={`bg-slate-800 p-4 rounded-2xl border transition-all ${
                          isCurrentlyLive
                            ? 'border-amber-400/60 shadow-md shadow-amber-500/10'
                            : banner.isActive
                            ? 'border-slate-700'
                            : 'border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          {/* Banner Image Preview & Basic Info */}
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <div className="w-20 h-14 sm:w-28 sm:h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 relative">
                              <img
                                src={banner.imageUrl}
                                alt={banner.festivalName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/diwali_festival_banner.jpg';
                                }}
                              />
                              {isCurrentlyLive && (
                                <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs uppercase">
                                  Live
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className="font-black text-sm text-white truncate">
                                  {banner.festivalName}
                                </span>
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${banner.accentColor || '#f59e0b'}30`, color: banner.accentColor || '#f59e0b' }}
                                >
                                  {banner.badgeText || 'Special'}
                                </span>
                                {banner.isActive ? (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                                    Enabled
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-slate-700 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                                    Disabled
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-semibold text-slate-300 truncate">
                                {banner.headline}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {banner.subtitle}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{banner.startDate} to {banner.endDate}</span>
                                </span>
                                <span>Target: {banner.categoryTarget || 'All'}</span>
                                <span className="text-amber-400 font-bold">Priority: {banner.priority ?? 5}</span>
                              </div>
                            </div>
                          </div>

                          {/* Controls: Active toggle, priority, edit, delete */}
                          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            {/* Priority up/down */}
                            <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleAdjustPriority(banner.id, 1)}
                                className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Increase priority"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustPriority(banner.id, -1)}
                                className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Decrease priority"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Active Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleBannerActive(banner.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                banner.isActive
                                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-300'
                              }`}
                            >
                              <CheckCircle2 className={`w-3.5 h-3.5 ${banner.isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                              <span>{banner.isActive ? 'Active' : 'Disabled'}</span>
                            </button>

                            {/* Change Image in Firebase Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenQuickChangeImage(banner)}
                              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-amber-500/30"
                              title="Change banner image URL"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Change Image</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditBanner(banner)}
                              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors cursor-pointer"
                              title="Edit Banner"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="p-2 bg-red-900/40 hover:bg-red-800/60 text-red-300 rounded-xl transition-colors cursor-pointer"
                              title="Delete Banner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Banner Edit / Add Modal Dialog */}
              <AnimatePresence>
                {showBannerModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[220] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
                    onClick={() => setShowBannerModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 text-slate-100 space-y-4 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                        <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                          <Flame className="w-4 h-4" />
                          <span>{editingBanner ? 'Edit Festival Banner' : 'Add New Festival Banner'}</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowBannerModal(false)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveBannerForm} className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">
                              Festival Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Diwali, Chhath Puja, Holi"
                              value={bannerForm.festivalName || ''}
                              onChange={(e) => setBannerForm({ ...bannerForm, festivalName: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">
                              Badge Text
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Diwali Special 🪔"
                              value={bannerForm.badgeText || ''}
                              onChange={(e) => setBannerForm({ ...bannerForm, badgeText: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            Headline (Required)
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Celebrate Every Festival with Zypsomart!"
                            value={bannerForm.headline || ''}
                            onChange={(e) => setBannerForm({ ...bannerForm, headline: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            Subtitle (Required)
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Bumper Offers – Order Now!"
                            value={bannerForm.subtitle || ''}
                            onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Image URL & Quick Presets */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            Banner Image URL *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="https://... or /diwali_festival_banner.jpg"
                            value={bannerForm.imageUrl || ''}
                            onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                          />

                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[10px] text-slate-400">Quick Presets:</span>
                            <button
                              type="button"
                              onClick={() => setBannerForm({ ...bannerForm, imageUrl: '/diwali_festival_banner.jpg' })}
                              className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-amber-300 transition-colors"
                            >
                              🪔 Diwali Main
                            </button>
                            <button
                              type="button"
                              onClick={() => setBannerForm({ ...bannerForm, imageUrl: '/diwali_sweets_celebration.jpg' })}
                              className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-amber-300 transition-colors"
                            >
                              🍬 Diwali Sweets
                            </button>
                            <button
                              type="button"
                              onClick={() => setBannerForm({ ...bannerForm, imageUrl: '/diwali_gifts_groceries.jpg' })}
                              className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-amber-300 transition-colors"
                            >
                              🎁 Diwali Gifts
                            </button>
                            <button
                              type="button"
                              onClick={() => setBannerForm({ ...bannerForm, imageUrl: '/diwali_diyas_rangoli.jpg' })}
                              className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-amber-300 transition-colors"
                            >
                              🪔 Diwali Rangoli
                            </button>
                            <button
                              type="button"
                              onClick={() => setBannerForm({ ...bannerForm, imageUrl: '/src/assets/images/festive_grocery_offer_1788546873284.jpg' })}
                              className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-slate-200 transition-colors"
                            >
                              🎉 Festive Grocery
                            </button>
                          </div>
                        </div>

                        {/* Dates & Priority */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">
                              Start Date (IST)
                            </label>
                            <input
                              type="date"
                              required
                              value={bannerForm.startDate || ''}
                              onChange={(e) => setBannerForm({ ...bannerForm, startDate: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">
                              End Date (IST)
                            </label>
                            <input
                              type="date"
                              required
                              value={bannerForm.endDate || ''}
                              onChange={(e) => setBannerForm({ ...bannerForm, endDate: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">
                              Priority (1-100)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={bannerForm.priority ?? 10}
                              onChange={(e) => setBannerForm({ ...bannerForm, priority: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        {/* Target category & Active toggle */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">
                              Target Category
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Sweets, Fruits, All"
                              value={bannerForm.categoryTarget || 'All'}
                              onChange={(e) => setBannerForm({ ...bannerForm, categoryTarget: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                            />
                          </div>

                          <div className="flex items-center sm:mt-5">
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-700 w-full">
                              <input
                                type="checkbox"
                                checked={bannerForm.isActive !== false}
                                onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                                className="w-4 h-4 accent-amber-500 rounded"
                              />
                              <span className="text-xs font-bold text-slate-200">Enable this Banner</span>
                            </label>
                          </div>
                        </div>

                        {/* Live Form Image Preview */}
                        {bannerForm.imageUrl && (
                          <div className="bg-slate-900 p-2 rounded-xl border border-slate-700">
                            <p className="text-[10px] text-slate-400 font-bold mb-1">Image Preview:</p>
                            <img
                              src={bannerForm.imageUrl}
                              alt="Preview"
                              className="w-full h-24 object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/diwali_festival_banner.jpg';
                              }}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                          <button
                            type="button"
                            onClick={() => setShowBannerModal(false)}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingBanners}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer"
                          >
                            {isSavingBanners ? 'Saving...' : 'Save Festival Banner'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Change Banner Image Modal Dialog */}
              <AnimatePresence>
                {changeImageBanner && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[230] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
                    onClick={() => setChangeImageBanner(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-slate-800 border border-amber-400/50 rounded-2xl w-full max-w-lg p-5 text-slate-100 space-y-4 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            <span>Change Banner Image</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Editing document: <span className="font-mono text-amber-300">banners/{changeImageBanner.id}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setChangeImageBanner(null)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveQuickImage} className="space-y-4">
                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            Image URL or Path *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Enter image URL (Firebase Storage, HTTPS, or local path)"
                            value={quickImageUrl}
                            onChange={(e) => setQuickImageUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400 font-mono"
                          />
                        </div>

                        {/* Quick Presets */}
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold mb-1.5 uppercase">Quick Festival Image Presets:</p>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setQuickImageUrl('/diwali_festival_banner.jpg')}
                              className="text-[10px] bg-slate-900 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 text-amber-300 transition-colors cursor-pointer"
                            >
                              🪔 Diwali Main
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickImageUrl('/diwali_sweets_celebration.jpg')}
                              className="text-[10px] bg-slate-900 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 text-amber-300 transition-colors cursor-pointer"
                            >
                              🍬 Diwali Sweets
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickImageUrl('/diwali_gifts_groceries.jpg')}
                              className="text-[10px] bg-slate-900 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 text-amber-300 transition-colors cursor-pointer"
                            >
                              🎁 Diwali Gifts
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickImageUrl('/diwali_diyas_rangoli.jpg')}
                              className="text-[10px] bg-slate-900 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 text-amber-300 transition-colors cursor-pointer"
                            >
                              ✨ Diwali Rangoli
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickImageUrl('/src/assets/images/harvest_fresh_sale_1788545772060.jpg')}
                              className="text-[10px] bg-slate-900 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 text-slate-200 transition-colors cursor-pointer"
                            >
                              🌾 Harvest Fresh
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickImageUrl('/src/assets/images/festive_grocery_offer_1788546873284.jpg')}
                              className="text-[10px] bg-slate-900 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 text-slate-200 transition-colors cursor-pointer"
                            >
                              🎉 Festive Grocery
                            </button>
                          </div>
                        </div>

                        {/* Image Preview */}
                        {quickImageUrl && (
                          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Live Image Preview:</span>
                            <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
                              <img
                                src={quickImageUrl}
                                alt="Banner preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/diwali_festival_banner.jpg';
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                          <button
                            type="button"
                            onClick={() => setChangeImageBanner(null)}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isUpdatingImage}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            {isUpdatingImage ? 'Updating...' : 'Save Image to Firebase'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Payment Gateway Header */}
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-green-400 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Payment Gateway & Methods System</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configure your store UPI QR code, Cash on Delivery, and online payment gateways
                    </p>
                  </div>
                </div>

                {/* 1. Store UPI QR Configuration */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Store Direct UPI QR & 1-Tap Pay (0% Gateway Fee)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-400 font-bold block mb-1">
                          Store UPI ID (VPA)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 8090315246@upi or yourname@okaxis"
                          value={upiIdInput}
                          onChange={(e) => setUpiIdInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-green-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Customers will pay directly to this UPI ID on Google Pay, PhonePe, and Paytm.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 font-bold block mb-1">
                          Store Merchant / Payee Name
                        </label>
                        <input
                          type="text"
                          placeholder="Zypsomart"
                          value={upiPayeeInput}
                          onChange={(e) => setUpiPayeeInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-green-500"
                        />
                      </div>
                    </div>

                    {/* Live Dynamic QR Preview */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/80 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Live Store QR Code Preview
                      </span>
                      <div className="bg-white p-2 rounded-xl border-2 border-green-500/30 shadow-md">
                        <img
                          src={
                            upiIdInput.trim() === 'sonkarrajeevkumar36@okhdfcbank' || !upiIdInput.trim()
                              ? storeUpiQrImage
                              : 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=' + encodeURIComponent(
                                  'upi://pay?pa=' + encodeURIComponent(upiIdInput.trim()) + '&pn=' + encodeURIComponent(upiPayeeInput.trim() || 'Zypsomart') + '&am=100&cu=INR&tn=Zypsomart'
                                )
                          }
                          alt="Store QR Code"
                          className="w-28 h-28 object-contain rounded-lg"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-green-400 font-bold mt-2">
                        {upiIdInput.trim() || 'sonkarrajeevkumar36@okhdfcbank'}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Scan from mobile to test with any UPI app
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Payment Method Switches */}
                <div className="pt-3 border-t border-slate-700/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Enable / Disable Payment Methods in Cart
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* COD Switch */}
                    <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      codEnabled ? 'bg-slate-900 border-green-500/40 text-white' : 'bg-slate-900/50 border-slate-700 text-slate-400'
                    }`}>
                      <div>
                        <span className="text-xs font-black block">Cash on Delivery</span>
                        <span className="text-[10px] text-slate-400">Doorstep pay</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={codEnabled}
                        onChange={(e) => setCodEnabled(e.target.checked)}
                        className="w-4 h-4 accent-green-600 rounded cursor-pointer"
                      />
                    </label>

                    {/* Direct UPI QR Switch */}
                    <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      upiQrEnabled ? 'bg-slate-900 border-green-500/40 text-white' : 'bg-slate-900/50 border-slate-700 text-slate-400'
                    }`}>
                      <div>
                        <span className="text-xs font-black block">Direct UPI QR Pay</span>
                        <span className="text-[10px] text-slate-400">GPay/PhonePe/Paytm</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={upiQrEnabled}
                        onChange={(e) => setUpiQrEnabled(e.target.checked)}
                        className="w-4 h-4 accent-green-600 rounded cursor-pointer"
                      />
                    </label>

                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  disabled={isSavingPayments}
                  onClick={handleSavePaymentSettings}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isSavingPayments ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Store Payment Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                General Store Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    App Logo Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={logoInput}
                    onChange={(e) => setLogoInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    Support Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="8090315246"
                    value={supportInput}
                    onChange={(e) => setSupportInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Save Store Settings
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
