import React, { useEffect, useRef, useState } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
  useApiLoadingStatus,
  APILoadingStatus
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Store, Loader2 } from 'lucide-react';
import { GeoCoords, Language } from '../types';
import { notifyIfGmpQuotaExceeded } from '../utils/mapsQuota';

interface OrderLiveMapProps {
  customerAddress: string;
  deliveryLocation?: GeoCoords | null;
  storeLocation?: GeoCoords | null;
  lang: Language;
  isOnTheWay?: boolean;
}

interface RouteSummary {
  distanceKm: string;
  durationMins: number;
}

function DeliveryRouteLayer({
  origin,
  destination,
  onRouteComputed
}: {
  origin: GeoCoords | null;
  destination: GeoCoords | null;
  onRouteComputed: (summary: RouteSummary | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    // Cleanup previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!map || !routesLib || !origin || !destination) {
      onRouteComputed(null);
      return;
    }

    let cancelled = false;

    const request: google.maps.routes.ComputeRoutesRequest = {
      origin,
      destination,
      travelMode: 'DRIVING' as google.maps.TravelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport']
    };

    routesLib.Route.computeRoutes(request)
      .then((response) => {
        if (cancelled) return;
        const primaryRoute = response?.routes?.[0];
        if (!primaryRoute) {
          onRouteComputed(null);
          return;
        }

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#059669',
            strokeOpacity: 0.9,
            strokeWeight: 5
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        const distanceMeters = primaryRoute.distanceMeters ?? 0;
        const durationMillis = primaryRoute.durationMillis ?? 0;
        onRouteComputed({
          distanceKm: (distanceMeters / 1000).toFixed(1),
          durationMins: Math.max(1, Math.round(durationMillis / 60000))
        });
      })
      .catch((err) => {
        if (!cancelled) {
          notifyIfGmpQuotaExceeded(err);
          onRouteComputed(null);
        }
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, origin, destination, onRouteComputed]);

  return null;
}

export function OrderLiveMap({
  customerAddress,
  deliveryLocation,
  storeLocation,
  lang,
  isOnTheWay = false
}: OrderLiveMapProps) {
  const placesLib = useMapsLibrary('places');
  const loadingStatus = useApiLoadingStatus();

  const [resolvedDestination, setResolvedDestination] = useState<GeoCoords | null>(
    deliveryLocation || null
  );
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);

  // Sync direct coordinates if provided
  useEffect(() => {
    if (deliveryLocation) {
      setResolvedDestination(deliveryLocation);
    }
  }, [deliveryLocation]);

  // Resolve legacy text-only order address once via Places API (New) searchByText when user opens map
  useEffect(() => {
    if (deliveryLocation || !customerAddress.trim() || !placesLib) return;

    let cancelled = false;
    setIsResolvingAddress(true);

    placesLib.Place.searchByText({
      textQuery: customerAddress.trim(),
      fields: ['location'],
      maxResultCount: 1,
      region: 'in'
    })
      .then(({ places }) => {
        if (cancelled) return;
        const loc = places?.[0]?.location;
        if (loc) {
          setResolvedDestination({ lat: loc.lat(), lng: loc.lng() });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          notifyIfGmpQuotaExceeded(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingAddress(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deliveryLocation, customerAddress, placesLib]);

  const handleRouteComputed = React.useCallback((summary: RouteSummary | null) => {
    setRouteSummary(summary);
  }, []);

  if (
    loadingStatus === APILoadingStatus.FAILED ||
    loadingStatus === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="truncate">{customerAddress}</span>
      </div>
    );
  }

  const mapCenter = resolvedDestination || storeLocation || { lat: 20.5937, lng: 78.9629 };
  const mapZoom = resolvedDestination || storeLocation ? 15 : 4;

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-2.5 sm:p-3 space-y-2">
      {/* Map Status Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
          <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            {isOnTheWay
              ? lang === 'hi'
                ? 'लाइव डिलीवरी रूट'
                : 'Live Delivery Route'
              : lang === 'hi'
              ? 'डिलीवरी लोकेशन मैप'
              : 'Delivery Location Map'}
          </span>
        </div>

        {isResolvingAddress ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{lang === 'hi' ? 'पता खोजा जा रहा है...' : 'Locating address...'}</span>
          </span>
        ) : routeSummary ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-2xs">
            <span>{routeSummary.distanceKm} km</span>
            <span>•</span>
            <span>~{routeSummary.durationMins} mins</span>
          </span>
        ) : null}
      </div>

      {/* Explicit Height Google Map */}
      <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-emerald-200/80 bg-slate-100 relative">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={mapCenter}
          center={!routeSummary && resolvedDestination ? resolvedDestination : undefined}
          defaultZoom={mapZoom}
          gestureHandling="greedy"
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
          className="w-full h-full"
        >
          {storeLocation && (
            <AdvancedMarker
              position={storeLocation}
              title={lang === 'hi' ? 'जिप्सोमार्ट स्टोर' : 'Zypsomart Store'}
            >
              <Pin background="#0f172a" borderColor="#020617" glyphColor="#ffffff" />
            </AdvancedMarker>
          )}

          {resolvedDestination && (
            <AdvancedMarker
              position={resolvedDestination}
              title={lang === 'hi' ? 'आपका डिलीवरी पता' : 'Delivery Address'}
            >
              <Pin background="#16a34a" borderColor="#14532d" glyphColor="#ffffff" />
            </AdvancedMarker>
          )}

          {storeLocation && resolvedDestination && (
            <DeliveryRouteLayer
              origin={storeLocation}
              destination={resolvedDestination}
              onRouteComputed={handleRouteComputed}
            />
          )}
        </GoogleMap>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-slate-600 font-semibold px-0.5">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>{lang === 'hi' ? 'ग्राहक पता' : 'Your Location'}</span>
          </span>
          {storeLocation && (
            <span className="inline-flex items-center gap-1">
              <Store className="w-3 h-3 text-slate-800" />
              <span>{lang === 'hi' ? 'स्टोर हब' : 'Zypsomart Hub'}</span>
            </span>
          )}
        </div>
        {!resolvedDestination && !isResolvingAddress && (
          <span className="text-slate-400">
            {lang === 'hi' ? 'सटीक पिन उपलब्ध नहीं है' : 'Exact GPS pin unavailable'}
          </span>
        )}
      </div>
    </div>
  );
}
