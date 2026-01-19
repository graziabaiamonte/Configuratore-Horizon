import React, { useEffect, useState, useRef } from "react";

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onAreaCalculated: (area: number) => void;
  initialPos?: { lat: number; lng: number };
}

declare global {
  interface Window {
    google: any;
  }
}

const MapPicker: React.FC<MapPickerProps> = ({
  onLocationSelect,
  onAreaCalculated,
  initialPos,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [drawingManager, setDrawingManager] = useState<any>(null);
  const [currentPolygon, setCurrentPolygon] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [position, setPosition] = useState(
    initialPos || { lat: 41.9028, lng: 12.4964 }
  );
  const [area, setArea] = useState<number | null>(null);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      const google = window.google;
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: position,
        zoom: 16,
        mapTypeId: "hybrid",
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      const markerInstance = new google.maps.Marker({
        position: position,
        map: mapInstance,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });

      const dm = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          fillColor: "#d8d900",
          fillOpacity: 0.4,
          strokeWeight: 3,
          strokeColor: "#d8d900",
          clickable: true,
          editable: true,
          zIndex: 1,
        },
      });
      dm.setMap(mapInstance);

      const searchBox = new google.maps.places.SearchBox(
        searchInputRef.current
      );
      mapInstance.addListener("bounds_changed", () => {
        searchBox.setBounds(mapInstance.getBounds());
      });

      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;
        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        mapInstance.setCenter(place.geometry.location);
        mapInstance.setZoom(18);
        markerInstance.setPosition(place.geometry.location);

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setPosition({ lat, lng });
        onLocationSelect(lat, lng);
      });

      mapInstance.addListener("click", (e: any) => {
        if (dm.getDrawingMode() === null) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          markerInstance.setPosition({ lat, lng });
          setPosition({ lat, lng });
          onLocationSelect(lat, lng);
        }
      });

      markerInstance.addListener("dragend", () => {
        const pos = markerInstance.getPosition();
        const lat = pos.lat();
        const lng = pos.lng();
        setPosition({ lat, lng });
        onLocationSelect(lat, lng);
      });

      google.maps.event.addListener(dm, "overlaycomplete", (event: any) => {
        if (event.type === "polygon") {
          const polygon = event.overlay;
          dm.setDrawingMode(null);
          setIsDrawing(false);

          if (currentPolygon) currentPolygon.setMap(null);
          setCurrentPolygon(polygon);

          const path = polygon.getPath();
          const areaSqMeters = google.maps.geometry.spherical.computeArea(path);
          const roundedArea = Math.round(areaSqMeters);
          setArea(roundedArea);
          onAreaCalculated(roundedArea);

          google.maps.event.addListener(path, "set_at", () => {
            const newArea = Math.round(
              google.maps.geometry.spherical.computeArea(path)
            );
            setArea(newArea);
            onAreaCalculated(newArea);
          });
          google.maps.event.addListener(path, "insert_at", () => {
            const newArea = Math.round(
              google.maps.geometry.spherical.computeArea(path)
            );
            setArea(newArea);
            onAreaCalculated(newArea);
          });
        }
      });

      setMap(mapInstance);
      setMarker(markerInstance);
      setDrawingManager(dm);
    };

    if (window.google) {
      initMap();
    } else {
      window.addEventListener("google-maps-loaded", initMap);
    }

    return () => {
      window.removeEventListener("google-maps-loaded", initMap);
    };
  }, []);

  const toggleDrawing = () => {
    if (!drawingManager) return;
    if (isDrawing) {
      drawingManager.setDrawingMode(null);
      setIsDrawing(false);
    } else {
      if (currentPolygon) {
        currentPolygon.setMap(null);
        setCurrentPolygon(null);
      }
      drawingManager.setDrawingMode(
        window.google.maps.drawing.OverlayType.POLYGON
      );
      setIsDrawing(true);
      setArea(null);
    }
  };

  const clearPolygon = () => {
    if (currentPolygon) {
      currentPolygon.setMap(null);
      setCurrentPolygon(null);
    }
    setArea(null);
    onAreaCalculated(0);
  };

  return (
    <div className="relative overflow-hidden border border-white/20">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10] w-full max-w-md px-4">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cerca un indirizzo o località..."
            className="w-full bg-[#fff] py-3 px-6 pr-12 outline-none border border-white focus:border-[#d8d900] transition-all text-sm font-medium text-[#2e62ab]"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div id="map" ref={mapRef} className="h-[450px] w-full" />

      <div className="absolute bottom-4 right-4 z-[10] flex flex-col gap-2">
        <button
          onClick={toggleDrawing}
          className={`flex items-center gap-2 py-3 px-5 font-bold transition-all ${
            isDrawing
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-[#d8d900] text-[#2e62ab] hover:bg-[#c6c700]"
          }`}
        >
          {isDrawing ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Annulla Disegno
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Delimita Area
            </>
          )}
        </button>
        {currentPolygon && (
          <button
            onClick={clearPolygon}
            className="bg-white text-[#2e62ab] py-3 px-5 font-bold transition-all border border-white hover:bg-slate-50 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Pulisci
          </button>
        )}
      </div>

      <div className="absolute bottom-4 left-4 z-[10] bg-white p-4 border border-white min-w-[180px]">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2e62ab]/50 mb-1">
            {isDrawing
              ? "Disegno Attivo"
              : area !== null
              ? "Superficie Calcolata"
              : "Coordinate Scelte"}
          </span>
          <span className="text-lg font-black text-[#2e62ab] leading-tight">
            {isDrawing
              ? "In corso..."
              : area !== null
              ? `${area.toLocaleString("it-IT")} m²`
              : `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`}
          </span>
          <p className="text-[10px] text-[#2e62ab]/60 mt-1 italic leading-tight">
            {isDrawing
              ? "Unisci i punti per chiudere il perimetro."
              : "Puoi trascinare il marker o cliccare sulla mappa."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
