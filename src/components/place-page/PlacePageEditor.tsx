import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, MoveUp, MoveDown, Image, Type, LayoutGrid, Columns, Info, Crown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Place = Database["public"]["Tables"]["places"]["Row"];

interface PlacePageEditorProps {
  place: Place;
  onSave: () => void;
}

interface Block {
  id: string;
  type: "text" | "image" | "info-card" | "gallery" | "two-column";
  content: any;
  style?: any;
  order: number;
}

export const PlacePageEditor = ({ place, onSave }: PlacePageEditorProps) => {
  const [content, setContent] = useState<any>({
    header: {},
    blocks: [],
    pageStyle: {},
  });
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    // Load existing content when place changes
    if (place.custom_page_content) {
      setContent(place.custom_page_content);
    } else {
      setContent({
        header: {},
        blocks: [],
        pageStyle: {},
      });
    }
  }, [place.id, place.custom_page_content]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const addBlock = (type: Block["type"]) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content: getDefaultContent(type),
      order: content.blocks?.length || 0,
    };

    setContent({
      ...content,
      blocks: [...(content.blocks || []), newBlock],
    });
  };

  const getDefaultContent = (type: Block["type"]) => {
    switch (type) {
      case "text":
        return { html: "<p>Введите текст...</p>" };
      case "image":
        return { url: "", alt: "", caption: "" };
      case "info-card":
        return { title: "", text: "", backgroundColor: "#f3f4f6", accentColor: "#3b82f6" };
      case "gallery":
        return { images: [] };
      case "two-column":
        return { leftColumn: "<p>Левая колонка</p>", rightColumn: "<p>Правая колонка</p>" };
      default:
        return {};
    }
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setContent({
      ...content,
      blocks: content.blocks?.map((b: Block) =>
        b.id === blockId ? { ...b, ...updates } : b
      ),
    });
  };

  const deleteBlock = (blockId: string) => {
    setContent({
      ...content,
      blocks: content.blocks?.filter((b: Block) => b.id !== blockId),
    });
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const blocks = [...(content.blocks || [])];
    const index = blocks.findIndex((b) => b.id === blockId);
    
    if (direction === "up" && index > 0) {
      [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
    } else if (direction === "down" && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
    }

    blocks.forEach((b, i) => (b.order = i));
    setContent({ ...content, blocks });
  };

  const handleSave = async () => {
    // Check if place is premium or user is admin
    if (!place.is_premium && !isAdmin) {
      toast.error("Кастомные страницы доступны только для премиум-мест");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("places")
        .update({
          has_custom_page: true,
          custom_page_content: content,
        })
        .eq("id", place.id);

      if (error) throw error;

      toast.success("Страница сохранена");
      onSave();
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("Ошибка сохранения страницы");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!place.is_premium && !isAdmin && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Кастомные страницы доступны только для премиум-мест. Активируйте премиум-статус, чтобы сохранить изменения.
          </AlertDescription>
        </Alert>
      )}
      
      {!place.is_premium && isAdmin && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            Это место не имеет премиум-статуса. Вы можете редактировать страницу как администратор, 
            но владелец не сможет изменять её без активации премиум.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="header">Хедер</TabsTrigger>
          <TabsTrigger value="blocks">Контент</TabsTrigger>
          <TabsTrigger value="style">Стили</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
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
                  placeholder={place.name}
                />
              </div>
              <div>
                <Label>Подзаголовок</Label>
                <Input
                  value={content.header?.subtitle || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      header: { ...content.header, subtitle: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Фоновое изображение (URL)</Label>
                  <Input
                    value={content.header?.backgroundImage || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        header: { ...content.header, backgroundImage: e.target.value },
                      })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Цвет фона</Label>
                  <Input
                    type="color"
                    value={content.header?.backgroundColor || "#3b82f6"}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        header: { ...content.header, backgroundColor: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => addBlock("text")} className="gap-2">
              <Type className="w-4 h-4" /> Текст
            </Button>
            <Button size="sm" onClick={() => addBlock("image")} className="gap-2">
              <Image className="w-4 h-4" /> Изображение
            </Button>
            <Button size="sm" onClick={() => addBlock("info-card")} className="gap-2">
              <Info className="w-4 h-4" /> Инфо-карта
            </Button>
            <Button size="sm" onClick={() => addBlock("gallery")} className="gap-2">
              <LayoutGrid className="w-4 h-4" /> Галерея
            </Button>
            <Button size="sm" onClick={() => addBlock("two-column")} className="gap-2">
              <Columns className="w-4 h-4" /> Две колонки
            </Button>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {content.blocks?.map((block: Block, index: number) => (
                <Card key={block.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold capitalize">{block.type}</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveBlock(block.id, "up")}
                        disabled={index === 0}
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveBlock(block.id, "down")}
                        disabled={index === content.blocks.length - 1}
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteBlock(block.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {block.type === "text" && (
                    <Textarea
                      value={block.content.html || ""}
                      onChange={(e) =>
                        updateBlock(block.id, {
                          content: { ...block.content, html: e.target.value },
                        })
                      }
                      rows={5}
                      placeholder="HTML или текст..."
                    />
                  )}

                  {block.type === "image" && (
                    <div className="space-y-3">
                      <Input
                        value={block.content.url || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, url: e.target.value },
                          })
                        }
                        placeholder="URL изображения"
                      />
                      <Input
                        value={block.content.alt || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, alt: e.target.value },
                          })
                        }
                        placeholder="Описание"
                      />
                      <Input
                        value={block.content.caption || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, caption: e.target.value },
                          })
                        }
                        placeholder="Подпись"
                      />
                    </div>
                  )}

                  {block.type === "info-card" && (
                    <div className="space-y-3">
                      <Input
                        value={block.content.title || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, title: e.target.value },
                          })
                        }
                        placeholder="Заголовок"
                      />
                      <Textarea
                        value={block.content.text || ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            content: { ...block.content, text: e.target.value },
                          })
                        }
                        rows={3}
                        placeholder="Текст"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Цвет фона</Label>
                          <Input
                            type="color"
                            value={block.content.backgroundColor || "#f3f4f6"}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                content: { ...block.content, backgroundColor: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Цвет акцента</Label>
                          <Input
                            type="color"
                            value={block.content.accentColor || "#3b82f6"}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                content: { ...block.content, accentColor: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {block.type === "gallery" && (
                    <div className="space-y-2">
                      <Label className="text-xs">URLs изображений (по одному на строку)</Label>
                      <Textarea
                        value={(block.content.images || []).map((img: any) => img.url).join("\n")}
                        onChange={(e) => {
                          const urls = e.target.value.split("\n").filter(Boolean);
                          updateBlock(block.id, {
                            content: {
                              images: urls.map((url) => ({ url, alt: "" })),
                            },
                          });
                        }}
                        rows={5}
                        placeholder="https://image1.jpg&#10;https://image2.jpg"
                      />
                    </div>
                  )}

                  {block.type === "two-column" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Левая колонка</Label>
                        <Textarea
                          value={block.content.leftColumn || ""}
                          onChange={(e) =>
                            updateBlock(block.id, {
                              content: { ...block.content, leftColumn: e.target.value },
                            })
                          }
                          rows={5}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Правая колонка</Label>
                        <Textarea
                          value={block.content.rightColumn || ""}
                          onChange={(e) =>
                            updateBlock(block.id, {
                              content: { ...block.content, rightColumn: e.target.value },
                            })
                          }
                          rows={5}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
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
                <Label>Шрифт</Label>
                <Input
                  value={content.pageStyle?.fontFamily || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pageStyle: { ...content.pageStyle, fontFamily: e.target.value },
                    })
                  }
                  placeholder="Arial, sans-serif"
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
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить страницу"}
        </Button>
      </div>
    </div>
  );
};
