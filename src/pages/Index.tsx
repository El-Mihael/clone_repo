import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Crown, Smartphone, Globe, Sparkles, TrendingUp, Zap, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Retro Grid Background */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(hsl(220 100% 66%) 2px, transparent 2px),
          linear-gradient(90deg, hsl(220 100% 66%) 2px, transparent 2px)
        `,
        backgroundSize: '40px 40px'
      }} />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
            {/* Pixel Badge */}
            <div className="mb-8 inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 border-2 border-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-pixel-float">
              <Sparkles className="h-4 w-4 animate-blink" />
              <span className="font-bold text-sm uppercase">NEW GAME+</span>
            </div>
            
            {/* Main Title */}
            <h1 className="mb-6 text-3xl md:text-5xl lg:text-6xl font-bold retro-text-shadow leading-tight">
              {t("heroTitle").split(" ").slice(0, 1).join(" ")} <br />
              <span className="text-primary retro-glow animate-blink">
                {t("heroTitle").split(" ").slice(1).join(" ")}
              </span>
            </h1>
            
            <p className="mb-8 text-lg md:text-xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
              {t("heroSubtitle")}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center items-center">
              <Button 
                size="lg" 
                variant="default"
                onClick={() => navigate("/map")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {t("startGame")}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")}
              >
                <Star className="mr-2 h-4 w-4" />
                {t("joinNow")}
              </Button>
            </div>

            {/* Pixel Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-xl mx-auto">
              {[
                { value: "500+", label: t("placesCount2") },
                { value: "50+", label: t("toursCount") },
                { value: "1000+", label: t("playersCount") },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="bg-card border-2 border-border p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="text-xl md:text-2xl font-bold text-primary retro-glow">{stat.value}</div>
                  <div className="text-sm text-muted-foreground uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 relative">
        <div className="container mx-auto px-4">
          {/* Section Title */}
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl md:text-4xl font-bold retro-text-shadow uppercase">
              GAME <span className="text-premium retro-glow">{t("gameFeatures")}</span>
            </h2>
            <div className="h-1 w-24 mx-auto bg-primary" />
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                icon: MapPin,
                title: "КАРТА",
                description: "Интерактивная карта с сотнями мест",
                color: "primary",
                bgColor: "bg-primary/20",
              },
              {
                icon: Crown,
                title: "ПРЕМИУМ",
                description: "Эксклюзивные локации и контент",
                color: "premium",
                bgColor: "bg-premium/20",
              },
              {
                icon: Globe,
                title: "ТУРЫ",
                description: "Готовые маршруты по городу",
                color: "accent",
                bgColor: "bg-accent/20",
              },
              {
                icon: Smartphone,
                title: "МОБИЛЬНАЯ",
                description: "Играй на ходу с телефона",
                color: "secondary",
                bgColor: "bg-secondary/20",
              },
              {
                icon: TrendingUp,
                title: "БИЗНЕС",
                description: "Размести свою точку на карте",
                color: "accent",
                bgColor: "bg-accent/20",
              },
              {
                icon: Zap,
                title: "БЫСТРО",
                description: "Молниеносная работа системы",
                color: "primary",
                bgColor: "bg-primary/20",
              },
            ].map((feature, i) => (
              <Card 
                key={i} 
                className="group relative p-4 bg-card border-2 border-border hover:border-primary transition-all hover:-translate-y-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-fade-in overflow-hidden"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Icon */}
                <div className={`mb-3 inline-flex ${feature.bgColor} p-2 border-2 border-current`}>
                  <feature.icon className={`h-5 w-5 text-${feature.color}`} />
                </div>
                
                {/* Content */}
                <h3 className="mb-2 text-base font-bold uppercase retro-text-shadow">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                
                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-2 h-2 bg-primary" />
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-accent" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 relative">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden border-2 border-premium bg-premium/10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-4xl mx-auto">
            {/* Animated Border Effect */}
            <div className="absolute inset-0 border-2 border-premium animate-blink" />
            
            <div className="relative p-6 md:p-10 text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 bg-premium text-premium-foreground px-3 py-1 border-2 border-premium shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-pixel-float">
                <Crown className="h-4 w-4 animate-blink" />
                <span className="font-bold text-sm uppercase">PREMIUM ACCESS</span>
              </div>
              
              {/* Title */}
              <h2 className="mb-4 text-2xl md:text-4xl font-bold retro-text-shadow uppercase">
                ГОТОВ К ПРИКЛЮЧЕНИЯМ?
              </h2>
              
              {/* Description */}
              <p className="mb-8 text-lg md:text-xl text-foreground/80 max-w-xl mx-auto leading-relaxed">
                ПРИСОЕДИНЯЙСЯ К ТЫСЯЧАМ ИГРОКОВ УЖЕ СЕГОДНЯ
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button 
                  size="lg" 
                  variant="premium"
                  onClick={() => navigate("/auth")}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  GET PREMIUM
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/map")}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  TRY FREE
                </Button>
              </div>

              {/* Pixel Coins Animation */}
              <div className="mt-8 flex justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-4 h-4 bg-premium border-2 border-premium-foreground animate-pixel-float"
                    style={{ 
                      animationDelay: `${i * 0.2}s`,
                      clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)'
                    }}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border py-4 relative bg-card">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground uppercase">
            © 2024 • RETRO CITY MAP • ALL RIGHTS RESERVED
          </p>
          <div className="mt-2 flex justify-center gap-2">
            <div className="w-2 h-2 bg-primary animate-blink" />
            <div className="w-2 h-2 bg-accent animate-blink" style={{ animationDelay: '0.3s' }} />
            <div className="w-2 h-2 bg-premium animate-blink" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
