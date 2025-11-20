import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Crown, AlertCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PlacePageEditor } from "@/components/place-page/PlacePageEditor";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];

interface EditPlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  place: Place | null;
}

export const EditPlaceDialog = ({ open, onOpenChange, onSuccess, place }: EditPlaceDialogProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [editingCustomPage, setEditingCustomPage] = useState(false);
  const [formData, setFormData] = useState({
    category_id: "",
    city_id: "",
    name: "",
    name_en: "",
    name_sr: "",
    description: "",
    description_en: "",
    description_sr: "",
    latitude: "",
    longitude: "",
    address: "",
    google_maps_url: "",
  });

  useEffect(() => {
    if (open && place) {
      fetchCategories();
      fetchCities();
      setFormData({
        category_id: place.category_id || "",
        city_id: place.city_id || "",
        name: place.name || "",
        name_en: place.name_en || "",
        name_sr: place.name_sr || "",
        description: place.description || "",
        description_en: place.description_en || "",
        description_sr: place.description_sr || "",
        latitude: place.latitude?.toString() || "",
        longitude: place.longitude?.toString() || "",
        address: place.address || "",
        google_maps_url: place.google_maps_url || "",
      });
    }
  }, [open, place]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");
    setCategories(data || []);
  };

  const fetchCities = async () => {
    const { data } = await supabase
      .from("cities")
      .select("*");
    setCities(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) return;

    // Validate coordinates
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: t("error"),
        description: t("invalidCoordinates"),
        variant: "destructive",
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: t("error"),
        description: t("coordinatesOutOfRange"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("places")
        .update({
          category_id: formData.category_id || null,
          city_id: formData.city_id || null,
          name: formData.name,
          name_en: formData.name_en || null,
          name_sr: formData.name_sr || null,
          description: formData.description || null,
          description_en: formData.description_en || null,
          description_sr: formData.description_sr || null,
          latitude: lat,
          longitude: lng,
          address: formData.address || null,
          google_maps_url: formData.google_maps_url || null,
        })
        .eq("id", place.id);

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("placeUpdated"),
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("failedToUpdatePlace"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (editingCustomPage && place) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Редактирование страницы: {place.name}</DialogTitle>
              <Button
                variant="outline"
                onClick={() => setEditingCustomPage(false)}
              >
                Назад к редактированию
              </Button>
            </div>
          </DialogHeader>
          <PlacePageEditor
            place={place}
            onSave={() => {
              setEditingCustomPage(false);
              onSuccess();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editPlace")}</DialogTitle>
        </DialogHeader>

        {/* Premium warning for custom page */}
        {place && !place.is_premium && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              Кастомные страницы доступны только для премиум-мест. Активируйте премиум, чтобы создать уникальную страницу для вашего места.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">{t("basicInfo")}</TabsTrigger>
              <TabsTrigger value="translations">{t("translations")}</TabsTrigger>
              <TabsTrigger value="location">{t("locationTab")}</TabsTrigger>
              <TabsTrigger value="custompage" disabled={!place?.is_premium}>
                <FileText className="w-4 h-4 mr-2" />
                {place?.is_premium ? "Страница" : "Страница 🔒"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">{t("category")}</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">{t("city")}</Label>
                  <Select 
                    value={formData.city_id} 
                    onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectCity")} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="name">{t("placeNameRu")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("enterPlaceName")}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">{t("descriptionRu")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("enterDescription")}
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="translations" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground">{t("english")}</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name_en">{t("placeNameEn")}</Label>
                      <Input
                        id="name_en"
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                        placeholder={t("enterPlaceNameEn")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description_en">{t("descriptionEn")}</Label>
                      <Textarea
                        id="description_en"
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                        placeholder={t("enterDescriptionEn")}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground">{t("serbian")}</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name_sr">{t("placeNameSr")}</Label>
                      <Input
                        id="name_sr"
                        value={formData.name_sr}
                        onChange={(e) => setFormData({ ...formData, name_sr: e.target.value })}
                        placeholder={t("enterPlaceNameSr")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description_sr">{t("descriptionSr")}</Label>
                      <Textarea
                        id="description_sr"
                        value={formData.description_sr}
                        onChange={(e) => setFormData({ ...formData, description_sr: e.target.value })}
                        placeholder={t("enterDescriptionSr")}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">{t("latitude")} *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="42.123456"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("latitudeRange")} (-90 to 90)
                  </p>
                </div>

                <div>
                  <Label htmlFor="longitude">{t("longitude")} *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="21.123456"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("longitudeRange")} (-180 to 180)
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="address">{t("address")}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t("enterAddress")}
                />
              </div>

              <div>
                <Label htmlFor="google_maps_url">{t("googleMapsUrl")}</Label>
                <Input
                  id="google_maps_url"
                  type="url"
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("googleMapsUrlHint")}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="custompage" className="space-y-4 mt-4">
              {place?.is_premium ? (
                <div className="space-y-4">
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Создайте уникальную страницу для вашего места с кастомным контентом, изображениями и оформлением.
                      {place.has_custom_page && " Ваша страница уже создана и доступна посетителям."}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setEditingCustomPage(true)}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {place.has_custom_page ? "Редактировать страницу" : "Создать страницу"}
                    </Button>
                    
                    {place.has_custom_page && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from("places")
                              .update({ has_custom_page: false, custom_page_content: null })
                              .eq("id", place.id);
                            
                            if (error) throw error;
                            
                            toast({
                              title: "Успешно",
                              description: "Кастомная страница удалена",
                            });
                            onSuccess();
                          } catch (error) {
                            toast({
                              title: "Ошибка",
                              description: "Не удалось удалить страницу",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Удалить страницу
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Alert>
                  <Crown className="h-4 w-4" />
                  <AlertDescription>
                    Кастомные страницы доступны только для премиум-мест. Активируйте премиум-статус для вашего места, чтобы получить доступ к этой функции.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
