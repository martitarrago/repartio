"use client";

import { useSession } from "next-auth/react";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const nombre = session?.user?.name ?? "";

  return (
    <header className="flex h-12 items-center justify-between px-8">
      <span className="text-xl font-medium text-[#18181B]">
        {title ?? ""}
      </span>
      <span className="text-sm text-[#71717A]">{nombre}</span>
    </header>
  );
}
