import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { TourContentEditor } from "./TourContentEditor";

type Tour = Database["public"]["Tables"]["tours"]["Row"];
type Place = Database["public"]["Tables"]["places"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];

type TourWithCity = Tour & {
  cities?: { name_sr: string; name_en: string; name_ru: string } | null;
};

export const ToursTab = () => {
  const [tours, setTours] = useState<TourWithCity[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    city_id: string;
    name: string;
    name_en: string;
    description: string;
    description_en: string;
    price: string;
    image_url: string;
    tour_content: { includes?: string[]; details?: string };
    is_active: boolean;
  }>({
    city_id: "",
    name: "",
    name_en: "",
    description: "",
    description_en: "",
    price: "0",
    image_url: "",
    tour_content: { includes: [], details: "" },
    is_active: true,
  });

  useEffect(() => {
    fetchTours();
    fetchPlaces();
    fetchCities();
  }, []);

  const fetchTours = async () => {
    const { data } = await supabase
      .from("tours")
      .select("*, cities(name_sr, name_en, name_ru)")
      .order("display_order");
    setTours(data || []);
  };

  const fetchPlaces = async () => {
    const { data } = await supabase
      .from("places")
      .select("*")
      .order("name");
    setPlaces(data || []);
  };

  const fetchCities = async () => {
    const { data } = await supabase
      .from("cities")
      .select("*");
    setCities(data || []);
  };

  const fetchTourPlaces = async (tourId: string) => {
    const { data } = await supabase
      .from("tour_places")
      .select("place_id")
      .eq("tour_id", tourId);
    
    return data?.map(tp => tp.place_id) || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      tour_content: formData.tour_content,
    };

    if (editingId) {
      const { error } = await supabase
        .from("tours")
        .update(submitData)
        .eq("id", editingId);

      if (error) {
        toast.error("Ошибка обновления тура");
        return;
      }

      // Update tour places
      await supabase.from("tour_places").delete().eq("tour_id", editingId);
      
      if (selectedPlaces.length > 0) {
        const tourPlaces = selectedPlaces.map((placeId, index) => ({
          tour_id: editingId,
          place_id: placeId,
          display_order: index,
        }));

        await supabase.from("tour_places").insert(tourPlaces);
      }

      toast.success("Тур обновлен");
    } else {
      const { data: newTour, error } = await supabase
        .from("tours")
        .insert({
          ...submitData,
          display_order: tours.length,
        })
        .select()
        .single();

      if (error || !newTour) {
        toast.error("Ошибка создания тура");
        return;
      }

      if (selectedPlaces.length > 0) {
        const tourPlaces = selectedPlaces.map((placeId, index) => ({
          tour_id: newTour.id,
          place_id: placeId,
          display_order: index,
        }));

        await supabase.from("tour_places").insert(tourPlaces);
      }

      toast.success("Тур создан");
    }

    resetForm();
    fetchTours();
  };

  const resetForm = () => {
    setFormData({
      city_id: "",
      name: "",
      name_en: "",
      description: "",
      description_en: "",
      price: "0",
      image_url: "",
      tour_content: { includes: [], details: "" },
      is_active: true,
    });
    setSelectedPlaces([]);
    setEditingId(null);
  };

  const handleEdit = async (tour: Tour) => {
    setEditingId(tour.id);
    setFormData({
      city_id: tour.city_id || "",
      name: tour.name,
      name_en: tour.name_en || "",
      description: tour.description || "",
      description_en: tour.description_en || "",
      price: tour.price?.toString() || "0",
      image_url: tour.image_url || "",
      tour_content: (tour.tour_content as any) || { includes: [], details: "" },
      is_active: tour.is_active,
    });
    
    const placeIds = await fetchTourPlaces(tour.id);
    setSelectedPlaces(placeIds);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот тур?")) {
      return;
    }

    const { error } = await supabase
      .from("tours")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Ошибка удаления тура");
      return;
    }

    toast.success("Тур удален");
    fetchTours();
  };

  const togglePlace = (placeId: string) => {
    setSelectedPlaces(prev =>
      prev.includes(placeId)
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    );
  };

  const filteredPlaces = formData.city_id
    ? places.filter(place => place.city_id === formData.city_id)
    : places;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Редактировать" : "Создать"} тур</CardTitle>
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

            <div>
              <Label htmlFor="price">Цена (0 = бесплатно)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="image_url">URL картинки</Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>

            <div>
              <Label>Контент попапа</Label>
              <TourContentEditor
                value={formData.tour_content}
                onChange={(content) => setFormData({ ...formData, tour_content: content })}
              />
            </div>

            <div className="space-y-2">
              <Label>Места в туре</Label>
              {!formData.city_id ? (
                <p className="text-sm text-muted-foreground">Сначала выберите город</p>
              ) : (
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {filteredPlaces.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Нет мест в выбранном городе</p>
                  ) : (
                    filteredPlaces.map((place) => (
                      <div key={place.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`place-${place.id}`}
                          checked={selectedPlaces.includes(place.id)}
                          onCheckedChange={() => togglePlace(place.id)}
                        />
                        <Label
                          htmlFor={`place-${place.id}`}
                          className="cursor-pointer flex-1"
                        >
                          {place.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Выбрано мест: {selectedPlaces.length}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Активный тур
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
        {tours.map((tour) => (
          <Card key={tour.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{tour.name}</h3>
                    {!tour.is_active && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">Неактивен</span>
                    )}
                  </div>
                  {tour.description && (
                    <p className="text-sm text-muted-foreground mb-2">{tour.description}</p>
                  )}
                  {tour.cities && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted">
                      {tour.cities.name_sr}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(tour)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(tour.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
