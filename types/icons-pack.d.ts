declare module "@icons-pack/react-simple-icons/icons/*.mjs" {
  import type { ComponentType } from "react";

  const icon: ComponentType<{
    "aria-hidden"?: boolean;
    className?: string;
    color?: string;
    size?: number;
    title?: string;
  }>;

  export default icon;
}
