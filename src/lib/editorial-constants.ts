import type { ContentFormat, Weekday } from "@/types/editorial-calendar";

export const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

export const CONTENT_FORMATS: ContentFormat[] = ["text", "carousel", "image", "short_video", "story"];

export const FORMAT_LABEL: Record<ContentFormat, string> = {
  text: "Texte",
  carousel: "Carrousel",
  image: "Image",
  short_video: "Vidéo courte",
  story: "Story",
};
