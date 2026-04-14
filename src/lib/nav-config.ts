import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  CreditCard,
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
        title: "Panel de control",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: false,
        items: [],
      },
      {
        title: "Comunidades",
        url: "/communities",
        icon: Users,
        isActive: false,
        items: [],
      },
      {
        title: "Chat energético",
        url: "/chat",
        icon: MessageSquare,
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
        items: [],
      },
      {
        title: "Precios",
        url: "/pricing",
        icon: CreditCard,
        isActive: false,
        items: [],
      },
    ],
  },
];
