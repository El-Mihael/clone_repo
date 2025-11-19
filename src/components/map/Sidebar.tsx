import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Crown, ExternalLink, MapPinned, FileText, ChevronDown } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

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
}: SidebarProps) => {
  const { t, language } = useLanguage();
  const [showToursDropdown, setShowToursDropdown] = useState(false);
  const [freeTours, setFreeTours] = useState<any[]>([]);
  const [purchasedTourIds, setPurchasedTourIds] = useState<string[]>([]);
  const [allTours, setAllTours] = useState<any[]>([]);

  useEffect(() => {
    fetchFreeTours();
    fetchPurchasedTours();
  }, []);

  const fetchFreeTours = async () => {
    const { data } = await supabase
      .from("tours")
      .select("*")
      .eq("is_active", true)
      .eq("price", 0)
      .order("display_order");
    
    if (data) setFreeTours(data);
  };

  const fetchPurchasedTours = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data: purchased } = await supabase
        .from("purchased_tours")
        .select("tour_id")
        .eq("user_id", session.user.id);
      
      if (purchased) {
        setPurchasedTourIds(purchased.map(pt => pt.tour_id));
        
        // Fetch tour details for purchased tours
        const { data: tours } = await supabase
          .from("tours")
          .select("*")
          .in("id", purchased.map(pt => pt.tour_id))
          .eq("is_active", true)
          .order("display_order");
        
        if (tours) setAllTours(tours);
      }
    }
  };

  const getTourName = (tour: any) => {
    if (language === "en" && tour.name_en) return tour.name_en;
    return tour.name;
  };
  
  const sidebarContent = (
    <>
      <div className="p-3 sm:p-4 border-b">
        <h2 className="font-semibold mb-2 sm:mb-3 text-base sm:text-lg text-foreground">{t("categories")}</h2>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id) ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-110 hover:shadow-md text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1"
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
        <div className="p-3 sm:p-4 border-b">
          <h3 className="font-semibold mb-2 text-sm sm:text-base text-foreground">
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
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              {maxDistance >= 10000 ? t("allPlaces") : `${t("distance")} ${(maxDistance / 1000).toFixed(1)} км`}
            </p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <div className="flex flex-col gap-2 mb-3">
            <h2 className="font-semibold text-lg text-foreground">
              {t("placesCount").replace("{count}", places.length.toString())}
            </h2>
            
            <div className="relative">
              <Button
                variant="outline"
                className="w-full flex items-center justify-between"
                size="sm"
                onClick={() => setShowToursDropdown(!showToursDropdown)}
              >
                <span className="flex items-center gap-1">
                  {language === "sr" ? "Туре" : language === "ru" ? "Туры" : "Tours"}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showToursDropdown ? "rotate-180" : ""}`} />
              </Button>
              
              {showToursDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                  <Button
                    variant="default"
                    className="w-full rounded-none border-b bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                    onClick={() => {
                      window.location.href = '/tours';
                      setShowToursDropdown(false);
                    }}
                  >
                    {language === "sr" ? "Купити тур" : language === "ru" ? "Купить тур" : "Buy Tour"}
                  </Button>
                  
                  {(freeTours.length > 0 || allTours.length > 0) ? (
                    <div className="p-1">
                      {freeTours.map((tour) => (
                        <button
                          key={tour.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm"
                          onClick={() => {
                            onTourSelect?.(tour.id);
                            setShowToursDropdown(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span>{getTourName(tour)}</span>
                            <span className="text-xs text-muted-foreground">
                              {language === "sr" ? "(бесплатно)" : language === "ru" ? "(бесплатно)" : "(free)"}
                            </span>
                          </div>
                        </button>
                      ))}
                      {allTours.filter(tour => !freeTours.find(ft => ft.id === tour.id)).map((tour) => (
                        <button
                          key={tour.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm"
                          onClick={() => {
                            onTourSelect?.(tour.id);
                            setShowToursDropdown(false);
                          }}
                        >
                          {getTourName(tour)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">
                      {language === "sr" ? "Нема доступних тура" : language === "ru" ? "Нет доступных туров" : "No tours available"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-base text-foreground truncate">
                        {place.name}
                      </h3>
                      {place.is_premium && (
                        <Crown className="w-4 h-4 text-premium flex-shrink-0" />
                      )}
                    </div>
                    {place.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2 break-words">
                        {place.description}
                      </p>
                    )}
                    {category && (
                      <Badge
                        variant="outline"
                        className="text-xs truncate max-w-full"
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
                <div className="flex flex-wrap gap-2 mt-3">
                  {place.google_maps_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[120px] text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(place.google_maps_url!, "_blank");
                      }}
                    >
                      <MapPinned className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Google Maps</span>
                    </Button>
                  )}
                  {place.has_custom_page && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[120px] text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlacePageOpen(place);
                      }}
                    >
                      <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Страница</span>
                    </Button>
                  )}
                  {place.custom_button_url && place.custom_button_text && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[120px] text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(place.custom_button_url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{place.custom_button_text}</span>
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
