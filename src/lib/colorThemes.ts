export interface ColorThemeData {
  id: string;
  name: string;
  colors: string[];
}

export const COLOR_THEMES: ColorThemeData[] = [
  { id: "default", name: "ברירת מחדל", colors: ["#e07a3a", "#3d9b8f", "#5b7bb5", "#c75c5c", "#7cab5e", "#9b72b0"] },
  { id: "ocean", name: "אוקיינוס", colors: ["#1a73e8", "#00acc1", "#5c6bc0", "#0d47a1", "#26a69a", "#7986cb"] },
  { id: "sunset", name: "שקיעה", colors: ["#ff6f00", "#e65100", "#ff8f00", "#d84315", "#f4511e", "#ff9100"] },
  { id: "forest", name: "יער", colors: ["#2e7d32", "#558b2f", "#33691e", "#4caf50", "#689f38", "#1b5e20"] },
  { id: "pastel", name: "פסטל", colors: ["#f48fb1", "#ce93d8", "#90caf9", "#80cbc4", "#a5d6a7", "#ffcc80"] },
  { id: "monochrome", name: "מונוכרום", colors: ["#424242", "#616161", "#757575", "#9e9e9e", "#546e7a", "#78909c"] },
  { id: "neon", name: "ניאון", colors: ["#00e676", "#00b0ff", "#d500f9", "#ff1744", "#ffea00", "#76ff03"] },
  { id: "earth", name: "אדמה", colors: ["#8d6e63", "#a1887f", "#6d4c41", "#795548", "#bcaaa4", "#4e342e"] },
];

/** Get colors array by theme ID */
export const getThemeColors = (themeId: string): string[] => {
  return COLOR_THEMES.find(t => t.id === themeId)?.colors ?? COLOR_THEMES[0].colors;
};
