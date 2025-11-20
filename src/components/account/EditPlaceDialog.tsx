import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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

    setLoading(true);

    try {
      const { error } = await supabase
        .from("places")
        .update({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          category_id: formData.category_id || null,
          city_id: formData.city_id || null,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editPlace")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">{t("category")}</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
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
              <Select value={formData.city_id} onValueChange={(value) => setFormData({ ...formData, city_id: value })}>
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
            <Label htmlFor="name">{t("placeNameRu")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="name_en">{t("placeNameEn")}</Label>
            <Input
              id="name_en"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="name_sr">{t("placeNameSr")}</Label>
            <Input
              id="name_sr"
              value={formData.name_sr}
              onChange={(e) => setFormData({ ...formData, name_sr: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">{t("descriptionRu")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description_en">{t("descriptionEn")}</Label>
            <Textarea
              id="description_en"
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description_sr">{t("descriptionSr")}</Label>
            <Textarea
              id="description_sr"
              value={formData.description_sr}
              onChange={(e) => setFormData({ ...formData, description_sr: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">{t("latitude")}</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="longitude">{t("longitude")}</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">{t("address")}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="google_maps_url">{t("googleMapsUrl")}</Label>
            <Input
              id="google_maps_url"
              type="url"
              value={formData.google_maps_url}
              onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
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
