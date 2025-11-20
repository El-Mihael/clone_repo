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
import { Share2, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PlaceShareStats {
  place_id: string;
  place_name: string;
  total_shares: number;
  whatsapp: number;
  telegram: number;
  facebook: number;
  link: number;
}

export const StatisticsTab = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<PlaceShareStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalShares, setTotalShares] = useState(0);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Get share statistics grouped by place
      const { data: shareData, error } = await supabase
        .from("share_statistics")
        .select(`
          place_id,
          platform,
          places(name)
        `);

      if (error) throw error;

      // Process data to group by place
      const statsMap = new Map<string, PlaceShareStats>();
      let total = 0;

      shareData?.forEach((item: any) => {
        const placeId = item.place_id;
        const placeName = item.places?.name || "Unknown";
        const platform = item.platform;

        if (!statsMap.has(placeId)) {
          statsMap.set(placeId, {
            place_id: placeId,
            place_name: placeName,
            total_shares: 0,
            whatsapp: 0,
            telegram: 0,
            facebook: 0,
            link: 0,
          });
        }

        const placeStats = statsMap.get(placeId)!;
        placeStats.total_shares++;
        total++;

        if (platform === "whatsapp") placeStats.whatsapp++;
        else if (platform === "telegram") placeStats.telegram++;
        else if (platform === "facebook") placeStats.facebook++;
        else if (platform === "link") placeStats.link++;
      });

      // Convert to array and sort by total shares
      const sortedStats = Array.from(statsMap.values()).sort(
        (a, b) => b.total_shares - a.total_shares
      );

      setStats(sortedStats);
      setTotalShares(total);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
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
      <div className="grid gap-4 md:grid-cols-2">
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
            <div className="text-2xl font-bold">{stats.length}</div>
            <p className="text-xs text-muted-foreground">
              Мест с шерингами
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Статистика шерингов по местам</CardTitle>
          <CardDescription>
            Самые популярные места по количеству поделившихся
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет данных о шерингах
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Место</TableHead>
                    <TableHead className="text-right">Всего</TableHead>
                    <TableHead className="text-right">WhatsApp</TableHead>
                    <TableHead className="text-right">Telegram</TableHead>
                    <TableHead className="text-right">Facebook</TableHead>
                    <TableHead className="text-right">Ссылка</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat, index) => (
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
                      <TableCell className="text-right font-bold">
                        {stat.total_shares}
                      </TableCell>
                      <TableCell className="text-right">{stat.whatsapp}</TableCell>
                      <TableCell className="text-right">{stat.telegram}</TableCell>
                      <TableCell className="text-right">{stat.facebook}</TableCell>
                      <TableCell className="text-right">{stat.link}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
