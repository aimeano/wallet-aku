import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

export const CategoryIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const Icon = (Icons as any)[name] ?? Icons.Tag;
  return <Icon {...props} />;
};

export const ICON_OPTIONS = [
  "UtensilsCrossed", "Car", "ShoppingBag", "Receipt", "Film", "MoreHorizontal",
  "Coffee", "Heart", "Home", "Plane", "Gift", "Gamepad2", "Book", "Dumbbell",
  "Music", "Pizza", "Bus", "Fuel", "Smartphone", "Shirt", "Baby", "PawPrint",
];

export const COLOR_OPTIONS = [
  "hsl(160 84% 52%)", "hsl(217 91% 60%)", "hsl(265 85% 65%)", "hsl(330 81% 65%)",
  "hsl(25 95% 60%)", "hsl(45 93% 58%)", "hsl(358 78% 64%)", "hsl(190 90% 55%)",
  "hsl(280 85% 65%)", "hsl(120 60% 55%)",
];
