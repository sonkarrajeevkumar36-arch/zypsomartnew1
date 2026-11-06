import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { FestivalBanner } from '../types';
import { DEFAULT_FESTIVAL_BANNERS } from './festivalScheduler';

export const BANNERS_COLLECTION = 'banners';

/**
 * Subscribes to real-time changes in the Firestore 'banners' collection.
 * Any edits made in the Firebase Console or via the Admin Dashboard
 * will be delivered immediately to this listener.
 */
export function subscribeToBannersCollection(
  onUpdate: (banners: FestivalBanner[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  try {
    const bannersCol = collection(db, BANNERS_COLLECTION);
    return onSnapshot(
      bannersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: FestivalBanner[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              festivalName: data.festivalName || 'Festival Offer',
              headline: data.headline || 'Celebrate Every Festival with Zypsomart!',
              subtitle: data.subtitle || 'Bumper Offers – Order Now!',
              imageUrl: data.imageUrl || '/diwali_festival_banner.jpg',
              badgeText: data.badgeText || '',
              ctaText: data.ctaText || 'Shop Now',
              categoryTarget: data.categoryTarget || 'All',
              startDate: data.startDate || '',
              endDate: data.endDate || '',
              isActive: data.isActive !== false,
              priority: Number(data.priority) || 1,
              accentColor: data.accentColor || '#f59e0b'
            };
          });

          // Sort by priority descending (highest priority appears first)
          loaded.sort((a, b) => (Number(b.priority) || 1) - (Number(a.priority) || 1));
          onUpdate(loaded);
        } else {
          // Collection is empty, notify listener with empty array so fallback can apply
          onUpdate([]);
        }
      },
      (err) => {
        console.warn('[Firestore banners collection listener notice]:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('[Firestore banners setup error]:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Creates or updates an individual banner document in the Firestore 'banners' collection.
 * Allows store admins or Firebase Console users to update image URLs, festival names,
 * headlines, dates, and active status at any time.
 */
export async function saveBannerToFirestore(banner: FestivalBanner): Promise<void> {
  const bannerId = banner.id || `banner_${Date.now()}`;
  const bannerRef = doc(db, BANNERS_COLLECTION, bannerId);
  const payload = {
    ...banner,
    id: bannerId,
    updatedAt: serverTimestamp()
  };
  await setDoc(bannerRef, payload, { merge: true });
}

/**
 * Specifically updates just the imageUrl of a banner document in Firestore.
 */
export async function updateBannerImageInFirestore(bannerId: string, imageUrl: string): Promise<void> {
  const bannerRef = doc(db, BANNERS_COLLECTION, bannerId);
  await updateDoc(bannerRef, {
    imageUrl: imageUrl.trim(),
    updatedAt: serverTimestamp()
  });
}

/**
 * Deletes an individual banner document from the Firestore 'banners' collection.
 */
export async function deleteBannerFromFirestore(bannerId: string): Promise<void> {
  const bannerRef = doc(db, BANNERS_COLLECTION, bannerId);
  await deleteDoc(bannerRef);
}

/**
 * Seeds or syncs all default festival banners into the Firestore 'banners' collection.
 * Creates individual documents with recognizable IDs (e.g. fest_diwali_special, fest_chhath_puja).
 */
export async function seedBannersCollectionToFirestore(banners: FestivalBanner[] = DEFAULT_FESTIVAL_BANNERS): Promise<number> {
  let count = 0;
  for (const b of banners) {
    try {
      const bannerRef = doc(db, BANNERS_COLLECTION, b.id);
      await setDoc(
        bannerRef,
        {
          ...b,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      count++;
    } catch (err) {
      console.warn(`[Failed to seed banner ${b.id}]:`, err);
    }
  }
  return count;
}
