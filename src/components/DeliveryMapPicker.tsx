import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
  useApiLoadingStatus,
  APILoadingStatus
} from '@vis.gl/react-google-maps';
import { Search, Navigation, MapPin, Loader2, CheckCircle2, X } from 'lucide-react';
import { GeoCoords, Language } from '../types';
import { notifyIfGmpQuotaExceeded } from '../utils/mapsQuota';

interface DeliveryMapPickerProps {
  location: GeoCoords | null;
  addressText: string;
  lang: Language;
  isMapsEnabled: boolean;
  onLocationChange: (coords: GeoCoords | null) => void;
  onAddressSelect?: (formattedAddress: string) => void;
  theme?: 'light' | 'dark';
  pinLabel?: string;
}

const DEFAULT_INDIA_CENTER: GeoCoords = { lat: 20.5937, lng: 78.9629 };

function MapViewportSync({
  center,
  zoom,
  viewport
}: {
  center: GeoCoords | null;
  zoom: number | null;
  viewport: google.maps.LatLngBounds | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (viewport) {
      map.fitBounds(viewport);
    } else if (center) {
      map.panTo(center);
      if (zoom !== null) {
        map.setZoom(zoom);
      }
    }
  }, [map, center, zoom, viewport]);

  return null;
}

export function DeliveryMapPicker({
  location,
  addressText,
  lang,
  isMapsEnabled,
  onLocationChange,
  onAddressSelect,
  theme = 'light',
  pinLabel
}: DeliveryMapPickerProps) {
  const placesLib = useMapsLibrary('places');
  const loadingStatus = useApiLoadingStatus();

  const [searchInput, setSearchInput] = useState<string>('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<{
    center: GeoCoords | null;
    zoom: number | null;
    viewport: google.maps.LatLngBounds | null;
  }>({
    center: location,
    zoom: location ? 16 : null,
    viewport: null
  });

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const hasAutoCenteredRef = useRef<boolean>(Boolean(location));

  useEffect(() => {
    if (location && !hasAutoCenteredRef.current) {
      hasAutoCenteredRef.current = true;
      setCameraTarget({ center: location, zoom: 16, viewport: null });
    } else if (!location) {
      hasAutoCenteredRef.current = false;
    }
  }, [location]);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
  }, []);

  // Debounced Places API (New) AutocompleteSuggestion queries with session tokens
  useEffect(() => {
    if (!isMapsEnabled || !placesLib) return;
    const trimmed = searchInput.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        const request: google.maps.places.AutocompleteRequest = {
          input: trimmed,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ['in']
        };

        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (!cancelled) {
          setSuggestions(res?.suggestions ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          notifyIfGmpQuotaExceeded(err);
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isMapsEnabled, placesLib, searchInput]);

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLib || !suggestion?.placePrediction) return;
    setGeoNotice(null);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['location', 'viewport', 'formattedAddress', 'displayName']
      });

      const coords = place.location
        ? { lat: place.location.lat(), lng: place.location.lng() }
        : null;

      if (coords) {
        onLocationChange(coords);
        setCameraTarget({
          center: coords,
          zoom: place.viewport ? null : 16,
          viewport: place.viewport ?? null
        });
      }

      const resolvedAddress =
        place.formattedAddress ||
        (place.displayName ? String(place.displayName) : suggestion.placePrediction.text?.text || '');
      if (resolvedAddress && onAddressSelect) {
        onAddressSelect(resolvedAddress);
      }
      setSearchInput('');
      resetSession();
    } catch (err) {
      notifyIfGmpQuotaExceeded(err);
    }
  };

  // Explicit user-triggered browser geolocation
  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoNotice(
        lang === 'hi'
          ? 'इस ब्राउज़र में GPS लोकेशन उपलब्ध नहीं है।'
          : 'GPS geolocation is not supported in this browser.'
      );
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: GeoCoords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6))
        };
        onLocationChange(coords);
        setCameraTarget({ center: coords, zoom: 17, viewport: null });

        // Try Places API (New) nearby lookup cleanly when address field is empty
        if (placesLib && !addressText.trim() && onAddressSelect) {
          try {
            const { places } = await placesLib.Place.searchNearby({
              fields: ['displayName', 'formattedAddress', 'location'],
              locationRestriction: {
                center: coords,
                radius: 150
              },
              maxResultCount: 1
            });
            const nearest = places?.[0];
            const nearbyAddr = nearest?.formattedAddress || nearest?.displayName;
            if (nearbyAddr) {
              onAddressSelect(String(nearbyAddr));
            }
          } catch (err) {
            notifyIfGmpQuotaExceeded(err);
          }
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice(
            lang === 'hi'
              ? 'लोकेशन अनुमति अस्वीकार की गई। कृपया नीचे पता लिखें या मैप पर पिन चुनें।'
              : 'Location permission declined. Search above or tap the map to drop your pin.'
          );
        } else {
          setGeoNotice(
            lang === 'hi'
              ? 'वर्तमान लोकेशन नहीं मिल सकी। कृपया खोजें या मैप पर टैप करें।'
              : 'Unable to fetch current GPS location. Please search or tap on the map.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleMapClick = (ev: any) => {
    const latLng = ev?.detail?.latLng;
    if (!latLng || typeof latLng.lat !== 'number' || typeof latLng.lng !== 'number') return;
    const coords = {
      lat: Number(latLng.lat.toFixed(6)),
      lng: Number(latLng.lng.toFixed(6))
    };
    onLocationChange(coords);
    setGeoNotice(null);
  };

  const handleMarkerDragEnd = (ev: google.maps.MapMouseEvent) => {
    if (!ev.latLng) return;
    const coords = {
      lat: Number(ev.latLng.lat().toFixed(6)),
      lng: Number(ev.latLng.lng().toFixed(6))
    };
    onLocationChange(coords);
  };

  const isDark = theme === 'dark';

  if (
    !isMapsEnabled ||
    loadingStatus === APILoadingStatus.FAILED ||
    loadingStatus === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div
        className={`rounded-2xl border p-3 text-xs ${
          isDark
            ? 'bg-slate-900/70 border-slate-700 text-slate-400'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}
      >
        <p className="font-semibold">
          {lang === 'hi'
            ? 'नीचे अपना पूरा डिलीवरी पता दर्ज करें।'
            : 'Enter your complete delivery address below.'}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-3 space-y-2.5 ${
        isDark
          ? 'bg-slate-900/80 border-slate-700 text-slate-100'
          : 'bg-emerald-50/40 border-emerald-200/80 text-slate-900'
      }`}
    >
      {/* Top Bar: Places Autocomplete Search + GPS Button */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDark ? 'text-slate-400' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              lang === 'hi'
                ? 'मोहल्ला, बाज़ार या लैंडमार्क खोजें...'
                : 'Search area, street or landmark...'
            }
            className={`w-full pl-8 pr-8 py-2 rounded-xl text-[16px] sm:text-xs font-medium outline-none border transition-all ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            }`}
          />
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
          ) : searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSuggestions([]);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* Autocomplete Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <ul
              className={`absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border shadow-xl max-h-44 overflow-y-auto divide-y ${
                isDark
                  ? 'bg-slate-900 border-slate-700 divide-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 divide-slate-100 text-slate-800'
              }`}
            >
              {suggestions.map((sug, idx) => {
                const label = sug.placePrediction?.text?.text || '';
                if (!label) return null;
                return (
                  <li key={sug.placePrediction?.placeId || idx}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2 transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-slate-800' : 'hover:bg-emerald-50'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 font-medium">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{lang === 'hi' ? 'मेरी लोकेशन' : 'Use GPS Pin'}</span>
        </button>
      </div>

      {geoNotice && (
        <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          {geoNotice}
        </p>
      )}

      {/* Interactive Google Map Container with Explicit Height (CF2) */}
      <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={location || DEFAULT_INDIA_CENTER}
          defaultZoom={location ? 16 : 4}
          gestureHandling="greedy"
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
          onClick={handleMapClick}
          className="w-full h-full"
        >
          <MapViewportSync
            center={cameraTarget.center}
            zoom={cameraTarget.zoom}
            viewport={cameraTarget.viewport}
          />
          {location && (
            <AdvancedMarker
              position={location}
              draggable
              onDragEnd={handleMarkerDragEnd}
              title={pinLabel || (lang === 'hi' ? 'डिलीवरी लोकेशन पिन' : 'Delivery Pin (Drag to adjust)')}
            >
              <Pin background="#16a34a" borderColor="#14532d" glyphColor="#ffffff" />
            </AdvancedMarker>
          )}
        </GoogleMap>

        {!location && (
          <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex justify-center">
            <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
              {lang === 'hi'
                ? 'पिन सेट करने के लिए खोजें, GPS चुनें या मैप पर टैप करें'
                : 'Search above, tap GPS, or click on the map to pin location'}
            </span>
          </div>
        )}
      </div>

      {/* Coordinates Status Bar */}
      <div className="flex items-center justify-between gap-2 text-[11px]">
        {location ? (
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              {lang === 'hi' ? 'पिन सेट:' : 'Pin confirmed:'}{' '}
              <span className="font-mono">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            </span>
          </span>
        ) : (
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            {lang === 'hi'
              ? 'तेज़ डिलीवरी के लिए पिन खींचकर सटीक स्थान पर लाएं'
              : 'Tap map or drag green pin to your exact doorstep'}
          </span>
        )}

        {location && (
          <button
            type="button"
            onClick={() => onLocationChange(null)}
            className="text-[10px] font-bold text-slate-400 hover:text-rose-500 underline cursor-pointer"
          >
            {lang === 'hi' ? 'पिन हटाएं' : 'Clear pin'}
          </button>
        )}
      </div>
    </div>
  );
}
