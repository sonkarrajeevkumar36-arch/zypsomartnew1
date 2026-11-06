export type OrderStatus =
  | 'placed'
  | 'pending'
  | 'preparing'
  | 'out for delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'return_pending'
  | 'returned'
  | 'return_approved'
  | 'return_rejected';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  category: string;
  qty: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  category: string;
  normalizedCategory?: string;
  status: 'Available' | 'Out of Stock' | 'Unavailable';
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  normalizedName?: string;
  icon?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus | string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  estimatedDelivery?: string;
  paymentMethod?: 'cod' | 'online' | 'upi_qr';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  upiTransactionId?: string;
  paidAt?: any;
  createdAt?: any;
  updatedAt?: any;
  acceptedAt?: any;
  deliveredAt?: any;
  returnReason?: string;
  returnNotes?: string;
  returnRequestedAt?: any;
  returnApprovedAt?: any;
  returnRejectedAt?: any;
  returnedAt?: any;
  cancellationReason?: string;
}

export interface FestivalBanner {
  id: string;
  festivalName: string;
  headline: string;
  subtitle: string;
  imageUrl: string;
  badgeText?: string;
  ctaText?: string;
  categoryTarget?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  priority: number;
  accentColor?: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface ModalAlert {
  type: 'success' | 'error' | 'confirm' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface FlyingItem {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
}

export type Language = 'en' | 'hi';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
