import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, TrendingUp, Users, History } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlaceShareStats {
  place_id: string;
  place_name: string;
  place_owner_name: string | null;
  total_shares: number;
  whatsapp: number;
  telegram: number;
  facebook: number;
  link: number;
  native: number;
}

interface UserShareStats {
  user_id: string;
  user_name: string;
  user_email: string;
  total_shares: number;
}

interface ShareDetail {
  id: string;
  place_name: string;
  user_name: string | null;
  user_email: string | null;
  platform: string;
  shared_at: string;
}

export const StatisticsTab = () => {
  const { t } = useLanguage();
  const [placeStats, setPlaceStats] = useState<PlaceShareStats[]>([]);
  const [userStats, setUserStats] = useState<UserShareStats[]>([]);
  const [shareDetails, setShareDetails] = useState<ShareDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalShares, setTotalShares] = useState(0);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Get all share statistics with place and user details
      const { data: shareData, error } = await supabase
        .from("share_statistics")
        .select(`
          id,
          place_id,
          platform,
          user_id,
          shared_at,
          places(name, owner_id),
          profiles:user_id(full_name, email)
        `)
        .order("shared_at", { ascending: false });

      if (error) throw error;

      // Process data for place statistics
      const placeStatsMap = new Map<string, PlaceShareStats>();
      const userStatsMap = new Map<string, UserShareStats>();
      const details: ShareDetail[] = [];
      let total = 0;

      for (const item of shareData || []) {
        const placeId = item.place_id;
        const placeName = item.places?.name || "Unknown";
        const platform = item.platform;
        const userId = item.user_id;
        
        // Get owner details if place has owner
        let ownerName: string | null = null;
        if (item.places?.owner_id) {
          const { data: ownerData } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", item.places.owner_id)
            .single();
          ownerName = ownerData?.full_name || ownerData?.email || null;
        }

        // Place statistics
        if (!placeStatsMap.has(placeId)) {
          placeStatsMap.set(placeId, {
            place_id: placeId,
            place_name: placeName,
            place_owner_name: ownerName,
            total_shares: 0,
            whatsapp: 0,
            telegram: 0,
            facebook: 0,
            link: 0,
            native: 0,
          });
        }

        const placeStatsItem = placeStatsMap.get(placeId)!;
        placeStatsItem.total_shares++;
        total++;

        if (platform === "whatsapp") placeStatsItem.whatsapp++;
        else if (platform === "telegram") placeStatsItem.telegram++;
        else if (platform === "facebook") placeStatsItem.facebook++;
        else if (platform === "link") placeStatsItem.link++;
        else if (platform === "native") placeStatsItem.native++;

        // User statistics
        if (userId) {
          if (!userStatsMap.has(userId)) {
            const profile = item.profiles as any;
            userStatsMap.set(userId, {
              user_id: userId,
              user_name: profile?.full_name || profile?.email || "Unknown",
              user_email: profile?.email || "",
              total_shares: 0,
            });
          }
          userStatsMap.get(userId)!.total_shares++;
        }

        // Share details
        const profile = item.profiles as any;
        details.push({
          id: item.id,
          place_name: placeName,
          user_name: profile?.full_name || null,
          user_email: profile?.email || null,
          platform: platform,
          shared_at: item.shared_at,
        });
      }

      setPlaceStats(
        Array.from(placeStatsMap.values()).sort((a, b) => b.total_shares - a.total_shares)
      );
      setUserStats(
        Array.from(userStatsMap.values()).sort((a, b) => b.total_shares - a.total_shares)
      );
      setShareDetails(details);
      setTotalShares(total);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      whatsapp: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      telegram: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      facebook: "bg-blue-600/10 text-blue-800 dark:text-blue-300 border-blue-600/20",
      link: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
      native: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    };
    return (
      <Badge variant="outline" className={colors[platform] || ""}>
        {platform === "native" ? "Mobile" : platform}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего поделились</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares}</div>
            <p className="text-xs text-muted-foreground">
              Общее количество шерингов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Популярных мест</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{placeStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Мест с шерингами
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Пользователей делились
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="places" className="space-y-4">
        <TabsList>
          <TabsTrigger value="places">По местам</TabsTrigger>
          <TabsTrigger value="users">По пользователям</TabsTrigger>
          <TabsTrigger value="details">Детали</TabsTrigger>
        </TabsList>

        <TabsContent value="places" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика шерингов по местам</CardTitle>
              <CardDescription>
                Самые популярные места по количеству поделившихся
              </CardDescription>
            </CardHeader>
            <CardContent>
              {placeStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет данных о шерингах
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Место</TableHead>
                        <TableHead>Владелец</TableHead>
                        <TableHead className="text-right">Всего</TableHead>
                        <TableHead className="text-right">WhatsApp</TableHead>
                        <TableHead className="text-right">Telegram</TableHead>
                        <TableHead className="text-right">Facebook</TableHead>
                        <TableHead className="text-right">Mobile</TableHead>
                        <TableHead className="text-right">Ссылка</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {placeStats.map((stat, index) => (
                        <TableRow key={stat.place_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  #{index + 1}
                                </Badge>
                              )}
                              {stat.place_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {stat.place_owner_name || "—"}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {stat.total_shares}
                          </TableCell>
                          <TableCell className="text-right">{stat.whatsapp}</TableCell>
                          <TableCell className="text-right">{stat.telegram}</TableCell>
                          <TableCell className="text-right">{stat.facebook}</TableCell>
                          <TableCell className="text-right">{stat.native}</TableCell>
                          <TableCell className="text-right">{stat.link}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика по пользователям</CardTitle>
              <CardDescription>
                Самые активные пользователи по количеству шерингов
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет данных о пользователях
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Всего шерингов</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStats.map((stat, index) => (
                        <TableRow key={stat.user_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  #{index + 1}
                                </Badge>
                              )}
                              {stat.user_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {stat.user_email}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {stat.total_shares}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Детальная история шерингов
              </CardTitle>
              <CardDescription>
                Полная история всех шерингов с деталями
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shareDetails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет данных о шерингах
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата и время</TableHead>
                        <TableHead>Место</TableHead>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Платформа</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shareDetails.map((detail) => (
                        <TableRow key={detail.id}>
                          <TableCell className="text-sm">
                            {format(new Date(detail.shared_at), "dd.MM.yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {detail.place_name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {detail.user_name || detail.user_email || (
                              <span className="text-muted-foreground italic">Гость</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getPlatformBadge(detail.platform)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
