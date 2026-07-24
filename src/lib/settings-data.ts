import type { AgencySettings, NotificationKey } from "@/types/settings";

export const NOTIFICATION_LABEL: Record<NotificationKey, string> = {
  new_to_review: "Nouvelles publications à réviser",
  change_requests: "Demandes de modification",
  approvals_received: "Approbations reçues",
  expired_connections: "Connexions sociales expirées",
  publish_failures: "Échecs de publication",
  weekly_summary: "Résumé hebdomadaire",
};

export const LANGUAGE_OPTIONS = ["Français", "Anglais", "Espagnol"];

export const COUNTRY_OPTIONS = ["Canada", "France", "Belgique", "Suisse"];

export const TIME_ZONE_OPTIONS = [
  "America/Toronto",
  "Europe/Paris",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
];

export const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  info: {
    name: "Studio Alto",
    logoLabel: "SA",
    website: "https://studioalto.agency",
    email: "contact@studioalto.agency",
    phone: "+1 416 555 0142",
    address: "123 Rue Sainte-Catherine, Toronto, ON",
    country: "Canada",
    defaultLanguage: "Français",
    defaultTimeZone: "America/Toronto",
  },
  identity: {
    primaryColor: "#18181b",
    secondaryColor: "#2563eb",
  },
  content: {
    defaultCreationLanguage: "Français",
    defaultPlatforms: ["instagram", "facebook", "linkedin"],
    favoriteFormats: ["image", "carousel", "short_video"],
    defaultCampaignDurationDays: 30,
    recurringHashtags: ["#ClickPost", "#Agence"],
    recurringCtas: ["Contactez-nous", "Découvrez-en plus"],
  },
  workflow: {
    initialStatus: "idea",
    internalApprovalRequired: true,
    clientApprovalRequired: true,
    defaultOwnerId: "tm-3",
    defaultApproverId: "tm-7",
    postApprovalBehavior: "ready_to_schedule",
  },
  notifications: {
    new_to_review: true,
    change_requests: true,
    approvals_received: true,
    expired_connections: true,
    publish_failures: true,
    weekly_summary: false,
  },
};
