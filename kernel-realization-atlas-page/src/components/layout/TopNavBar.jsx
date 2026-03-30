import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Search, Github } from "lucide-react";
import MegaMenu from "./MegaMenu";
import MobileDrawer from "./MobileDrawer";
import { NAV_ITEMS } from "./nav/navConfig";

export default function TopNavBar() {
  const [activeMenuKey, setActiveMenuKey] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasOpenMenu = useMemo(() => Boolean(activeMenuKey), [activeMenuKey]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 lg:px-6">
        <Link
          to="/atlas-new"
          className="shrink-0 text-sm font-semibold tracking-wide text-white"
          onMouseEnter={() => setActiveMenuKey(null)}
        >
          Kernel Realization Atlas
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => setActiveMenuKey(item.panel)}
            >
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  [
                    "rounded-md px-3 py-2 text-sm transition",
                    isActive
                      ? "text-white"
                      : "text-neutral-300 hover:text-white",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <button className="rounded-md p-2 text-neutral-300 hover:bg-white/5 hover:text-white">
            <Search size={18} />
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-md p-2 text-neutral-300 hover:bg-white/5 hover:text-white"
          >
            <Github size={18} />
          </a>
        </div>

        <button
          className="ml-auto rounded-md p-2 text-neutral-300 hover:bg-white/5 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div
        className="hidden lg:block"
        onMouseLeave={() => setActiveMenuKey(null)}
      >
        <MegaMenu activeMenuKey={activeMenuKey} isOpen={hasOpenMenu} />
      </div>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}