import { Link } from "react-router-dom";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { resolveNotificationLink } from "@/lib/siteNotifications";

export function NotificationLinkAction({
  linkUrl,
  className,
  onClick,
}: {
  linkUrl: string | null;
  className?: string;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const link = resolveNotificationLink(linkUrl);
  if (!link) return null;

  const classNames = cn(
    "inline-flex items-center justify-center rounded-lg border border-amber-500/45 bg-amber-500/15 px-3 py-1.5 text-sm font-semibold text-amber-100 transition",
    "hover:border-amber-400/60 hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/35",
    className,
  );

  if (link.kind === "internal") {
    return (
      <Link to={link.href} className={classNames} onClick={onClick}>
        {t("notifications.openLink")}
      </Link>
    );
  }

  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={classNames} onClick={onClick}>
      {t("notifications.openLink")}
    </a>
  );
}
