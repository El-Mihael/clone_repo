import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Coins, LogOut, MapPin, ShoppingCart, History, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlacesManager } from "@/components/account/UserPlacesManager";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: "individual" | "business";
  credits: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface Place {
  id: string;
  name: string;
  is_premium: boolean;
  premium_expires_at: string | null;
  created_at: string;
}

interface PurchasedTour {
  id: string;
  tour_id: string;
  purchased_at: string;
  tours: {
    name: string;
    name_en: string | null;
    description: string | null;
  };
}

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [purchasedTours, setPurchasedTours] = useState<PurchasedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextBillingTotal, setNextBillingTotal] = useState<number>(0);
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [billingBreakdown, setBillingBreakdown] = useState<{ place: number; premium: number }>({ place: 0, premium: 0 });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    await fetchData(session.user.id);
  };

  const fetchData = async (userId: string) => {
    await fetchProfile(userId);
    await fetchTransactions(userId);
    await fetchPlaces(userId);
    await fetchPurchasedTours(userId);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      toast({
        title: t("error"),
        description: t("failedToLoadProfile"),
        variant: "destructive",
      });
      return;
    }

    setProfile(data);
    setLoading(false);
  };

  const fetchTransactions = async (userId: string) => {
    const { data } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setTransactions(data);
  };

  const fetchPlaces = async (userId: string) => {
    const { data } = await supabase
      .from("places")
      .select("id, name, is_premium, premium_expires_at, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setPlaces(data);
      
      // Calculate next billing
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          subscription_plans (
            price,
            billing_period
          ),
          places!inner (
            is_premium
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true);

      if (subscriptions && subscriptions.length > 0) {
        let totalPlace = 0;
        let totalPremium = 0;
        let earliestDate: Date | null = null;

        subscriptions.forEach((sub: any) => {
          const plan = sub.subscription_plans;
          const place = sub.places;
          
          totalPlace += plan.price;
          if (place?.is_premium) {
            totalPremium += 8;
          }

          const subDate = new Date(sub.next_billing_date);
          if (!earliestDate || subDate < earliestDate) {
            earliestDate = subDate;
          }
        });

        setNextBillingTotal(totalPlace + totalPremium);
        setBillingBreakdown({ place: totalPlace, premium: totalPremium });
        setNextBillingDate(earliestDate ? earliestDate.toISOString() : null);
      }
    }
  };

  const fetchPurchasedTours = async (userId: string) => {
    const { data } = await supabase
      .from("purchased_tours")
      .select("id, tour_id, purchased_at, tours(name, name_en, description)")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false });

    if (data) setPurchasedTours(data as PurchasedTour[]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">{t("loading")}</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("personalAccount")}</h1>
            <p className="text-muted-foreground mt-1">{profile.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              <MapPin className="w-4 h-4 mr-2" />
              {t("map")}
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              {t("signOut")}
            </Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              {t("balance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{profile.credits} {t("credits")}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {t("topUpComingSoon")}
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              {t("transactionHistory")}
            </TabsTrigger>
            <TabsTrigger value="tours">
              <ShoppingCart className="w-4 h-4 mr-2" />
              {language === "sr" ? "Моје туре" : language === "ru" ? "Мои туры" : "My Tours"}
            </TabsTrigger>
            {profile.user_type === "business" && (
              <TabsTrigger value="places">
                <MapPin className="w-4 h-4 mr-2" />
                {t("myPlaces")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>{t("transactionHistory")}</CardTitle>
                <CardDescription>
                  {t("recentTransactions")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t("noTransactions")}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("date")}</TableHead>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead className="text-right">{t("amount")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{transaction.description || transaction.type}</TableCell>
                          <TableCell className="text-right">
                            <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                              {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tours">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "sr" ? "Моје туре" : language === "ru" ? "Мои туры" : "My Tours"}
                </CardTitle>
                <CardDescription>
                  {language === "sr" ? "Туре које сте купили" : language === "ru" ? "Туры которые вы купили" : "Tours you have purchased"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchasedTours.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {language === "sr" ? "Још увек нисте купили ниједну туру" : language === "ru" ? "Вы еще не купили ни один тур" : "You haven't purchased any tours yet"}
                    </p>
                    <Button onClick={() => navigate("/tours")}>
                      {language === "sr" ? "Прегледај туре" : language === "ru" ? "Просмотреть туры" : "Browse Tours"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchasedTours.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="w-5 h-5" />
                          <div>
                            <div className="font-medium">
                              {language === "en" && purchase.tours.name_en 
                                ? purchase.tours.name_en 
                                : purchase.tours.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(purchase.purchased_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {language === "sr" ? "Купљено" : language === "ru" ? "Куплено" : "Owned"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {profile.user_type === "business" && (
            <TabsContent value="places">
              <UserPlacesManager
                places={places}
                credits={profile.credits}
                onRefresh={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) {
                    await fetchData(session.user.id);
                  }
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Account;