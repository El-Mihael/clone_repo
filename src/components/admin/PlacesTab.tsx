import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Crown, FileText } from "lucide-react";
import { toast } from "sonner";
import { PlacePageEditor } from "@/components/place-page/PlacePageEditor";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];

type PlaceWithCity = Place & {
  cities?: { name_sr: string; name_en: string; name_ru: string } | null;
};

export const PlacesTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<PlaceWithCity[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPagePlace, setEditingPagePlace] = useState<Place | null>(null);
  const [translating, setTranslating] = useState(false);
  const [formData, setFormData] = useState({
    category_id: "",
    city_id: "",
    name: "",
    name_sr: "",
    name_en: "",
    description: "",
    description_sr: "",
    description_en: "",
    latitude: "",
    longitude: "",
    address: "",
    is_premium: false,
    custom_button_text: "",
    custom_button_url: "",
    google_maps_url: "",
  });

  useEffect(() => {
    fetchCategories();
    fetchCities();
    fetchPlaces();
  }, []);

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

  const fetchPlaces = async () => {
    const { data } = await supabase
      .from("places")
      .select("*, cities(name_sr, name_en, name_ru)")
      .order("created_at", { ascending: false });
    setPlaces(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const placeData = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      category_id: formData.category_id || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("places")
        .update(placeData)
        .eq("id", editingId);

      if (error) {
        toast.error("Ошибка обновления места");
        return;
      }

      toast.success("Место обновлено");
    } else {
      const { error } = await supabase
        .from("places")
        .insert(placeData);

      if (error) {
        toast.error("Ошибка создания места");
        return;
      }

      toast.success("Место создано");
    }

    resetForm();
    fetchPlaces();
  };

  const translateText = async (text: string, targetLanguage: string) => {
    if (!text.trim()) return "";
    
    try {
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { text, targetLanguage },
      });

      if (error) throw error;
      return data.translatedText || "";
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Ошибка перевода");
      return "";
    }
  };

  const handleTranslate = async (sourceField: string, sourceValue: string) => {
    if (!sourceValue.trim() || translating) return;

    setTranslating(true);
    
    // Определяем тип поля и исходный язык
    const isNameField = sourceField.includes("name");
    const fieldBase = isNameField ? "name" : "description";
    
    // Маппинг полей: name = SR, name_sr = RU, name_en = EN
    let currentLang: string;
    let targetFields: { lang: string; field: string }[];
    
    if (sourceField === fieldBase) {
      // Поле без суффикса = сербский
      currentLang = "sr";
      targetFields = [
        { lang: "ru", field: `${fieldBase}_sr` },
        { lang: "en", field: `${fieldBase}_en` }
      ];
    } else if (sourceField === `${fieldBase}_sr`) {
      // Поле с _sr = русский
      currentLang = "ru";
      targetFields = [
        { lang: "sr", field: fieldBase },
        { lang: "en", field: `${fieldBase}_en` }
      ];
    } else {
      // Поле с _en = английский
      currentLang = "en";
      targetFields = [
        { lang: "sr", field: fieldBase },
        { lang: "ru", field: `${fieldBase}_sr` }
      ];
    }

    for (const { lang, field } of targetFields) {
      const currentValue = (formData as any)[field];
      if (!currentValue || !currentValue.trim()) {
        const translated = await translateText(sourceValue, lang);
        if (translated) {
          setFormData((prev) => ({ ...prev, [field]: translated }));
        }
      }
    }
    setTranslating(false);
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      city_id: "",
      name: "",
      name_sr: "",
      name_en: "",
      description: "",
      description_sr: "",
      description_en: "",
      latitude: "",
      longitude: "",
      address: "",
      is_premium: false,
      custom_button_text: "",
      custom_button_url: "",
      google_maps_url: "",
    });
    setEditingId(null);
  };

  const handleEdit = (place: Place) => {
    setEditingId(place.id);
    setFormData({
      category_id: place.category_id || "",
      city_id: place.city_id || "",
      name: place.name,
      name_sr: (place as any).name_sr || "",
      name_en: place.name_en || "",
      description: place.description || "",
      description_sr: (place as any).description_sr || "",
      description_en: place.description_en || "",
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
      address: place.address || "",
      is_premium: place.is_premium || false,
      custom_button_text: place.custom_button_text || "",
      custom_button_url: place.custom_button_url || "",
      google_maps_url: place.google_maps_url || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это место?")) {
      return;
    }

    const { error } = await supabase
      .from("places")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Ошибка удаления места");
      return;
    }

    toast.success("Место удалено");
    fetchPlaces();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Редактировать" : "Создать"} место</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city_id">Город *</Label>
              <Select
                value={formData.city_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, city_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name_sr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название (SR) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={(e) => handleTranslate("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_sr">Название (RU)</Label>
                <Input
                  id="name_sr"
                  value={formData.name_sr}
                  onChange={(e) => setFormData({ ...formData, name_sr: e.target.value })}
                  onBlur={(e) => handleTranslate("name_sr", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">Название (EN)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  onBlur={(e) => handleTranslate("name_en", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Описание (SR)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  onBlur={(e) => handleTranslate("description", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_sr">Описание (RU)</Label>
                <Textarea
                  id="description_sr"
                  value={formData.description_sr}
                  onChange={(e) => setFormData({ ...formData, description_sr: e.target.value })}
                  onBlur={(e) => handleTranslate("description_sr", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_en">Описание (EN)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  onBlur={(e) => handleTranslate("description_en", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Широта *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Долгота *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Адрес</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_maps_url">Ссылка на Google Maps</Label>
              <Input
                id="google_maps_url"
                type="url"
                value={formData.google_maps_url}
                onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom_button_text">Текст кнопки</Label>
                <Input
                  id="custom_button_text"
                  value={formData.custom_button_text}
                  onChange={(e) => setFormData({ ...formData, custom_button_text: e.target.value })}
                  placeholder="Забронировать"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_button_url">Ссылка кнопки</Label>
                <Input
                  id="custom_button_url"
                  type="url"
                  value={formData.custom_button_url}
                  onChange={(e) => setFormData({ ...formData, custom_button_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_premium"
                checked={formData.is_premium}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_premium: checked as boolean })
                }
              />
              <Label htmlFor="is_premium" className="cursor-pointer">
                Премиум место (с короной)
              </Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={translating}>
                {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {translating ? "Перевод..." : editingId ? "Обновить" : "Создать"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {places.map((place) => {
          const category = categories.find(c => c.id === place.category_id);
          return (
            <Card key={place.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{place.name}</h3>
                      {place.is_premium && <Crown className="w-4 h-4 text-premium" />}
                    </div>
                     {place.description && (
                      <p className="text-sm text-muted-foreground mb-2">{place.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {place.cities && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted">
                          {place.cities.name_sr}
                        </div>
                      )}
                      {category && (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {category.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingPagePlace(place)}
                      title="Редактировать страницу"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(place)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(place.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Page Editor Dialog */}
      <Dialog open={!!editingPagePlace} onOpenChange={() => setEditingPagePlace(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать страницу: {editingPagePlace?.name}</DialogTitle>
          </DialogHeader>
          {editingPagePlace && (
            <PlacePageEditor
              place={editingPagePlace}
              onSave={() => {
                setEditingPagePlace(null);
                fetchPlaces();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
