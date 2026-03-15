"use client";

import { useEffect, useState } from "react";
import { FileSearch, Home, Banknote, Bell, Menu } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { listerImpayes } from "@/lib/db-local";
import type { NavItem } from "@/components/ui/BottomNav";

export default function DashboardBottomNav() {
  const [nbImpayes, setNbImpayes] = useState(0);

  useEffect(() => {
    listerImpayes().then((list) => setNbImpayes(list.length)).catch(() => {});
  }, []);

  const items: NavItem[] = [
    { href: "/dashboard", label: "Analyser", icon: FileSearch },
    { href: "/dashboard/logements", label: "Biens", icon: Home },
    { href: "/dashboard/impayes", label: "Paiements", icon: Banknote, badge: nbImpayes },
    { href: "/dashboard/bails", label: "Baux", icon: Bell },
    { href: "/dashboard/depot", label: "Candidatures", icon: Menu },
  ];

  return <BottomNav items={items} />;
}
