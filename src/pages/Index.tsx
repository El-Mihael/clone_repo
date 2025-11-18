import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Crown, Smartphone, Globe, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary animate-float">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Откройте свой город заново</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Интерактивные карты <br />
              <span className="gradient-primary-vibrant bg-clip-text text-transparent">
                вашего города
              </span>
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:text-2xl">
              Находите лучшие места, создавайте маршруты и делитесь впечатлениями
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button 
                size="lg" 
                variant="gradient"
                className="text-lg"
                onClick={() => navigate("/map")}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Открыть карту
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg hover:border-primary/50"
                onClick={() => navigate("/auth")}
              >
                Начать бесплатно
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center animate-fade-in">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
              Всё что нужно для <span className="gradient-premium bg-clip-text text-transparent">идеального</span> путешествия
            </h2>
            <p className="text-lg text-muted-foreground">
              Удобные инструменты для исследования города
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Интерактивная карта",
                description: "Красивая и удобная карта с сотнями интересных мест",
                color: "text-primary",
                gradient: "from-primary/20 to-primary/5",
              },
              {
                icon: Crown,
                title: "Премиум места",
                description: "Эксклюзивные локации с подробными описаниями",
                color: "text-premium",
                gradient: "from-premium/20 to-premium/5",
              },
              {
                icon: Globe,
                title: "Готовые туры",
                description: "Тщательно продуманные маршруты по городу",
                color: "text-accent",
                gradient: "from-accent/20 to-accent/5",
              },
              {
                icon: Smartphone,
                title: "Мобильная версия",
                description: "Используйте на телефоне во время прогулки",
                color: "text-primary",
                gradient: "from-primary/20 to-primary/5",
              },
              {
                icon: TrendingUp,
                title: "Для бизнеса",
                description: "Разместите свою точку и привлекайте клиентов",
                color: "text-accent",
                gradient: "from-accent/20 to-accent/5",
              },
              {
                icon: Sparkles,
                title: "Всегда актуально",
                description: "Регулярные обновления и новые места",
                color: "text-premium",
                gradient: "from-premium/20 to-premium/5",
              },
            ].map((feature, i) => (
              <Card 
                key={i} 
                className="group p-6 transition-all hover:shadow-card-hover hover:-translate-y-1 animate-fade-in border-border/50"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${feature.gradient} p-3`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden border-none shadow-card-hover">
            <div className="absolute inset-0 gradient-premium-vibrant opacity-10" />
            <div className="relative p-8 text-center md:p-16">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-premium/10 px-4 py-2 text-sm text-premium">
                <Crown className="h-4 w-4" />
                <span className="font-medium">Премиум доступ</span>
              </div>
              
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
                Готовы исследовать город?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Присоединяйтесь к тысячам пользователей уже сегодня
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button 
                  size="lg" 
                  variant="premium"
                  className="text-lg"
                  onClick={() => navigate("/auth")}
                >
                  <Crown className="mr-2 h-5 w-5" />
                  Получить премиум
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg"
                  onClick={() => navigate("/map")}
                >
                  Попробовать бесплатно
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Интерактивная карта. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
