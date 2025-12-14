import { Link, useLocation } from "react-router-dom";

export function Navigation() {
  const location = useLocation();

  const links = [
    { path: "/", label: "Work" },
    { path: "/journey", label: "Journey" },
    { path: "/learn", label: "Learn" },
  ];

  return (
    <nav className="border-b border-border bg-background">
      <div className="container-wide py-6 md:py-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-light tracking-tight hover:opacity-70 transition-opacity"
          >
            Portfolio
          </Link>

          <div className="flex gap-8">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm transition-colors ${
                  location.pathname === link.path
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
