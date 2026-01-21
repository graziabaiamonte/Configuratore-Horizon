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
        mapId: "7eee5f09be5889b63359327d",
        disableDefaultUI: false,
        scrollwheel: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
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

      setTimeout(() => {
        google.maps.event.trigger(mapInstance, "resize");
        mapInstance.setCenter(position);
      }, 400);

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
        console.log("📍 Click ricevuto a:", e.latLng.lat(), e.latLng.lng());

        const projection = mapInstance.getProjection();
        if (projection) {
          const clickPoint = projection.fromLatLngToPoint(e.latLng);
          console.log("🖥️ Coordinate Pixel (Projection):", clickPoint);
        }

        if (dm.getDrawingMode() === google.maps.drawing.OverlayType.POLYGON) {
          console.log(
            "%c➕ Punto aggiunto al poligono:",
            "color: #d8d900; font-weight: bold;",
            {
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            }
          );
        }

        if (dm.getDrawingMode() === null) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          console.log("📍 Marker spostato al click:", { lat, lng });
          markerInstance.setPosition({ lat, lng });
          setPosition({ lat, lng });
          onLocationSelect(lat, lng);
        }
      });

      markerInstance.addListener("dragend", () => {
        const pos = markerInstance.getPosition();
        console.log("📍 Marker trascinato:", {
          lat: pos.lat(),
          lng: pos.lng(),
        });
        setPosition({ lat: pos.lat(), lng: pos.lng() });
        onLocationSelect(pos.lat(), pos.lng());
      });

      google.maps.event.addListener(dm, "overlaycomplete", (event: any) => {
        if (event.type === "polygon") {
          const polygon = event.overlay;
          dm.setDrawingMode(null);
          setIsDrawing(false);

          if (currentPolygon) currentPolygon.setMap(null);
          setCurrentPolygon(polygon);

          const path = polygon.getPath();

          const logPolygonCoords = (reason: string) => {
            console.group(
              `%c🟡 POLIGONO ${reason}`,
              "color: #2e62ab; font-weight: bold;"
            );
            const coords: { lat: number; lng: number }[] = [];
            path.forEach((p: any, i: number) => {
              const coord = { lat: p.lat(), lng: p.lng() };
              coords.push(coord);
              console.log(`Vertice ${i}:`, coord);
            });
            console.table(coords);
            console.groupEnd();
          };

          logPolygonCoords("COMPLETATO");

          const areaSqMeters = google.maps.geometry.spherical.computeArea(path);
          const roundedArea = Math.round(areaSqMeters);
          setArea(roundedArea);
          onAreaCalculated(roundedArea);

          google.maps.event.addListener(path, "set_at", () => {
            logPolygonCoords("MODIFICATO (punto spostato)");
            const newArea = Math.round(
              google.maps.geometry.spherical.computeArea(path)
            );
            setArea(newArea);
            onAreaCalculated(newArea);
          });

          google.maps.event.addListener(path, "insert_at", () => {
            logPolygonCoords("MODIFICATO (punto aggiunto)");
            const newArea = Math.round(
              google.maps.geometry.spherical.computeArea(path)
            );
            setArea(newArea);
            onAreaCalculated(newArea);
          });
        }
      });

      google.maps.event.addListener(dm, "polygoncomplete", (polygon: any) => {
        console.log("✅ Poligono completato con successo");
      });

      mapInstance.addListener("mousedown", (e: any) => {
        if (dm.getDrawingMode() === google.maps.drawing.OverlayType.POLYGON) {
          console.group("🖱️ CLICK RILEVATO DURANTE DISEGNO");
          console.log("Lat:", e.latLng.lat());
          console.log("Lng:", e.latLng.lng());
          console.groupEnd();
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
    if (!drawingManager || !map) return;

    if (isDrawing) {
      drawingManager.setDrawingMode(null);
      setIsDrawing(false);
    } else {
      // 1. Prima cambiamo lo stato (che aggiorna le classi CSS)
      setIsDrawing(true);

      // 2. Usiamo un timeout leggermente più lungo per lasciare al browser
      // il tempo di renderizzare il nuovo layout (soprattutto su mobile)
      setTimeout(() => {
        const center = map.getCenter();
        window.google.maps.event.trigger(map, "resize");
        map.setCenter(center);

        // 3. Solo ora attiviamo il disegno
        drawingManager.setDrawingMode(
          window.google.maps.drawing.OverlayType.POLYGON
        );
      }, 150); // 150ms è il "sweet spot" per i browser mobile
    }
  };

  const clearPolygon = () => {
    if (currentPolygon) {
      currentPolygon.setMap(null);
      setCurrentPolygon(null);
      console.log("🗑️ Poligono rimosso");
    }
    setArea(null);
    onAreaCalculated(0);
  };

  useEffect(() => {
    if (isDrawing) {
      // document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isDrawing]);

  // FIX AGGIUNTIVO: Ricalcola la mappa quando cambia orientamento
  useEffect(() => {
    if (!map) return;

    const handleResize = () => {
      window.google.maps.event.trigger(map, "resize");
      const currentCenter = map.getCenter();
      map.setCenter(currentCenter);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [map]);

  return (
    <div className="relative w-full bg-slate-900 h-[650px] m-0 p-0 ">
      {/* FIX: Rimuovi overflow-hidden dal container principale */}
      <div className="relative border border-white/20 w-full m-0 p-0 h-[650px] ">
        <div
          id="map"
          ref={mapRef}
          className={`w-full z-0 h-[650px] ${
            isDrawing ? "touch-none cursor-crosshair" : "touch-pan-y"
          }`}
          style={{
            touchAction: isDrawing ? "none" : "pan-y",
          }}
        />

        <div className="absolute bottom-6 right-14  flex flex-col gap-3 z-[60]">
          <button
            onClick={toggleDrawing}
            className={`flex items-center justify-center gap-2 py-3 px-5 font-bold shadow-2xl text-[12px] md:text-base ring-2 ring-black/5   ${
              isDrawing
                ? "bg-red-600 text-white"
                : "bg-[#d8d900] text-[#2e62ab]"
            }`}
          >
            {isDrawing ? "Annulla" : "Delimita Area"}
          </button>
          {currentPolygon && !isDrawing && (
            <button
              onClick={clearPolygon}
              className="bg-white text-[#2e62ab] py-3 px-5 font-bold border border-white shadow-2xl text-[12px] md:text-base ring-2 ring-black/5"
            >
              Pulisci Area
            </button>
          )}
        </div>

        {(area !== null || isDrawing) && (
          <div className="absolute bottom-6 left-4 bg-white p-3 md:p-4 border border-white shadow-2xl z-[60] pointer-events-none ring-2 ring-black/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-[#2e62ab]/60 tracking-wider">
                {isDrawing ? "Stato" : "Superficie"}
              </span>
              <span className="text-sm md:text-lg font-black text-[#2e62ab]">
                {isDrawing
                  ? "Disegna sulla mappa..."
                  : `${area?.toLocaleString("it-IT")} m²`}
              </span>
            </div>
          </div>
        )}

        {/* FIX: Nascondi la search bar durante il disegno per evitare offset */}
        {!isDrawing && (
          <div className="absolute top-4 left-1/2  w-[90%] max-w-md z-[60] -translate-x-1/2">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cerca un indirizzo..."
              className="w-full bg-white py-3 px-6 outline-none border-none shadow-2xl text-sm font-medium text-[#2e62ab] ring-2 ring-[#d8d900]/50 focus:ring-[#d8d900]"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPicker;
