import { Link, useLocation } from "react-router-dom";
import { List, Plus, BarChart2, Users, Wallet, LayoutDashboard, Building2 } from "lucide-react";

const links = [
  { to: "/", label: "Elenco Bolle", icon: List },
  { to: "/nuova", label: "Nuova Bolla", icon: Plus },
  { to: "/report", label: "Report Vendite", icon: BarChart2 },
  { to: "/dipendenti", label: "Dipendenti", icon: Users },
  { to: "/costi", label: "Costi", icon: Wallet },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clienti", label: "Clienti", icon: Building2 },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="bg-sage-700 text-white shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight select-none">
          <span className="text-2xl">🍒</span>
          <span>BollaCiliegie</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active =
              to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150
                  ${active
                    ? "bg-white text-sage-700"
                    : "text-sage-100 hover:bg-sage-600"
                  }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
