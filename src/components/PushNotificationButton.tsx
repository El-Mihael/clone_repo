import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export const PushNotificationButton = () => {
  const { isSubscribed, isSupported, subscribe, unsubscribe } = usePushNotifications();
  const { t } = useLanguage();

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant={isSubscribed ? "secondary" : "outline"}
      size="sm"
      onClick={isSubscribed ? unsubscribe : subscribe}
      className="gap-2"
    >
      {isSubscribed ? (
        <>
          <BellOff className="w-4 h-4" />
          {t("unsubscribeNotifications") || "Отключить уведомления"}
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          {t("subscribeNotifications") || "Включить уведомления"}
        </>
      )}
    </Button>
  );
};
