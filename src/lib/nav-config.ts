import {
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  disabled?: boolean;
  items?: { title: string; url: string }[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      {
        title: "Instalaciones",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: false,
        items: [],
      },
    ],
  },
  {
    label: "Cuenta",
    items: [
      {
        title: "Configuración",
        url: "/settings",
        icon: Settings,
        isActive: false,
        disabled: true,
        items: [],
      },
    ],
  },
];
