"use client";

import { PixelIcon } from "./PixelIcon";
import type { MouseEvent } from "react";

export const THEME_KEY = "as-theme";

type Props = { toLight: string; toDark: string };

/**
 * Which label/icon is visible is decided by CSS from html[data-theme] (or system preference),
 * so server HTML is correct before hydration. The click handler reads the live state.
 */
export function ThemeToggle({ toLight, toDark }: Props) {
  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const current =
      root.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = current === "light" ? "dark" : "light";
    root.dataset.theme = next;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      event.currentTarget.animate(
        [{ transform: "rotate(0deg) scale(1)" }, { transform: "rotate(90deg) scale(1.12)" }, { transform: "rotate(180deg) scale(1)" }],
        { duration: 480, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
    }
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable: the choice lasts for this page view only */
    }
  }

  return (
    <button type="button" className="control theme-toggle" onClick={toggle}>
      <span className="when-dark">
        <PixelIcon name="sun" />
        <span className="sr-only">{toLight}</span>
      </span>
      <span className="when-light">
        <PixelIcon name="moon" />
        <span className="sr-only">{toDark}</span>
      </span>
    </button>
  );
}
