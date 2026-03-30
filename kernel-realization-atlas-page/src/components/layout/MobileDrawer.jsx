import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { NAV_ITEMS } from "./nav/navConfig";

export default function MobileDrawer({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 lg:hidden">
      <div className="ml-auto h-full w-[84%] max-w-sm bg-neutral-950 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">
            Kernel Realization Atlas
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-neutral-300 hover:bg-white/5 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-8 space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              to={item.href}
              onClick={onClose}
              className="block rounded-xl px-3 py-3 text-neutral-200 hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}