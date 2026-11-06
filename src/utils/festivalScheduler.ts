import { FestivalBanner } from '../types';
import diwaliBannerAsset from '../assets/images/diwali_festival_banner_1793716408844.jpg';
import harvestBannerAsset from '../assets/images/harvest_fresh_sale_1788545772060.jpg';
import festiveMahaAsset from '../assets/images/festive_maha_sale_1788545754852.jpg';
import diwaliSweetsAsset from '../assets/images/diwali_sweets_celebration_1793719567857.jpg';
import diwaliGiftsAsset from '../assets/images/diwali_gifts_groceries_1793719605415.jpg';
import diwaliRangoliAsset from '../assets/images/diwali_diyas_rangoli_1793719623116.jpg';
import superSaverAsset from '../assets/images/super_saver_sale_1788545795226.jpg';

export {
  diwaliBannerAsset,
  harvestBannerAsset,
  festiveMahaAsset,
  diwaliSweetsAsset,
  diwaliGiftsAsset,
  diwaliRangoliAsset,
  superSaverAsset
};

/**
 * Returns the current date in Indian Standard Time (IST, UTC+5:30)
 * Format: 'YYYY-MM-DD'
 */
export function getCurrentISTDate(): { dateString: string; month: number; day: number; year: number } {
  try {
    const istFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const dateString = istFormatter.format(new Date());
    const [year, month, day] = dateString.split('-').map(Number);
    return { dateString, month, day, year };
  } catch {
    const d = new Date();
    // Offset for IST (+5:30 = 330 minutes)
    const istOffset = 330 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset + d.getTimezoneOffset() * 60000);
    const year = istDate.getFullYear();
    const month = istDate.getMonth() + 1;
    const day = istDate.getDate();
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { dateString, month, day, year };
  }
}

/**
 * Curated preset Festival Banners covering major Indian celebrations
 * Features real grocery products, glowing diyas, golden festive styling, and authentic Indian festivals.
 */
export const DEFAULT_FESTIVAL_BANNERS: FestivalBanner[] = [
  {
    id: 'fest_diwali_special',
    festivalName: 'Diwali',
    headline: 'Celebrate Every Festival with Zypsomart!',
    subtitle: 'Bumper Offers – Order Now!',
    imageUrl: diwaliBannerAsset,
    badgeText: '🪔 DIWALI BUMPER DHAMAKA',
    ctaText: 'Shop Sweets & Puja Dry Fruits',
    categoryTarget: 'Sweets',
    startDate: '2026-10-10',
    endDate: '2026-11-20',
    isActive: true,
    priority: 10,
    accentColor: '#f59e0b'
  },
  {
    id: 'fest_chhath_puja',
    festivalName: 'Chhath Puja',
    headline: 'Celebrate Every Festival with Zypsomart!',
    subtitle: 'Chhath Mahaparv Bumper Offers – Order Now!',
    imageUrl: harvestBannerAsset,
    badgeText: '🌅 CHHATH PUJA SPECIAL',
    ctaText: 'Fresh Daura & Festive Fruits',
    categoryTarget: 'Fruits',
    startDate: '2026-10-25',
    endDate: '2026-11-25',
    isActive: true,
    priority: 9,
    accentColor: '#ea580c'
  },
  {
    id: 'fest_navratri_dussehra',
    festivalName: 'Navratri & Durga Puja',
    headline: 'Celebrate Every Festival with Zypsomart!',
    subtitle: 'Vrat & Festive Bumper Offers – Order Now!',
    imageUrl: festiveMahaAsset,
    badgeText: '🌺 DANDIYA & PUJA DEALS',
    ctaText: 'Explore Festive Grocery',
    categoryTarget: 'Vegetables',
    startDate: '2026-09-20',
    endDate: '2026-10-26',
    isActive: true,
    priority: 8,
    accentColor: '#dc2626'
  },
  {
    id: 'fest_diwali_sweets',
    festivalName: 'Diwali Celebration Sweets',
    headline: 'Celebrate Every Festival with Zypsomart!',
    subtitle: 'Diwali Sweets & Delights – Order Now!',
    imageUrl: diwaliSweetsAsset,
    badgeText: '🪔 DIWALI CELEBRATION SPECIAL',
    ctaText: 'Cakes, Dairy & Celebrations',
    categoryTarget: 'Sweets',
    startDate: '2026-10-10',
    endDate: '2026-11-20',
    isActive: true,
    priority: 9,
    accentColor: '#f59e0b'
  },
  {
    id: 'fest_diwali_gifts',
    festivalName: 'Diwali Gift Hampers & Dry Fruits',
    headline: 'Celebrate Every Festival with Zypsomart!',
    subtitle: 'Premium Dry Fruits & Gift Hampers – Order Now!',
    imageUrl: diwaliGiftsAsset,
    badgeText: '✨ DIWALI GIFTS & PUJA',
    ctaText: 'Shop Premium Hampers',
    categoryTarget: 'Sweets',
    startDate: '2026-10-10',
    endDate: '2026-11-20',
    isActive: true,
    priority: 9,
    accentColor: '#ea580c'
  },
  {
    id: 'fest_diwali_rangoli',
    festivalName: 'Diwali Diyas & Puja Celebrations',
    headline: 'Celebrate Every Festival with Zypsomart!',
    subtitle: 'Festive Lights & Puja Essentials – Order Now!',
    imageUrl: diwaliRangoliAsset,
    badgeText: '🪔 DEEPAVALI MAHA MAHOTSAV',
    ctaText: 'Puja Essentials & Treats',
    categoryTarget: 'Sweets',
    startDate: '2026-10-10',
    endDate: '2026-11-20',
    isActive: true,
    priority: 9,
    accentColor: '#d97706'
  },
  {
    id: 'fest_everyday_saver',
    festivalName: 'Maha Saver Bumper Sale',
    headline: 'Celebrate Every Festival with Zypsomart!',
    subtitle: 'Bumper Offers – Order Now!',
    imageUrl: superSaverAsset,
    badgeText: '⚡ 20-MIN SUPER SAVINGS',
    ctaText: 'Shop All Bumper Deals',
    categoryTarget: 'All',
    isActive: true,
    priority: 1,
    accentColor: '#16a34a'
  }
];

