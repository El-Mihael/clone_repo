import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { PlacesTab } from "@/components/admin/PlacesTab";
import { ToursTab } from "@/components/admin/ToursTab";
import { NotificationsTab } from "@/components/admin/NotificationsTab";
import { CountriesTab } from "@/components/admin/CountriesTab";
import { CitiesTab } from "@/components/admin/CitiesTab";
import { CreditsTab } from "@/components/admin/CreditsTab";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

import { useLanguage } from "@/lib/i18n/LanguageContext";

const Admin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      toast.error(t("noAdminRights"));
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("backToMap")}
              </Button>
              <h1 className="text-2xl font-bold">{t("adminPanel")}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full max-w-5xl grid-cols-7">
            <TabsTrigger value="countries">{t("countries")}</TabsTrigger>
            <TabsTrigger value="cities">{t("cities")}</TabsTrigger>
            <TabsTrigger value="categories">{t("categories")}</TabsTrigger>
            <TabsTrigger value="places">{t("places")}</TabsTrigger>
            <TabsTrigger value="tours">{t("tours")}</TabsTrigger>
            <TabsTrigger value="credits">{t("credits")}</TabsTrigger>
            <TabsTrigger value="notifications">{t("notifications")}</TabsTrigger>
          </TabsList>

          <TabsContent value="countries" className="space-y-4">
            <CountriesTab />
          </TabsContent>

          <TabsContent value="cities" className="space-y-4">
            <CitiesTab />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoriesTab />
          </TabsContent>

          <TabsContent value="places" className="space-y-4">
            <PlacesTab />
          </TabsContent>

          <TabsContent value="tours" className="space-y-4">
            <ToursTab />
          </TabsContent>

          <TabsContent value="credits" className="space-y-4">
            <CreditsTab />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
