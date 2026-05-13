"use client";

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { UIMessage } from "ai";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  HTMLAttributes,
  PropsWithChildren,
  ReactElement,
} from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ExtraProps,
  LinkSafetyModalProps,
  StreamdownTranslations,
} from "streamdown";
import { Streamdown, defaultTranslations } from "streamdown";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "is-user:dark flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
      "group-[.is-assistant]:text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionsProps = ComponentProps<"div">;

export const MessageActions = ({
  className,
  children,
  ...props
}: MessageActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type="button" variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(
  null
);

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error(
      "MessageBranch components must be used within MessageBranch"
    );
  }

  return context;
};

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleBranchChange = useCallback(
    (newBranch: number) => {
      setCurrentBranch(newBranch);
      onBranchChange?.(newBranch);
    },
    [onBranchChange]
  );

  const goToPrevious = useCallback(() => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const goToNext = useCallback(() => {
    const newBranch =
      currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const contextValue = useMemo<MessageBranchContextType>(
    () => ({
      branches,
      currentBranch,
      goToNext,
      goToPrevious,
      setBranches,
      totalBranches: branches.length,
    }),
    [branches, currentBranch, goToNext, goToPrevious]
  );

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div
        className={cn("grid w-full gap-2 [&>div]:pb-0", className)}
        {...props}
      />
    </MessageBranchContext.Provider>
  );
};

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageBranchContent = ({
  children,
  ...props
}: MessageBranchContentProps) => {
  const { currentBranch, setBranches, branches } = useMessageBranch();
  const childrenArray = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        "grid gap-2 overflow-hidden [&>div]:pb-0",
        index === currentBranch ? "block" : "hidden"
      )}
      key={branch.key}
      {...props}
    >
      {branch}
    </div>
  ));
};

export type MessageBranchSelectorProps = ComponentProps<typeof ButtonGroup>;

export const MessageBranchSelector = ({
  className,
  ...props
}: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className={cn(
        "[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md",
        className
      )}
      orientation="horizontal"
      {...props}
    />
  );
};

export type MessageBranchPreviousProps = ComponentProps<typeof Button>;

export const MessageBranchPrevious = ({
  children,
  ...props
}: MessageBranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

export type MessageBranchNextProps = ComponentProps<typeof Button>;

export const MessageBranchNext = ({
  children,
  ...props
}: MessageBranchNextProps) => {
  const { goToNext, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;

export const MessageBranchPage = ({
  className,
  ...props
}: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroupText
      className={cn(
        "border-none bg-transparent text-muted-foreground shadow-none",
        className
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  );
};

const streamdownPlugins = { cjk, code, math, mermaid };

const STREAMDOWN_TRANSLATIONS_ES = {
  ...defaultTranslations,
  close: "Cerrar",
  copied: "Copiado",
  copyCode: "Copiar código",
  copyLink: "Copiar enlace",
  copyTable: "Copiar tabla",
  copyTableAsCsv: "Copiar tabla como CSV",
  copyTableAsMarkdown: "Copiar tabla como Markdown",
  copyTableAsTsv: "Copiar tabla como TSV",
  downloadDiagram: "Descargar diagrama",
  downloadDiagramAsMmd: "Descargar como .mmd",
  downloadDiagramAsPng: "Descargar PNG",
  downloadDiagramAsSvg: "Descargar SVG",
  downloadFile: "Descargar archivo",
  downloadImage: "Descargar imagen",
  downloadTable: "Descargar tabla",
  downloadTableAsCsv: "Descargar CSV",
  downloadTableAsMarkdown: "Descargar Markdown",
  exitFullscreen: "Salir de pantalla completa",
  externalLinkWarning:
    "Vas a abrir una página fuera de este chat. Confirmá que el destino coincida con lo que esperás antes de seguir.",
  imageNotAvailable: "Imagen no disponible",
  mermaidFormatMmd: ".mmd",
  mermaidFormatPng: "PNG",
  mermaidFormatSvg: "SVG",
  openExternalLink: "Enlace externo",
  openLink: "Abrir",
  tableFormatCsv: "CSV",
  tableFormatMarkdown: "Markdown",
  tableFormatTsv: "TSV",
  viewFullscreen: "Pantalla completa",
} satisfies StreamdownTranslations;

function StreamdownExternalLinkModal({
  isOpen,
  onClose,
  onConfirm,
  url,
}: LinkSafetyModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className={cn(
          "w-[min(20rem,calc(100vw-2rem))] max-w-none gap-0 rounded-[var(--sidebar-frame-radius,0.75rem)]",
          "border border-[#2a3344] bg-[#11161f] p-6 text-[#e8edf5]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_48px_-28px_rgba(0,0,0,0.65)] ring-1 ring-[#f0b90b]/[0.08]",
        )}
      >
        <DialogHeader className="gap-3 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight text-[#f4f6fa]">
            Vas a otro sitio
          </DialogTitle>
          <p className="text-[13px] leading-relaxed text-[#aab3c5]">
            El vínculo abre contenido fuera de esta aplicación. Revísalo con cuidado.
          </p>
          <div
            translate="no"
            className="break-all rounded-lg border border-[#272b36] bg-[#0c1018] px-3 py-2.5 font-mono text-[12px] leading-snug text-[#fcd535]"
          >
            {url}
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex-row flex-wrap gap-2 border-0 bg-transparent px-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-w-[7rem] border-[#394355] bg-[#151b27] text-[#e8edf5] hover:bg-[#1c2535]"
            onClick={() => onClose()}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="min-w-[7rem] bg-[#f0b90b] text-[#0c0e12] hover:bg-[#fcd535]"
            onClick={() => void onConfirm()}
          >
            Abrir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STREAMDOWN_LINK_SAFETY_ES = {
  enabled: true,
  renderModal: (props: LinkSafetyModalProps) => (
    <StreamdownExternalLinkModal {...props} />
  ),
};

export type MessageResponseProps = ComponentProps<typeof Streamdown>;


/**
 * Markdown envuelve el texto suelto en `<p>`. Enlaces Streamdown pueden abrir overlays
 * (bloques tipo `<div>`), lo que rompe `<p>` + hidratación. Usamos un contenedor tipo párrafo.
 */
function MarkdownParagraphAsDiv({
  node: _node,
  className,
  children,
}: PropsWithChildren<
  Omit<ComponentPropsWithoutRef<"div">, "children"> &
    ExtraProps & { className?: string }
>) {
  return (
    <div
      className={cn(
        "mb-[0.75em] max-w-none text-sm leading-relaxed last:mb-0 [&_a]:text-[#f0b90b] [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded-md [&_code]:bg-muted/80 [&_code]:px-1 [&_code]:py-px",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const MessageResponse = memo(
  ({ className, components, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      translations={STREAMDOWN_TRANSLATIONS_ES}
      linkSafety={STREAMDOWN_LINK_SAFETY_ES}
      plugins={streamdownPlugins}
      components={{
        p: MarkdownParagraphAsDiv,
        ...components,
      }}
      {...props}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.components === nextProps.components &&
    nextProps.isAnimating === prevProps.isAnimating,
);

MessageResponse.displayName = "MessageResponse";

export type MessageToolbarProps = ComponentProps<"div">;

export const MessageToolbar = ({
  className,
  children,
  ...props
}: MessageToolbarProps) => (
  <div
    className={cn(
      "mt-4 flex w-full items-center justify-between gap-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
