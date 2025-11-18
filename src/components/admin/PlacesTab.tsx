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
  const [formData, setFormData] = useState({
    category_id: "",
    city_id: "",
    name: "",
    name_en: "",
    description: "",
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

  const resetForm = () => {
    setFormData({
      category_id: "",
      city_id: "",
      name: "",
      name_en: "",
      description: "",
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
      name_en: place.name_en || "",
      description: place.description || "",
      description_en: place.description_en || "",
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
      address: place.address || "",
      is_premium: place.is_premium,
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название (RU) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">Название (EN)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Описание (RU)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_en">Описание (EN)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
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
              <Button type="submit">
                {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {editingId ? "Обновить" : "Создать"}
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
