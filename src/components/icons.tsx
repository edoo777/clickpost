import type { ComponentType, ReactNode, SVGProps } from "react";
import type { SocialPlatform } from "@/types/dashboard";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Base>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <line x1="3" y1="9.5" x2="21" y2="9.5" />
      <line x1="8" y1="2.5" x2="8" y2="6.5" />
      <line x1="16" y1="2.5" x2="16" y2="6.5" />
    </Base>
  );
}

export function IconSend(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21 3 3 10.5l7.5 3L14 21 21 3Z" />
      <path d="M10.5 13.5 21 3" />
    </Base>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M15.5 14.2c2.6.4 4.5 2.7 4.5 5.8" />
    </Base>
  );
}

export function IconChartBar(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="6" y="12" width="3" height="8" />
      <rect x="11" y="7" width="3" height="13" />
      <rect x="16" y="10" width="3" height="10" />
    </Base>
  );
}

export function IconBriefcase(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5C8 4.7 8.7 4 9.5 4h5c.8 0 1.5.7 1.5 1.5V7" />
      <line x1="3" y1="12.5" x2="21" y2="12.5" />
    </Base>
  );
}

export function IconLayoutGrid(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </Base>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.6L12 17.7l-1.6-5.5L5 10.6 10.4 9Z" />
      <path d="M18.5 15v3.5M16.75 16.75h3.5" />
    </Base>
  );
}

export function IconIdBadge(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8.5 16.5c.5-2 2-3 3.5-3s3 1 3.5 3" />
    </Base>
  );
}

export function IconClipboardCheck(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9 4.5V3.8C9 3.3 9.4 3 9.8 3h4.4c.4 0 .8.3.8.8v.7" />
      <path d="M9 13l2.2 2.2L15.5 11" />
    </Base>
  );
}

export function IconSettingsGear(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6M17.8 17.8l-1.6-1.6M7.8 7.8 6.2 6.2" />
    </Base>
  );
}

export function IconTag(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11.5 3.5H6.5a2 2 0 0 0-2 2v5l9.6 9.6a1.5 1.5 0 0 0 2.1 0l4.9-4.9a1.5 1.5 0 0 0 0-2.1Z" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconLock(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Base>
  );
}

export function IconLightbulb(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9V16h5v-.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3Z" />
    </Base>
  );
}

export function IconWand(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20 14.5 9.5" />
      <path d="M17.5 3v3M17.5 10v3M14 6.5h3M18 6.5h3" />
    </Base>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </Base>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </Base>
  );
}

export function IconSidebarCollapse(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <path d="M14.5 9.5 12 12l2.5 2.5" />
    </Base>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2.5 12h2.5M19 12h2.5M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8" />
    </Base>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </Base>
  );
}

export function IconMonitor(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Base>
  );
}

export function IconBold(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 4h6a3.2 3.2 0 0 1 0 6.4H7Z" />
      <path d="M7 10.4h6.8a3.2 3.2 0 0 1 0 6.4H7Z" />
    </Base>
  );
}

export function IconItalic(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="11" y1="4" x2="17" y2="4" />
      <line x1="7" y1="20" x2="13" y2="20" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </Base>
  );
}

export function IconLink(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.6 4.9a3.3 3.3 0 0 1 4.7 4.7L15.7 11" />
      <path d="M13 17.5 11.4 19.1a3.3 3.3 0 0 1-4.7-4.7L8.3 13" />
    </Base>
  );
}

export function IconListBullet(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
    </Base>
  );
}

export function IconListNumbered(props: IconProps) {
  return (
    <Base {...props}>
      <text x="2" y="8" fontSize="6" fill="currentColor" stroke="none">1</text>
      <text x="2" y="14.5" fontSize="6" fill="currentColor" stroke="none">2</text>
      <text x="2" y="21" fontSize="6" fill="currentColor" stroke="none">3</text>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
    </Base>
  );
}

export function IconListCheck(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="4" height="4" rx="1" />
      <path d="M3.7 6 4.5 6.8 6.3 5" />
      <rect x="3" y="16" width="4" height="4" rx="1" />
      <line x1="10" y1="6" x2="20" y2="6" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="10" y1="18" x2="20" y2="18" />
    </Base>
  );
}

export function IconQuote(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 8.5c-1.8 0-3 1.4-3 3.3S5.2 15 7 15c0-3.5 1.5-5.5 3.5-6.5" />
      <path d="M16 8.5c-1.8 0-3 1.4-3 3.3s1.2 3.2 3 3.2c0-3.5 1.5-5.5 3.5-6.5" />
    </Base>
  );
}

