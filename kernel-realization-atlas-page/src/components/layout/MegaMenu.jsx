import { Link } from "react-router-dom";
import { MENU_PANELS } from "./nav/navConfig";

export default function MegaMenu({ activeMenuKey, isOpen }) {
  if (!isOpen || !activeMenuKey) return null;

  const panel = MENU_PANELS[activeMenuKey];
  if (!panel) return null;

  return (
    <div className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-6 py-8">
        <div className="col-span-3">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Explore
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            {panel.title}
          </h2>
        </div>

        <div className="col-span-6 grid grid-cols-2 gap-8">
          {panel.sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-sm font-semibold text-neutral-200">
                {section.title}
              </h3>

              <div className="space-y-3">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block rounded-xl border border-transparent p-3 transition hover:border-white/10 hover:bg-white/5"
                  >
                    <div className="text-sm font-medium text-white">
                      {link.label}
                    </div>
                    <div className="mt-1 text-sm text-neutral-400">
                      {link.desc}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-3">
          <Link
            to={panel.featured.href}
            className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-lime-400">
              Featured
            </div>
            <div className="mt-3 text-lg font-semibold text-white">
              {panel.featured.title}
            </div>
            <div className="mt-2 text-sm leading-6 text-neutral-400">
              {panel.featured.desc}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}