import { useEffect, useRef } from "react";
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Crown, ExternalLink, MapPinned, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];

interface MapContainerProps {
  places: Place[];
  categories: Category[];
  selectedPlace: string | null;
  onPlaceSelect: (placeId: string | null) => void;
  userLocation: [number, number] | null;
  onPlacePageOpen: (place: Place) => void;
  cityCenter: [number, number];
  cityZoom: number;
}

const MapUpdater = ({ 
  selectedPlace, 
  places, 
  cityCenter,
  cityZoom 
}: { 
  selectedPlace: string | null; 
  places: Place[]; 
  cityCenter: [number, number];
  cityZoom: number;
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      const place = places.find(p => p.id === selectedPlace);
      if (place) {
        map.flyTo([place.latitude, place.longitude], 18, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    }
  }, [selectedPlace, places, map]);

  useEffect(() => {
    // Летим к центру города только если не выбрано конкретное место
    if (!selectedPlace) {
      map.flyTo(cityCenter, cityZoom, {
        duration: 1.5,
      });
    }
  }, [cityCenter, cityZoom, map, selectedPlace]);

  return null;
};

const createCustomIcon = (color: string, isPremium: boolean) => {
  const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        ${isPremium ? `
          <linearGradient id="premiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
          </linearGradient>
        ` : ''}
      </defs>
      <path 
        d="M16,2 C9.4,2 4,7.4 4,14 C4,23 16,38 16,38 C16,38 28,23 28,14 C28,7.4 22.6,2 16,2 Z" 
        fill="${isPremium ? 'url(#premiumGradient)' : color}"
        filter="url(#shadow)"
        stroke="${isPremium ? '#FFD700' : '#ffffff'}"
        stroke-width="2"
      />
      <circle cx="16" cy="14" r="6" fill="white" opacity="0.9"/>
      ${isPremium ? '<path d="M16,10 L17,13 L20,13 L18,15 L19,18 L16,16 L13,18 L14,15 L12,13 L15,13 Z" fill="#FFD700"/>' : ''}
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-marker",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

export const MapView = ({
  places,
  categories,
  selectedPlace,
  onPlaceSelect,
  userLocation,
  onPlacePageOpen,
  cityCenter,
  cityZoom,
}: MapContainerProps) => {
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (selectedPlace && markerRefs.current[selectedPlace]) {
      markerRefs.current[selectedPlace].openPopup();
    }
  }, [selectedPlace]);

  return (
    <div className="flex-1 relative">
      <LeafletMap
        center={cityCenter}
        zoom={cityZoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              html: `<div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
              className: "user-location-marker",
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>Вы здесь</Popup>
          </Marker>
        )}

        {places.map((place) => {
          const category = categories.find(c => c.id === place.category_id);
          const markerColor = category?.color || "#3B82F6";
          
          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createCustomIcon(markerColor, place.is_premium)}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[place.id] = ref;
                }
              }}
              eventHandlers={{
                click: () => onPlaceSelect(place.id),
              }}
            >
              <Popup className="custom-popup" maxWidth={300}>
                <div className="p-2">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="font-semibold text-base flex-1">{place.name}</h3>
                    {place.is_premium && (
                      <Crown className="w-5 h-5 text-premium flex-shrink-0" />
                    )}
                  </div>
                  
                  {place.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {place.description}
                    </p>
                  )}

                  {place.address && (
                    <p className="text-xs text-muted-foreground mb-3">
                      📍 {place.address}
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    {place.has_custom_page && (
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full justify-start"
                        onClick={() => onPlacePageOpen(place)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Подробнее о месте
                      </Button>
                    )}
                    {place.google_maps_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(place.google_maps_url!, "_blank")}
                      >
                        <MapPinned className="w-4 h-4 mr-2" />
                        Открыть в Google Maps
                      </Button>
                    )}
                    {place.custom_button_url && place.custom_button_text && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(place.custom_button_url!, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {place.custom_button_text}
                      </Button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapUpdater selectedPlace={selectedPlace} places={places} cityCenter={cityCenter} cityZoom={cityZoom} />
      </LeafletMap>
    </div>
  );
};
