import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";

export const NotificationsTab = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: t("error"),
        description: t("enterTitleAndBody"),
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title: title.trim(),
          body: body.trim(),
          data: {
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      console.log("Notification result:", data);

      toast({
        title: t("success"),
        description: `${t("notificationSent")} ${data.successful || 0} ${t("users")} (${data.failed || 0} ${t("failed")})`,
      });

      setTitle("");
      setBody("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: t("error"),
        description: t("notificationFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            {t("pushNotifications")}
          </CardTitle>
          <CardDescription>
            {t("sendNotification")} {t("sendToAllUsers").toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-title">{t("notificationTitle")}</Label>
            <Input
              id="notification-title"
              placeholder={t("notificationTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-body">{t("notificationBody")}</Label>
            <Textarea
              id="notification-body"
              placeholder={t("notificationBody")}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSendNotification}
            disabled={isSending || !title.trim() || !body.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? t("loading") : t("sendToAllUsers")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
