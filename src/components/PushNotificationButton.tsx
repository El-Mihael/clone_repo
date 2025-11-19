import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const PushNotificationButton = () => {
  const { isSubscribed, isSupported, subscribe, unsubscribe } = usePushNotifications();
  const { t } = useLanguage();

  if (!isSupported) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isSubscribed ? "secondary" : "outline"}
            size="icon"
            onClick={isSubscribed ? unsubscribe : subscribe}
            className="h-9 w-9"
          >
            {isSubscribed ? (
              <BellOff className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isSubscribed
              ? t("unsubscribeNotifications") || "Отключить уведомления"
              : t("subscribeNotifications") || "Включить уведомления"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
