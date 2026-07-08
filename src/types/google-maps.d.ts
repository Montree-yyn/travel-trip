export {};

declare global {
  interface Window {
    google?: typeof google;
    initTravelTripGoogleMaps?: () => void;
    gm_authFailure?: () => void;
  }
}
