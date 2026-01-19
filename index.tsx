import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/**
 * Robust loader for Google Maps API.
 * Cleans the API key from environment variable artifacts and ensures
 * the script is injected only once with the correct global callback.
 */
const loadGoogleMaps = () => {
  // Obtain the key from the environment variable as required.
  const rawApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Clean the key: remove any surrounding quotes and whitespace that might be
  // introduced by .env files or bundling processes.
  const apiKey = rawApiKey?.replace(/["']/g, "").trim();

  if (
    !apiKey ||
    apiKey === "YOUR_API_KEY" ||
    apiKey.startsWith("process.env")
  ) {
    console.warn(
      "Google Maps API Key Warning: The provided key seems to be a placeholder or is missing. " +
        "Please ensure process.env.API_KEY contains a valid Google Maps JavaScript API key."
    );
    // We continue attempting to load if a key exists, even if it looks suspicious,
    // but we log a warning to help the user debug.
  }

  // Prevent multiple script tags if this function is called more than once (e.g., in development)
  if (
    document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
  ) {
    return;
  }

  // Define the global callback required by the Google Maps SDK
  // We define it on window before the script loads to ensure it's available.
  (window as any).initMap = () => {
    window.dispatchEvent(new Event("google-maps-loaded"));
  };

  const script = document.createElement("script");
  // We use the cleaned apiKey and ensure all required libraries are requested.
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing,geometry,marker&callback=initMap`;
  script.async = true;
  script.defer = true;

  // Caricamento della libreria per i nuovi Web Components (Ricerca moderna)
  const extendedLibraryScript = document.createElement("script");
  extendedLibraryScript.src =
    "https://unpkg.com/@googlemaps/extended-component-library@0.6.11/dist/index.full.js";
  extendedLibraryScript.type = "module";
  // -----------------------

  // Basic error handling for the script tag itself
  script.onerror = () => {
    console.error(
      "Failed to load the Google Maps script tag. Please check your network connection."
    );
  };

  document.head.appendChild(script);
  document.head.appendChild(extendedLibraryScript);
};

// Execute the loading process
loadGoogleMaps();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
