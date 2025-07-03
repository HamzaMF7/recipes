import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export interface MenuType {
  title: string;
  path: string;
}

export const menu: MenuType[] = [
  {
    title: "home",
    path: "/",
  },
  {
    title: "All Recipes",
    path: "/recipes",
  },
  {
    title: "vegan",
    path: "/recipes/vegan",
  },
  {
    title: "gluten-free",
    path: "/recipes/gluten-free",
  },
  {
    title: "about us",
    path: "/about",
  },
];