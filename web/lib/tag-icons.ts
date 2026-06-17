import {
  Mountain,
  Timer,
  TrendingUp,
  Trees,
  Users,
  Settings2,
  Coffee,
  Moon,
  Sun,
  CloudRain,
  Wind,
  Camera,
  Tag,
  type LucideIcon,
} from "lucide-react";

const TAG_ICONS: Record<string, LucideIcon> = {
  Mountain,
  Timer,
  TrendingUp,
  Trees,
  Users,
  Settings2,
  Coffee,
  Moon,
  Sun,
  CloudRain,
  Wind,
  Camera,
};

export function getTagIcon(name: string): LucideIcon {
  return TAG_ICONS[name] ?? Tag;
}
