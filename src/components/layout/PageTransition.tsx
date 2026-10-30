"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Replays a short entrance when App Router navigation swaps the visible page. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const cells = Array.from({ length: 96 }, (_, index) => {
    const row = Math.floor(index / 12);
    const column = index % 12;
    return <span key={index} className="page-transition__pixel" style={{ animationDelay: `${(row + column) * 12}ms` }} />;
  });

  return (
    <div key={pathname} className="page-transition">
      {children}
      <div className="page-transition__pixels" aria-hidden="true">{cells}</div>
    </div>
  );
}
