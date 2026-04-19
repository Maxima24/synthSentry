interface PageHeadProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHead({ title, subtitle, action }: PageHeadProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-display text-[42px] font-semibold leading-none tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-foreground/55">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
