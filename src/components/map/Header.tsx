import { MapPin, LogOut, Settings, Route, Globe, MapPinned, User as UserIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useLanguage, Language } from "@/lib/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { PushNotificationButton } from "@/components/PushNotificationButton";
import { InstallPWAButton } from "@/components/InstallPWAButton";

type Tour = Database["public"]["Tables"]["tours"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];

interface HeaderProps {
  user: User;
  isAdmin: boolean;
  onSignOut: () => void;
  tours: Tour[];
  activeTour: Tour | null;
  onTourSelect: (tour: Tour | null) => void;
  selectedCity: City | null;
  onCityChange: (cityId: string) => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header = ({ 
  user, 
  isAdmin, 
  onSignOut, 
  tours, 
  activeTour, 
  onTourSelect,
  selectedCity,
  onCityChange,
  onMenuClick,
  showMenuButton = false
}: HeaderProps) => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [cities, setCities] = useState<City[]>([]);
  const [freeTours, setFreeTours] = useState<Tour[]>([]);
  const [purchasedTourIds, setPurchasedTourIds] = useState<string[]>([]);

  useEffect(() => {
    fetchCities();
    fetchFreeTours();
    fetchPurchasedTours();
  }, []);

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*");
    if (data) setCities(data);
  };

  const fetchFreeTours = async () => {
    const { data } = await supabase
      .from("tours")
      .select("*")
      .eq("price", 0)
      .eq("is_active", true);
    if (data) setFreeTours(data);
  };

  const fetchPurchasedTours = async () => {
    const { data } = await supabase
      .from("purchased_tours")
      .select("tour_id")
      .eq("user_id", user.id);
    if (data) setPurchasedTourIds(data.map(p => p.tour_id));
  };

  const getCityName = (city: City) => {
    if (language === "sr") return city.name_sr;
    if (language === "ru") return city.name_ru;
    return city.name_en;
  };

  const availableTours = [
    ...freeTours,
    ...tours.filter(t => purchasedTourIds.includes(t.id))
  ].filter((tour, index, self) => 
    index === self.findIndex(t => t.id === tour.id)
  );

  return (
    <header className="h-14 sm:h-16 border-b border-border/50 bg-card/50 backdrop-blur-md shadow-card flex items-center px-2 sm:px-4 md:px-6 sticky top-0 z-50">
      {showMenuButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="mr-1 sm:mr-2 p-1 sm:p-2"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      )}
      
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground truncate">{t("map")}</h1>
          {activeTour && (
            <p className="text-xs text-muted-foreground hidden md:block truncate">{t("tours")}: {activeTour.name}</p>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
        {/* Install PWA Button */}
        <InstallPWAButton />
        
        {/* Push Notifications */}
        <PushNotificationButton />
        
        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden sm:flex px-2">
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline text-xs sm:text-sm">{language.toUpperCase()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 sm:w-40 z-[999] bg-popover">
            <DropdownMenuItem onClick={() => setLanguage("sr")}>
              Српски
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("ru")}>
              Русский
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("en")}>
              English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* City selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2">
              <MapPinned className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden md:inline text-xs sm:text-sm truncate max-w-[80px]">{selectedCity ? getCityName(selectedCity) : t("city")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 sm:w-48 z-[999] bg-popover">
            {cities.map((city) => (
              <DropdownMenuItem
                key={city.id}
                onClick={() => onCityChange(city.id)}
                className={selectedCity?.id === city.id ? "bg-accent" : ""}
              >
                {getCityName(city)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tours selector */}
        {availableTours.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={activeTour ? "default" : "outline"} size="sm" className="hidden sm:flex px-2">
                <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden lg:inline text-xs sm:text-sm truncate max-w-[100px]">{activeTour ? activeTour.name : t("tours")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56 z-[999] bg-popover">
              <DropdownMenuItem 
                onClick={() => navigate("/tours")}
                className="bg-primary/10 hover:bg-primary/20 font-medium"
              >
                <Route className="w-4 h-4 mr-2" />
                Купить тур
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {activeTour && (
                <>
                  <DropdownMenuItem onClick={() => onTourSelect(null)}>
                    {t("allLocations")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {availableTours.map((tour) => (
                <DropdownMenuItem
                  key={tour.id}
                  onClick={() => onTourSelect(tour)}
                  className={activeTour?.id === tour.id ? "bg-accent" : ""}
                >
                  <Route className="w-4 h-4 mr-2" />
                  {tour.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] sm:text-xs font-medium text-primary">
                  {user.email?.[0].toUpperCase()}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56 z-[999] bg-popover">
            <div className="px-2 py-1.5">
              <p className="text-xs sm:text-sm font-medium truncate">{user.email}</p>
              {isAdmin && (
                <p className="text-xs text-muted-foreground">{t("adminPanel")}</p>
              )}
            </div>
            <DropdownMenuSeparator />
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                <Settings className="w-4 h-4 mr-2" />
                {t("adminPanel")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate("/account")}>
              <UserIcon className="w-4 h-4 mr-2" />
              {t("personalAccount")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
