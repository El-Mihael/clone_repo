import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import DOMPurify from "dompurify";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Tour = Database["public"]["Tables"]["tours"]["Row"];

interface TourGuidePageProps {
  tour: Tour;
  onBack: () => void;
  onNavigateToPlace?: (placeId: string) => void;
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
  blocks?: Array<{
    id: string;
    type: "text" | "image" | "info-card" | "gallery" | "two-column" | "three-column" | "table" | "anchor" | "place-link";
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

export const TourGuidePage = ({ tour, onBack, onNavigateToPlace }: TourGuidePageProps) => {
  const { language } = useLanguage();
  const content = (tour.guide_content as GuideContent) || {};
  const { header, blocks = [], pageStyle = {} } = content;
  const [activeAnchor, setActiveAnchor] = useState<string>("");

  // Get tour name based on language
  const getTourName = () => {
    if (language === "en" && tour.name_en) return tour.name_en;
    if (language === "sr" && tour.name_sr) return tour.name_sr;
    return tour.name;
  };

  // Sanitize HTML content
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  };

  // Get all anchors from blocks
  const anchors = blocks
    .filter(block => block.type === "anchor" && block.content.anchorId)
    .map(block => ({
      id: block.content.anchorId,
      label: block.content.anchorLabel || block.content.anchorId,
    }));

  // Scroll to anchor
  const scrollToAnchor = (anchorId: string) => {
    const element = document.getElementById(`anchor-${anchorId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveAnchor(anchorId);
    }
  };

  // Track scroll position for active anchor
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const anchor of anchors) {
        const element = document.getElementById(`anchor-${anchor.id}`);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveAnchor(anchor.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [anchors]);

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
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к карте
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sticky Navigation */}
        {anchors.length > 0 && (
          <aside className="hidden lg:block w-64 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-6">
            <nav className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground mb-4">Навигация</h3>
              {anchors.map((anchor) => (
                <button
                  key={anchor.id}
                  onClick={() => scrollToAnchor(anchor.id)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeAnchor === anchor.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {anchor.label}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1">
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
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  {header.title || getTourName()}
                </h1>
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
                  id={block.type === "anchor" ? `anchor-${block.content.anchorId}` : undefined}
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

                  {block.type === "three-column" && (
                    <div className="grid md:grid-cols-3 gap-6">
                      <div
                        className="prose max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.leftColumn || "") }}
                      />
                      <div
                        className="prose max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.middleColumn || "") }}
                      />
                      <div
                        className="prose max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.rightColumn || "") }}
                      />
                    </div>
                  )}

                  {block.type === "table" && (
                    <div className="overflow-x-auto">
                      <div
                        className="prose max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content.html || "") }}
                      />
                    </div>
                  )}

                  {block.type === "anchor" && (
                    <div className="border-t pt-8">
                      <h2 className="text-3xl font-bold mb-4">{block.content.anchorLabel}</h2>
                    </div>
                  )}

                  {block.type === "place-link" && onNavigateToPlace && (
                    <Button
                      onClick={() => onNavigateToPlace(block.content.placeId)}
                      className="gap-2"
                      variant="outline"
                    >
                      <MapPin className="w-4 h-4" />
                      {block.content.linkText || "Показать на карте"}
                    </Button>
                  )}
                </div>
              ))}

            {/* Default content if no blocks */}
            {blocks.length === 0 && (
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <h2>{getTourName()}</h2>
                {tour.description && <p>{tour.description}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
