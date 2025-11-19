import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Tour = Database["public"]["Tables"]["tours"]["Row"];

interface TourGuideEditorProps {
  tour: Tour;
  onSave: () => void;
  tourPlaces: Array<{ place_id: string; place_name: string }>;
}

interface Block {
  id: string;
  type: "text" | "image" | "info-card" | "gallery" | "two-column" | "three-column" | "table" | "anchor" | "place-link";
  content: any;
  style?: any;
  order: number;
}

interface GuideContent {
  header?: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    backgroundColor?: string;
    textColor?: string;
    height?: string;
  };
  blocks?: Block[];
  pageStyle?: {
    backgroundColor?: string;
    fontFamily?: string;
    maxWidth?: string;
  };
}

export const TourGuideEditor = ({ tour, onSave, tourPlaces }: TourGuideEditorProps) => {
  const [content, setContent] = useState<GuideContent>(
    (tour.guide_content as GuideContent) || { blocks: [] }
  );
  const [saving, setSaving] = useState(false);

  const addBlock = (type: Block["type"]) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      order: (content.blocks?.length || 0) + 1,
    };

    setContent({
      ...content,
      blocks: [...(content.blocks || []), newBlock],
    });
  };

  const getDefaultContent = (type: Block["type"]) => {
    switch (type) {
      case "text":
        return { html: "<p>Введите текст здесь...</p>" };
      case "image":
        return { url: "", alt: "", caption: "" };
      case "info-card":
        return { title: "", text: "", backgroundColor: "", accentColor: "" };
      case "gallery":
        return { images: [] };
      case "two-column":
        return { leftColumn: "<p>Левая колонка</p>", rightColumn: "<p>Правая колонка</p>" };
      case "three-column":
        return { leftColumn: "<p>Левая</p>", middleColumn: "<p>Центр</p>", rightColumn: "<p>Правая</p>" };
      case "table":
        return { html: "<table><thead><tr><th>Колонка 1</th><th>Колонка 2</th></tr></thead><tbody><tr><td>Данные</td><td>Данные</td></tr></tbody></table>" };
      case "anchor":
        return { anchorId: "", anchorLabel: "" };
      case "place-link":
        return { placeId: "", linkText: "Показать на карте" };
      default:
        return {};
    }
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setContent({
      ...content,
      blocks: (content.blocks || []).map((block: Block) =>
        block.id === blockId ? { ...block, ...updates } : block
      ),
    });
  };

  const deleteBlock = (blockId: string) => {
    setContent({
      ...content,
      blocks: (content.blocks || []).filter((block: Block) => block.id !== blockId),
    });
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const blocks = [...(content.blocks || [])];
    const index = blocks.findIndex((b: Block) => b.id === blockId);
    
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
    
    // Update order
    blocks.forEach((block, idx) => {
      block.order = idx + 1;
    });

    setContent({ ...content, blocks });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tours")
        .update({ guide_content: content as any })
        .eq("id", tour.id);

      if (error) throw error;

      toast.success("Путеводитель сохранён");
      onSave();
    } catch (error) {
      console.error("Error saving guide:", error);
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="header">
        <TabsList>
          <TabsTrigger value="header">Хэдер</TabsTrigger>
          <TabsTrigger value="blocks">Блоки</TabsTrigger>
          <TabsTrigger value="style">Стиль</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройка хэдера</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Заголовок</Label>
                <Input
                  value={content.header?.title || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      header: { ...content.header, title: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Подзаголовок</Label>
                <Textarea
                  value={content.header?.subtitle || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      header: { ...content.header, subtitle: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>URL фонового изображения</Label>
                <Input
                  value={content.header?.backgroundImage || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      header: { ...content.header, backgroundImage: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Цвет фона</Label>
                  <Input
                    type="color"
                    value={content.header?.backgroundColor || "#6366f1"}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        header: { ...content.header, backgroundColor: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Цвет текста</Label>
                  <Input
                    type="color"
                    value={content.header?.textColor || "#ffffff"}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        header: { ...content.header, textColor: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Высота (px)</Label>
                <Input
                  value={content.header?.height || "400px"}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      header: { ...content.header, height: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Добавить блок</CardTitle>
              <CardDescription>Выберите тип блока для добавления</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => addBlock("text")} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Текст
              </Button>
              <Button onClick={() => addBlock("image")} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Изображение
              </Button>
              <Button onClick={() => addBlock("info-card")} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Инфо-карта
              </Button>
              <Button onClick={() => addBlock("gallery")} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Галерея
              </Button>
              <Button onClick={() => addBlock("two-column")} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> 2 колонки
              </Button>
              <Button onClick={() => addBlock("three-column")} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> 3 колонки
              </Button>
              <Button onClick={() => addBlock("table")} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Таблица
              </Button>
              <Button onClick={() => addBlock("anchor")} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Анкор
              </Button>
              <Button onClick={() => addBlock("place-link")} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Ссылка на место
              </Button>
            </CardContent>
          </Card>

          {(content.blocks || []).map((block: Block, index: number) => (
            <Card key={block.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {block.type.charAt(0).toUpperCase() + block.type.slice(1).replace("-", " ")}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveBlock(block.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveBlock(block.id, "down")}
                      disabled={index === (content.blocks?.length || 0) - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteBlock(block.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {block.type === "text" && (
                  <Textarea
                    value={block.content.html || ""}
                    onChange={(e) =>
                      updateBlock(block.id, {
                        content: { ...block.content, html: e.target.value },
                      })
                    }
                    rows={6}
                  />
                )}

                {block.type === "image" && (
                  <>
                    <div>
                      <Label>URL изображения</Label>
                      <Input
                        value={block.content.url || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, url: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Alt текст</Label>
                      <Input
                        value={block.content.alt || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, alt: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Подпись</Label>
                      <Input
                        value={block.content.caption || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, caption: e.target.value },
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {block.type === "anchor" && (
                  <>
                    <div>
                      <Label>ID анкора (для навигации)</Label>
                      <Input
                        value={block.content.anchorId || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, anchorId: e.target.value },
                          })
                        }
                        placeholder="section-1"
                      />
                    </div>
                    <div>
                      <Label>Название в навигации</Label>
                      <Input
                        value={block.content.anchorLabel || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, anchorLabel: e.target.value },
                          })
                        }
                        placeholder="Раздел 1"
                      />
                    </div>
                  </>
                )}

                {block.type === "place-link" && (
                  <>
                    <div>
                      <Label>Выберите место</Label>
                      <Select
                        value={block.content.placeId || ""}
                        onValueChange={(value) =>
                          updateBlock(block.id, {
                            content: { ...block.content, placeId: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите место из тура" />
                        </SelectTrigger>
                        <SelectContent>
                          {tourPlaces.map((place) => (
                            <SelectItem key={place.place_id} value={place.place_id}>
                              {place.place_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Текст кнопки</Label>
                      <Input
                        value={block.content.linkText || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, linkText: e.target.value },
                          })
                        }
                        placeholder="Показать на карте"
                      />
                    </div>
                  </>
                )}

                {block.type === "table" && (
                  <div>
                    <Label>HTML таблицы</Label>
                    <Textarea
                      value={block.content.html || ""}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          content: { ...block.content, html: e.target.value },
                        })
                      }
                      rows={8}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Стиль страницы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Цвет фона страницы</Label>
                <Input
                  type="color"
                  value={content.pageStyle?.backgroundColor || "#ffffff"}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pageStyle: { ...content.pageStyle, backgroundColor: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Максимальная ширина контента</Label>
                <Input
                  value={content.pageStyle?.maxWidth || "1200px"}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pageStyle: { ...content.pageStyle, maxWidth: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Сохранение..." : "Сохранить путеводитель"}
      </Button>
    </div>
  );
};
