import AppShell from "@/app/components/layout/AppShell";

// Layout do grupo (app): toda rota dentro de app/(app)/ ganha sidebar + topbar.
// Rotas fora do grupo (ex.: uma futura /login) ficam sem o shell.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
