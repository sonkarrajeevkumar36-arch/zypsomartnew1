import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Flame,
  Zap,
  ShoppingBag,
  Plus,
  Check,
  ChevronRight,
  Clock,
  Tag
} from 'lucide-react';
import { Product, CartItem, Language } from '../types';
import { getTranslation } from '../translations';

interface BumperOffersSectionProps {
  products: Product[];
  cart: CartItem[];
  lang: Language;
  onAddToCart: (product: Product, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onSelectProduct: (product: Product) => void;
  onViewAllProducts?: () => void;
}

export function BumperOffersSection({
  products,
  cart,
  lang,
  onAddToCart,
  onUpdateQty,
  onSelectProduct,
  onViewAllProducts
}: BumperOffersSectionProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'sweets' | 'fruits' | 'kitchen'>('all');

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  // Filter products for the Bumper Offers section using real products and real prices
  const bumperProducts = useMemo(() => {
    // Priority order: Sweets (festive favorites), Fruits, Dairy/Drinks, then other available grocery items
    const available = products.filter((p) => p.status === 'Available');

    return available.filter((p) => {
      if (selectedFilter === 'all') return true;
      const cat = (p.normalizedCategory || p.category || '').toLowerCase();
      if (selectedFilter === 'sweets') return cat.includes('sweet') || p.name.toLowerCase().includes('jamun');
      if (selectedFilter === 'fruits') return cat.includes('fruit') || p.name.toLowerCase().includes('mango') || p.name.toLowerCase().includes('banana');
      if (selectedFilter === 'kitchen') return cat.includes('drink') || cat.includes('egg') || cat.includes('veg');
      return true;
    });
  }, [products, selectedFilter]);

  // Keep bumper list fresh and curated (up to 8 top bumper items)
  const displayedBumperItems = bumperProducts.slice(0, 8);

  return (
    <section
      id="bumper-offers-section"
      className="w-full relative bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-transparent p-4 sm:p-6 rounded-3xl border border-amber-300/40 shadow-xs"
      aria-label="Festive Bumper Offers"
    >
      {/* Header with Required Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              <Flame className="w-3 h-3 fill-slate-950" />
              <span>Festive Dhamaka</span>
            </span>
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Delivered in 20 Mins</span>
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Bumper Offers – Order Now!</span>
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          </h3>
          <p className="text-xs font-medium text-slate-600">
            Real prices & authentic store fresh items for your family celebrations.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Deals' },
            { id: 'sweets', label: 'Sweets 🍬' },
            { id: 'fruits', label: 'Fresh Fruits 🍎' },
            { id: 'kitchen', label: 'Essentials 🥛' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                selectedFilter === tab.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Bumper Offer Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {displayedBumperItems.map((prod) => {
          const inCart = cart.find((i) => i.id === prod.id)?.qty || 0;
          const unitLabel = lang === 'hi' && prod.unit
            ? t(`units.${(prod.unit || '').toLowerCase()}`) || prod.unit
            : (prod.unit || 'kg');

          return (
            <motion.div
              key={prod.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectProduct(prod)}
              className="bg-white rounded-2xl p-3 shadow-xs border border-amber-200/60 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between relative cursor-pointer group select-none"
            >
              {/* Product Badge */}
              <div className="bg-slate-50/90 rounded-xl h-28 mb-2 flex items-center justify-center p-2 overflow-hidden relative border border-slate-100">
                <img
                  src={prod.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80'}
                  alt={prod.name}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
                    }
                  }}
                />

                <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-2xs">
                  Bumper Deal
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-col mb-2">
                <h4
                  className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors"
                  title={prod.name}
                >
                  {prod.name}
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {prod.category}
                </span>
              </div>

              {/* Price & Add to Cart */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="font-black text-xs sm:text-sm text-slate-900 leading-none">
                    ₹{Number(prod.price) || 0}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                    / {unitLabel}
                  </span>
                </div>

                {inCart > 0 ? (
                  <div
                    className="flex items-center bg-emerald-50 border border-emerald-300 rounded-xl p-0.5 shadow-2xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQty(prod.id, -1);
                      }}
                      className="w-6 h-6 flex items-center justify-center font-black text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer text-xs"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs font-black text-emerald-900">
                      {inCart}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQty(prod.id, 1);
                      }}
                      className="w-6 h-6 flex items-center justify-center font-black text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer text-xs"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(prod, e);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('add')}</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Link to Explore All Products */}
      <div className="mt-4 pt-3 border-t border-amber-200/50 flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="text-slate-600 font-medium">
          🌟 Free delivery on orders above ₹100
        </span>

        <button
          type="button"
          onClick={() => {
            if (onViewAllProducts) {
              onViewAllProducts();
            } else {
              const grid = document.getElementById('products-section');
              grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="font-black text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View All Grocery Stock</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
