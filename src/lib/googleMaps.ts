const GOOGLE_MAPS_SCRIPT_ID = "travel-trip-google-maps";

let mapsPromise: Promise<typeof google> | null = null;

export function getGoogleMapsApiKey() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  return apiKey?.trim() || undefined;
}

function rejectMapsLoad(reject: (reason?: unknown) => void, error: Error) {
  mapsPromise = null;
  delete window.initTravelTripGoogleMaps;
  delete window.gm_authFailure;
  reject(error);
}

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (mapsPromise) return mapsPromise;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }

  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    const timeoutId = window.setTimeout(() => {
      rejectMapsLoad(reject, new Error("Google Maps timed out"));
    }, 8000);

    function resolveMaps() {
      window.clearTimeout(timeoutId);
      if (!window.google?.maps) {
        rejectMapsLoad(reject, new Error("Google Maps failed to initialize"));
        return;
      }
      delete window.initTravelTripGoogleMaps;
      delete window.gm_authFailure;
      resolve(window.google);
    }

    window.gm_authFailure = () => {
      window.clearTimeout(timeoutId);
      rejectMapsLoad(reject, new Error("Google Maps API key is invalid"));
    };

    if (existing) {
      existing.addEventListener("load", resolveMaps, { once: true });
      existing.addEventListener("error", () => {
        window.clearTimeout(timeoutId);
        rejectMapsLoad(reject, new Error("Google Maps failed to load"));
      }, { once: true });
      return;
    }

    window.initTravelTripGoogleMaps = resolveMaps;

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=initTravelTripGoogleMaps`;
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      rejectMapsLoad(reject, new Error("Google Maps failed to load"));
    };

    try {
      document.head.appendChild(script);
    } catch {
      window.clearTimeout(timeoutId);
      rejectMapsLoad(reject, new Error("Google Maps failed to load"));
    }
  });

  return mapsPromise;
}

export function getPhotoUrl(photo?: google.maps.places.PlacePhoto, maxWidth = 720) {
  try {
    return photo?.getUrl({ maxWidth });
  } catch {
    return undefined;
  }
}

export function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
