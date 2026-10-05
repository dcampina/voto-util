import { cn } from "@/lib/utils";

export function PageHeader({
  kicker,
  title,
  children,
  className,
}: {
  kicker?: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex max-w-3xl flex-col gap-3 pt-10 pb-8 sm:pt-14", className)}>
      {kicker && <p className="kicker">{kicker}</p>}
      <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-balance sm:text-[2.6rem] sm:leading-[1.05]">{title}</h1>
      {children && <div className="flex flex-col gap-2 text-base text-pretty text-muted-foreground sm:text-lg">{children}</div>}
    </header>
  );
}