/**
 * Filter and prioritize active festival banners according to Indian Standard Time (IST)
 * and custom administrator settings.
 */
export function resolveActiveFestivalBanners(customBanners?: FestivalBanner[]): FestivalBanner[] {
  const allBanners = (customBanners && customBanners.length > 0) ? customBanners : DEFAULT_FESTIVAL_BANNERS;
  const { dateString, month } = getCurrentISTDate();

  // 1. Separate strictly active banners
  const activeBanners = allBanners.filter((b) => b.isActive !== false);

  // 2. Score banners based on explicit date ranges, current month, and priority
  const scoredBanners = activeBanners.map((banner) => {
    let score = Number(banner.priority) || 1;

    // Direct date match takes highest precedence
    if (banner.startDate && banner.endDate) {
      if (dateString >= banner.startDate && dateString <= banner.endDate) {
        score += 100;
      }
    } else {
      // Month-based festival heuristics
      const fest = (banner.festivalName || '').toLowerCase();
      if ((fest.includes('diwali') || fest.includes('chhath')) && (month === 10 || month === 11)) {
        score += 50;
      } else if (fest.includes('navratri') && (month === 9 || month === 10)) {
        score += 50;
      } else if (fest.includes('christmas') && (month === 12 || month === 1)) {
        score += 50;
      } else if (fest.includes('holi') && month === 3) {
        score += 50;
      }
    }

    // Always boost Diwali special for current period
    if (banner.id === 'fest_diwali_special' || (banner.festivalName || '').toLowerCase().includes('diwali')) {
      score += 20;
    }

    // Upgrade any legacy stock photo URLs to the new Diwali celebration images
    let resolvedImageUrl = banner.imageUrl;
    if (resolvedImageUrl && typeof resolvedImageUrl === 'string') {
      if (resolvedImageUrl.includes('543257580') || banner.id === 'fest_christmas_newyear') {
        resolvedImageUrl = diwaliSweetsAsset;
      } else if (resolvedImageUrl.includes('579783900882') || banner.id === 'fest_holi_colors') {
        resolvedImageUrl = diwaliGiftsAsset;
      } else if (resolvedImageUrl.includes('542838132') || banner.id === 'fest_eid_mubarak') {
        resolvedImageUrl = diwaliRangoliAsset;
      }
    }

    return { banner: { ...banner, imageUrl: resolvedImageUrl }, score };
  });

  // Sort by calculated score descending
  scoredBanners.sort((a, b) => b.score - a.score);

  const finalBanners = scoredBanners.map((s) => s.banner);

  // Fallback guard: always return at least the Diwali special banner if list is empty
  if (finalBanners.length === 0) {
    return [DEFAULT_FESTIVAL_BANNERS[0]];
  }

  return finalBanners;
}
