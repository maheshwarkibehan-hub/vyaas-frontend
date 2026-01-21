

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  return (
    <>
      {/* Header removed - was blocking session-view header clicks */}
      {children}
    </>
  );
}
