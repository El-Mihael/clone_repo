import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Crown, ExternalLink, MapPinned, FileText } from "lucide-react";
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
}: SidebarProps) => {
  const { t } = useLanguage();
  
  const sidebarContent = (
    <>
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-3 text-lg text-foreground">{t("categories")}</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id) ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-110 hover:shadow-md text-sm px-3 py-1"
              style={{
                backgroundColor: selectedCategories.includes(category.id)
                  ? category.color
                  : "transparent",
                borderColor: category.color,
                color: selectedCategories.includes(category.id) ? "white" : category.color,
                boxShadow: selectedCategories.includes(category.id) 
                  ? `0 4px 12px ${category.color}33` 
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
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-2 text-base text-foreground">
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
            <p className="text-sm text-muted-foreground text-center">
              {maxDistance >= 10000 ? t("allPlaces") : `${t("distance")} ${(maxDistance / 1000).toFixed(1)} км`}
            </p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <h2 className="font-semibold mb-3 text-lg text-foreground">
            {t("placesCount").replace("{count}", places.length.toString())}
          </h2>
          {places.map((place) => {
            const category = categories.find(c => c.id === place.category_id);
            return (
              <div
                key={place.id}
                className={`group p-3 rounded-lg border transition-all cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 ${
                  selectedPlace === place.id
                    ? "border-primary bg-primary/10 shadow-card"
                    : "border-border bg-card hover:border-primary/50"
                } ${place.is_premium ? "shadow-premium/20" : ""}`}
                onClick={() => onPlaceSelect(place.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-lg text-foreground truncate">
                        {place.name}
                      </h3>
                      {place.is_premium && (
                        <Crown className="w-5 h-5 text-premium flex-shrink-0" />
                      )}
                    </div>
                    {place.description && (
                      <p className="text-base text-muted-foreground line-clamp-2 mb-2">
                        {place.description}
                      </p>
                    )}
                    {category && (
                      <Badge
                        variant="outline"
                        className="text-sm"
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
                <div className="flex gap-2 mt-3">
                  {place.google_maps_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(place.google_maps_url!, "_blank");
                      }}
                    >
                      <MapPinned className="w-4 h-4 mr-1" />
                      Google Maps
                    </Button>
                  )}
                  {place.has_custom_page && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlacePageOpen(place);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Страница
                    </Button>
                  )}
                  {place.custom_button_url && place.custom_button_text && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(place.custom_button_url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
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
        <DrawerContent className="h-[85vh]">
          <div className="flex flex-col h-full">
            {sidebarContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <aside className="w-80 lg:w-96 border-r border-border/50 bg-card/50 backdrop-blur-md flex flex-col shadow-card">
      {sidebarContent}
    </aside>
  );
};