export function IconMinus(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </Base>
  );
}

export function IconUndo(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 8H15.5a4.5 4.5 0 0 1 0 9H10" />
      <path d="M7 4 3.5 8 7 12" />
    </Base>
  );
}

export function IconRedo(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M17 8H8.5a4.5 4.5 0 0 0 0 9H14" />
      <path d="M17 4 20.5 8 17 12" />
    </Base>
  );
}

export function IconLayoutDocument(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </Base>
  );
}

export function IconLayoutSplit(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="7.5" height="16" rx="1.5" />
      <rect x="13.5" y="4" width="7.5" height="7" rx="1.5" />
      <rect x="13.5" y="13" width="7.5" height="7" rx="1.5" />
    </Base>
  );
}

export function IconPanelRight(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="15" y1="4" x2="15" y2="20" />
    </Base>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12a9 9 0 1 0 2.6-6.4" />
      <path d="M3 4v5h5" />
      <path d="M12 8v4l3 2" />
    </Base>
  );
}

export function IconEye(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 4l16 16" />
      <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.4 15.4 0 0 1-3.3 4.2M6.7 6.8C4.2 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.3 0 2.5-.3 3.6-.8" />
      <path d="M9.9 10.1a3 3 0 0 0 4 4" />
    </Base>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M16 16l4-4-4-4" />
      <path d="M20 12H9" />
    </Base>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 9l6 6 6-6" />
    </Base>
  );
}

export function IconTrendingUp(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 17 9.5 10.5 13.5 14.5 21 6" />
      <path d="M15 6h6v6" />
    </Base>
  );
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5 21.5 20h-19Z" />
      <line x1="12" y1="9.5" x2="12" y2="14" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconLogoMark(props: IconProps) {
  return (
    <Base {...props} strokeWidth={2}>
      <path d="M12 3 4 8v8l8 5 8-5V8Z" />
      <path d="M12 12v9" />
      <path d="M4 8l8 4 8-4" />
    </Base>
  );
}

export function IconArrowUp(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </Base>
  );
}

export function IconArrowDown(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14" />
      <path d="M18 13l-6 6-6-6" />
    </Base>
  );
}

export function IconInstagram(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconFacebook(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14 21v-7h2.5l.5-3H14V8.8c0-.9.3-1.6 1.7-1.6H17V4.3C16.6 4.2 15.7 4 14.7 4 12.5 4 11 5.3 11 7.8V11H8.5v3H11v7Z" />
    </Base>
  );
}

export function IconLinkedin(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <line x1="7.5" y1="10" x2="7.5" y2="17" />
      <circle cx="7.5" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
      <path d="M11.5 17v-4.5c0-1.4 1-2.5 2.4-2.5s2.1 1 2.1 2.6V17" />
      <line x1="11.5" y1="10" x2="11.5" y2="17" />
    </Base>
  );
}

export function IconTiktok(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14 3v10.5a3 3 0 1 1-3-3" />
      <path d="M14 3c0 3 2.2 5.2 5 5.2" />
    </Base>
  );
}

export function IconX(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </Base>
  );
}

export function IconYoutube(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
      <path d="M10.5 9.5v5l4.5-2.5Z" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconThreads(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3c-4.5 0-7 2.8-7 7v4c0 4.2 2.5 7 7 7s7-2.8 7-7" />
      <path d="M9 10c0-1.8 1.3-3 3-3s3 1.2 3 3c0 2-1.5 2.5-3 3-1.8.5-4 1.3-4 3.5 0 1.8 1.5 2.8 3.3 2.8" />
    </Base>
  );
}

export function IconPinterest(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 17c1-3 1.5-6 2-8.5.3-1.5 2.5-1.5 2.5.3 0 1.3-1 3.7-1.5 5.2-.4 1.3.6 2.3 1.9 2.3 2.2 0 3.6-2.3 3.6-4.8 0-2.6-1.9-4.7-5-4.7-3.6 0-5.7 2.4-5.7 5" />
    </Base>
  );
}

export function IconOtherNetwork(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 2.5 15.5 0 18" />
      <path d="M12 3c-2.5 2.5-2.5 15.5 0 18" />
    </Base>
  );
}

export const platformIcons: Record<SocialPlatform, ComponentType<IconProps>> = {
  instagram: IconInstagram,
  facebook: IconFacebook,
  linkedin: IconLinkedin,
  tiktok: IconTiktok,
  x: IconX,
  youtube: IconYoutube,
  threads: IconThreads,
  pinterest: IconPinterest,
  other: IconOtherNetwork,
};
