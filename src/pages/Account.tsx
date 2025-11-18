import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Coins, LogOut, MapPin, Crown, ShoppingCart, History } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  created_at: string;
}

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
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

    await fetchProfile(session.user.id);
    await fetchTransactions(session.user.id);
    await fetchPlaces(session.user.id);
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
      .select("id, name, is_premium, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (data) setPlaces(data);
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

          {profile.user_type === "business" && (
            <TabsContent value="places">
              <Card>
                <CardHeader>
                  <CardTitle>{t("myPlaces")}</CardTitle>
                  <CardDescription>
                    {t("managePlaces")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {places.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {t("noPlacesYet")}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {places.map((place) => (
                        <div key={place.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5" />
                            <div>
                              <div className="font-medium">{place.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(place.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          {place.is_premium && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Premium
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Account;