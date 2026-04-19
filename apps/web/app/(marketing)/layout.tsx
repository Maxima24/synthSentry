export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-matte min-h-screen p-3 sm:p-4">
      <div className="flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-frame sm:min-h-[calc(100svh-2rem)]">
        {children}
      </div>
    </div>
  );
}
