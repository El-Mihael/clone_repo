import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Lock } from "lucide-react";
import { SharePlaceButton } from "@/components/map/SharePlaceButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Database } from "@/integrations/supabase/types";
import DOMPurify from "dompurify";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Place = Database["public"]["Tables"]["places"]["Row"];

interface PlacePageProps {
  place: Place;
  onBack: () => void;
  isAdmin?: boolean;
}

interface PageContent {
  header?: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    backgroundColor?: string;
    textColor?: string;
    height?: string;
  };
  blocks?: Array<{
    id: string;
    type: "text" | "image" | "info-card" | "gallery" | "two-column";
    content: any;
    style?: any;
    order: number;
  }>;
  pageStyle?: {
    backgroundColor?: string;
    fontFamily?: string;
    maxWidth?: string;
  };
}

export const PlacePage = ({ place, onBack, isAdmin = false }: PlacePageProps) => {
  const { t } = useLanguage();
  
  // Проверка доступа: кастомная страница доступна только для премиум-мест (или админам)
  const hasAccess = isAdmin || (place.is_premium && place.has_custom_page);
  
  const content = (place.custom_page_content as PageContent) || {};
  const { header, blocks = [], pageStyle = {} } = content;

  // Sanitize HTML content to prevent XSS attacks
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  };

  // Если нет доступа, показываем сообщение
  if (!hasAccess) {
    return (
      <div 
        className="h-full overflow-y-auto"
        style={{
          backgroundColor: pageStyle.backgroundColor || "hsl(var(--background))",
        }}
      >
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToMap")}
            </Button>
            <SharePlaceButton place={place} variant="ghost" size="sm" />
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <Alert className="max-w-md">
            <Lock className="h-6 w-6" />
            <AlertDescription className="mt-2">
              <h3 className="font-semibold text-lg mb-2">{t("customPageAccessRestricted")}</h3>
              <p className="text-muted-foreground">
                {t("customPageAccessDenied")}
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full overflow-y-auto"
      style={{
        backgroundColor: pageStyle.backgroundColor || "hsl(var(--background))",
        fontFamily: pageStyle.fontFamily || "inherit",
      }}
    >
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToMap")}
          </Button>
          <SharePlaceButton place={place} variant="ghost" size="sm" />
        </div>
      </div>

      {/* Header Section */}
      {header && (
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: header.backgroundColor || "hsl(var(--primary))",
            backgroundImage: header.backgroundImage ? `url(${header.backgroundImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: header.textColor || "white",
            height: header.height || "400px",
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl md:text-6xl font-bold">
                {header.title || place.name}
              </h1>
              {place.is_premium && (
                <Crown className="w-8 h-8 text-premium" />
              )}
            </div>
            {header.subtitle && (
              <p className="text-xl md:text-2xl opacity-90 max-w-2xl">
                {header.subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content Blocks */}
      <div 
        className="container mx-auto px-4 py-8"
        style={{
          maxWidth: pageStyle.maxWidth || "1200px",
        }}
      >
        {blocks
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <div
              key={block.id}
              className="mb-8"
              style={block.style}
            >
              {block.type === "text" && (
                <div
                  className="prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.html || "") }}
                />
              )}

              {block.type === "image" && (
                <div className="relative">
                  <img
                    src={block.content.url}
                    alt={block.content.alt || ""}
                    className="w-full rounded-lg shadow-lg"
                    style={{
                      maxHeight: block.content.maxHeight || "600px",
                      objectFit: block.content.objectFit || "cover",
                    }}
                  />
                  {block.content.caption && (
                    <p className="text-center text-sm text-muted-foreground mt-2">
                      {block.content.caption}
                    </p>
                  )}
                </div>
              )}

              {block.type === "info-card" && (
                <div 
                  className="rounded-lg p-6 shadow-md"
                  style={{
                    backgroundColor: block.content.backgroundColor || "hsl(var(--card))",
                    borderLeft: `4px solid ${block.content.accentColor || "hsl(var(--primary))"}`,
                  }}
                >
                  {block.content.title && (
                    <h3 className="text-2xl font-bold mb-3" style={{ color: block.content.titleColor }}>
                      {block.content.title}
                    </h3>
                  )}
                  {block.content.text && (
                    <div
                      className="prose max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.text) }}
                    />
                  )}
                </div>
              )}

              {block.type === "gallery" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(block.content.images || []).map((img: any, idx: number) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={img.alt || ""}
                      className="w-full h-64 object-cover rounded-lg shadow-md hover:scale-105 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              )}

              {block.type === "two-column" && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div
                    className="prose max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.leftColumn || "") }}
                  />
                  <div
                    className="prose max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.rightColumn || "") }}
                  />
                </div>
              )}
            </div>
          ))}

        {/* Default content if no blocks */}
        {blocks.length === 0 && (
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <h2>{place.name}</h2>
            {place.description && <p>{place.description}</p>}
            {place.address && (
              <p className="text-muted-foreground">
                <strong>Адрес:</strong> {place.address}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
