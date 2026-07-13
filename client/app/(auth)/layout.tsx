export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-bg-surface border border-border rounded-lg p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
