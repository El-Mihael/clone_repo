import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Tour = Database["public"]["Tables"]["tours"]["Row"];

interface TourWithCity extends Tour {
  cities?: { name_sr: string; name_en: string; name_ru: string } | null;
}

export default function Tours() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [tours, setTours] = useState<TourWithCity[]>([]);
  const [purchasedTours, setPurchasedTours] = useState<string[]>([]);
  const [selectedTour, setSelectedTour] = useState<TourWithCity | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setUserId(session.user.id);
      await fetchPurchasedTours(session.user.id);
    }

    await fetchTours();
    setLoading(false);
  };

  const fetchTours = async () => {
    const { data } = await supabase
      .from("tours")
      .select("*, cities(name_sr, name_en, name_ru)")
      .eq("is_active", true)
      .gt("price", 0)
      .order("display_order");
    
    setTours(data || []);
  };

  const fetchPurchasedTours = async (userId: string) => {
    const { data } = await supabase
      .from("purchased_tours")
      .select("tour_id")
      .eq("user_id", userId);
    
    setPurchasedTours(data?.map(pt => pt.tour_id) || []);
  };

  const handlePurchase = async (tourId: string) => {
    if (!userId) {
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from("purchased_tours")
        .insert({ tour_id: tourId, user_id: userId });

      if (error) throw error;

      setPurchasedTours([...purchasedTours, tourId]);
      toast.success(language === "sr" ? "Тур успешно куплен!" : language === "ru" ? "Тур успешно куплен!" : "Tour purchased successfully!");
    } catch (error) {
      toast.error(language === "sr" ? "Грешка при куповини тура" : language === "ru" ? "Ошибка при покупке тура" : "Error purchasing tour");
    }
  };

  const getTourName = (tour: TourWithCity) => {
    if (language === "en" && tour.name_en) return tour.name_en;
    return tour.name;
  };

  const getTourDescription = (tour: TourWithCity) => {
    if (language === "en" && tour.description_en) return tour.description_en;
    return tour.description || "";
  };

  const getCityName = (tour: TourWithCity) => {
    if (!tour.cities) return "";
    if (language === "en") return tour.cities.name_en;
    if (language === "ru") return tour.cities.name_ru;
    return tour.cities.name_sr;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("map")}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {language === "sr" ? "Туре" : language === "ru" ? "Туры" : "Tours"}
            </h1>
            <p className="text-muted-foreground">
              {language === "sr" ? "Изаберите туру за истраживање" : language === "ru" ? "Выберите тур для исследования" : "Choose a tour to explore"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => {
            const isPurchased = purchasedTours.includes(tour.id);
            const isFree = !tour.price || tour.price === 0;

            return (
              <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {tour.image_url && (
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img 
                      src={tour.image_url} 
                      alt={getTourName(tour)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl">{getTourName(tour)}</CardTitle>
                    {isPurchased && (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        {language === "sr" ? "Купљено" : language === "ru" ? "Куплено" : "Owned"}
                      </Badge>
                    )}
                  </div>
                  
                  {tour.cities && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {getCityName(tour)}
                    </div>
                  )}
                  
                  <CardDescription className="line-clamp-2">
                    {getTourDescription(tour)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {isFree 
                        ? (language === "sr" ? "Бесплатно" : language === "ru" ? "Бесплатно" : "Free")
                        : `${tour.price} ${language === "sr" ? "кредита" : language === "ru" ? "кредитов" : "credits"}`
                      }
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSelectedTour(tour)}
                    >
                      {language === "sr" ? "Шта је укључено" : language === "ru" ? "Что входит" : "What's included"}
                    </Button>
                    
                    {!isPurchased && (
                      <Button 
                        className="flex-1"
                        onClick={() => handlePurchase(tour.id)}
                      >
                        {language === "sr" ? "Купити" : language === "ru" ? "Купить" : "Purchase"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tour Details Dialog */}
      <Dialog open={!!selectedTour} onOpenChange={() => setSelectedTour(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedTour && getTourName(selectedTour)}
            </DialogTitle>
            <DialogDescription>
              {selectedTour && getTourDescription(selectedTour)}
            </DialogDescription>
          </DialogHeader>

          {selectedTour?.image_url && (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <img 
                src={selectedTour.image_url} 
                alt={getTourName(selectedTour)}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-4">
            {selectedTour?.tour_content && typeof selectedTour.tour_content === 'object' && (
              <>
                {(selectedTour.tour_content as any).includes && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      {language === "sr" ? "Шта је укључено:" : language === "ru" ? "Что входит:" : "What's included:"}
                    </h3>
                    <ul className="space-y-2">
                      {((selectedTour.tour_content as any).includes as string[]).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(selectedTour.tour_content as any).details && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      {language === "sr" ? "Детаљи:" : language === "ru" ? "Детали:" : "Details:"}
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {(selectedTour.tour_content as any).details}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
