import { MapPin, LogOut, Settings, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Tour = Database["public"]["Tables"]["tours"]["Row"];

interface HeaderProps {
  user: User;
  isAdmin: boolean;
  onSignOut: () => void;
  tours: Tour[];
  activeTour: Tour | null;
  onTourSelect: (tour: Tour | null) => void;
}

export const Header = ({ user, isAdmin, onSignOut, tours, activeTour, onTourSelect }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Карта Белграда</h1>
          {activeTour && (
            <p className="text-xs text-muted-foreground">Тур: {activeTour.name}</p>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {tours.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={activeTour ? "default" : "outline"} size="sm">
                <Route className="w-4 h-4 mr-2" />
                {activeTour ? activeTour.name : "Туры"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[999]">
              {activeTour && (
                <>
                  <DropdownMenuItem onClick={() => onTourSelect(null)}>
                    Показать все места
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {tours.map((tour) => (
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {user.email?.[0].toUpperCase()}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-[999]">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.email}</p>
              {isAdmin && (
                <p className="text-xs text-muted-foreground">Администратор</p>
              )}
            </div>
            <DropdownMenuSeparator />
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                <Settings className="w-4 h-4 mr-2" />
                Админ панель
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
