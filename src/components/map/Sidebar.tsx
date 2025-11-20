import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Crown, ExternalLink, MapPinned, FileText } from "lucide-react";
import { SharePlaceButton } from "./SharePlaceButton";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];

interface SidebarProps {
  categories: Category[];
  places: Place[];
  selectedCategories: string[];
  selectedPlace: string | null;
  maxDistance: number;
  userLocation: [number, number] | null;
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryToggle: (categoryId: string) => void;
  onPlaceSelect: (placeId: string | null) => void;
  onDistanceChange: (distance: number) => void;
  onPlacePageOpen: (place: Place) => void;
  onTourSelect?: (tourId: string) => void;
  onTourGuideOpen?: () => void;
  showTourGuideButton?: boolean;
}

export const Sidebar = ({
  categories,
  places,
  selectedCategories,
  selectedPlace,
  maxDistance,
  userLocation,
  isMobile,
  open,
  onOpenChange,
  onCategoryToggle,
  onPlaceSelect,
  onDistanceChange,
  onPlacePageOpen,
  onTourSelect,
  onTourGuideOpen,
  showTourGuideButton = false,
}: SidebarProps) => {
  const { t, language } = useLanguage();
  const placeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Автоматический скролл к выбранному месту
  useEffect(() => {
    if (selectedPlace && placeRefs.current[selectedPlace]) {
      placeRefs.current[selectedPlace]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedPlace]);
  
  const sidebarContent = (
    <>
      <div className="p-3 border-b border-border">
        <h2 className="font-bold mb-2 text-base text-foreground">{t("categories")}</h2>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id) ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105 text-xs px-2.5 py-1"
              style={{
                backgroundColor: selectedCategories.includes(category.id)
                  ? category.color
                  : "transparent",
                borderColor: category.color,
                color: selectedCategories.includes(category.id) ? "white" : category.color,
                boxShadow: selectedCategories.includes(category.id) 
                  ? `0 2px 8px ${category.color}40` 
                  : "none",
              }}
              onClick={() => onCategoryToggle(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {userLocation && (
        <div className="p-3 border-b border-border">
          <h3 className="font-bold mb-2 text-sm text-foreground">
            {t("distance")}
          </h3>
          <div className="space-y-2">
            <Slider
              value={[maxDistance]}
              onValueChange={([value]) => onDistanceChange(value)}
              max={10000}
              step={100}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground text-center">
              {maxDistance >= 10000 ? t("allPlaces") : `${(maxDistance / 1000).toFixed(1)} км`}
            </p>
          </div>
        </div>
      )}

      {showTourGuideButton && onTourGuideOpen && (
        <div className="p-3 border-b border-border">
          <Button
            onClick={onTourGuideOpen}
            className="w-full gap-2"
            size="sm"
          >
            <FileText className="w-4 h-4" />
            <span className="font-semibold">Путеводитель</span>
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <h2 className="font-bold mb-3 text-base text-foreground">
            {t("placesCount").replace("{count}", places.length.toString())}
          </h2>
          {places.map((place) => {
            const category = categories.find(c => c.id === place.category_id);
            return (
              <div
                key={place.id}
                ref={(el) => {
                  placeRefs.current[place.id] = el;
                }}
                className={`group p-3 rounded-md border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                  selectedPlace === place.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/50"
                } ${place.is_premium ? "ring-1 ring-primary/20" : ""}`}
                onClick={() => {
                  onPlaceSelect(place.id);
                  if (isMobile) {
                    setTimeout(() => onOpenChange(false), 300);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {place.name}
                      </h3>
                      {place.is_premium && (
                        <Crown className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    {place.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {place.description}
                      </p>
                    )}
                    {category && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: category.color,
                          color: category.color,
                        }}
                      >
                        {category.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <SharePlaceButton 
                    place={place}
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[100px] text-xs h-8"
                  />
                  {place.google_maps_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[100px] text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(place.google_maps_url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Maps
                    </Button>
                  )}
                  {place.has_custom_page && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 min-w-[100px] text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlacePageOpen(place);
                      }}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      {t("details")}
                    </Button>
                  )}
                  {place.custom_button_url && place.custom_button_text && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 min-w-[100px] text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(place.custom_button_url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {place.custom_button_text}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] bg-background border-t">
          {sidebarContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <aside className="w-80 border-r bg-card flex flex-col h-full overflow-hidden">
      {sidebarContent}
    </aside>
  );
};
