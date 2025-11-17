import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapView } from "@/components/map/MapContainer";
import { Sidebar } from "@/components/map/Sidebar";
import { Header } from "@/components/map/Header";
import { toast } from "sonner";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];
type Tour = Database["public"]["Tables"]["tours"]["Row"];

const Map = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tourId = searchParams.get("tour");
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(10000);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        } else {
          checkAdminStatus(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  useEffect(() => {
    fetchCategories();
    fetchPlaces();
    fetchTours();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (tourId) {
      loadTour(tourId);
    }
  }, [tourId]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Не удалось получить ваше местоположение");
        }
      );
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");

    if (error) {
      toast.error("Ошибка загрузки категорий");
      return;
    }

    setCategories(data || []);
    setSelectedCategories(data?.map(c => c.id) || []);
  };

  const fetchPlaces = async () => {
    const { data, error } = await supabase
      .from("places")
      .select("*");

    if (error) {
      toast.error("Ошибка загрузки мест");
      return;
    }

    setPlaces(data || []);
  };

  const fetchTours = async () => {
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      toast.error("Ошибка загрузки туров");
      return;
    }

    setTours(data || []);
  };

  const loadTour = async (id: string) => {
    const { data: tour } = await supabase
      .from("tours")
      .select("*")
      .eq("id", id)
      .single();

    if (tour) {
      setActiveTour(tour);
      
      const { data: tourPlaces } = await supabase
        .from("tour_places")
        .select("place_id")
        .eq("tour_id", id);

      if (tourPlaces) {
        const placeIds = tourPlaces.map(tp => tp.place_id);
        const { data: places } = await supabase
          .from("places")
          .select("*")
          .in("id", placeIds);
        
        if (places) {
          setPlaces(places);
          const categoryIds = [...new Set(places.map(p => p.category_id).filter(Boolean))];
          setSelectedCategories(categoryIds as string[]);
        }
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredPlaces = places.filter(place => {
    if (!place.category_id || !selectedCategories.includes(place.category_id)) {
      return false;
    }

    if (userLocation && maxDistance < 10000) {
      const distance = getDistance(
        userLocation[0],
        userLocation[1],
        place.latitude,
        place.longitude
      );
      if (distance > maxDistance) {
        return false;
      }
    }

    return true;
  });

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        user={user}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
        tours={tours}
        activeTour={activeTour}
        onTourSelect={(tour) => {
          if (tour) {
            navigate(`/?tour=${tour.id}`);
          } else {
            navigate("/");
            setActiveTour(null);
            fetchPlaces();
            fetchCategories();
          }
        }}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          categories={categories}
          places={filteredPlaces}
          selectedCategories={selectedCategories}
          selectedPlace={selectedPlace}
          maxDistance={maxDistance}
          userLocation={userLocation}
          onCategoryToggle={(categoryId) => {
            setSelectedCategories(prev =>
              prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
            );
          }}
          onPlaceSelect={setSelectedPlace}
          onDistanceChange={setMaxDistance}
        />
        
        <MapView
          places={filteredPlaces}
          categories={categories}
          selectedPlace={selectedPlace}
          onPlaceSelect={setSelectedPlace}
          userLocation={userLocation}
        />
      </div>
    </div>
  );
};

export default Map;
