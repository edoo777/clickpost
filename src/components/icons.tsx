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

export const platformIcons: Record<SocialPlatform, ComponentType<IconProps>> = {
  instagram: IconInstagram,
  facebook: IconFacebook,
  linkedin: IconLinkedin,
  tiktok: IconTiktok,
  x: IconX,
  youtube: IconYoutube,
};
