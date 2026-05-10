import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";

type SpinnerProps = ComponentPropsWithoutRef<typeof Loader2Icon>;

function Spinner({
  className,
  "aria-hidden": ariaHiddenProp,
  ...props
}: SpinnerProps) {
  const decorative = ariaHiddenProp === true;

  return (
    <Loader2Icon
      {...props}
      className={cn("size-4 animate-spin", className)}
      aria-hidden={decorative ? true : ariaHiddenProp}
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : "Cargando…"}
    />
  );
}

export { Spinner };
