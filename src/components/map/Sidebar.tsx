import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Crown, ExternalLink, MapPinned } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];

interface SidebarProps {
  categories: Category[];
  places: Place[];
  selectedCategories: string[];
  selectedPlace: string | null;
  maxDistance: number;
  userLocation: [number, number] | null;
  onCategoryToggle: (categoryId: string) => void;
  onPlaceSelect: (placeId: string | null) => void;
  onDistanceChange: (distance: number) => void;
}

export const Sidebar = ({
  categories,
  places,
  selectedCategories,
  selectedPlace,
  maxDistance,
  userLocation,
  onCategoryToggle,
  onPlaceSelect,
  onDistanceChange,
}: SidebarProps) => {
  return (
    <aside className="w-96 border-r bg-card/30 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-3 text-foreground">Категории</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id) ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105"
              style={{
                backgroundColor: selectedCategories.includes(category.id)
                  ? category.color
                  : "transparent",
                borderColor: category.color,
                color: selectedCategories.includes(category.id) ? "white" : category.color,
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
          <h3 className="font-semibold mb-2 text-sm text-foreground">
            Расстояние от вас
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
              {maxDistance >= 10000 ? "Все места" : `до ${(maxDistance / 1000).toFixed(1)} км`}
            </p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <h2 className="font-semibold mb-3 text-foreground">
            Места ({places.length})
          </h2>
          {places.map((place) => {
            const category = categories.find(c => c.id === place.category_id);
            return (
              <div
                key={place.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                  selectedPlace === place.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/50"
                }`}
                onClick={() => onPlaceSelect(place.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm text-foreground truncate">
                        {place.name}
                      </h3>
                      {place.is_premium && (
                        <Crown className="w-4 h-4 text-premium flex-shrink-0" />
                      )}
                    </div>
                    {place.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {place.description}
                      </p>
                    )}
                    {category && (
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${category.color}20`,
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
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(place.google_maps_url!, "_blank");
                      }}
                    >
                      <MapPinned className="w-3 h-3 mr-1" />
                      Google Maps
                    </Button>
                  )}
                  {place.custom_button_url && place.custom_button_text && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 flex-1"
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
    </aside>
  );
};
