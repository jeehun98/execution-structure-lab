import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { NAV_ITEMS } from "./nav/navConfig";

export default function MobileDrawer({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 lg:hidden"
      onClick={onClose}
    >
      <div
        className="ml-auto h-full w-[84%] max-w-sm overflow-y-auto bg-neutral-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">
              Kernel Realization Atlas
            </div>
            <div className="mt-1 text-xs leading-5 text-neutral-500">
              실행에서 최적화, 그리고 생성까지 이어지는 구조를 탐색합니다.
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-2 text-neutral-300 transition hover:bg-white/5 hover:text-white"
            aria-label="메뉴 닫기"
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
              className="block rounded-xl px-3 py-3 transition hover:bg-white/5"
            >
              <div className="text-sm font-medium text-neutral-100">
                {item.label}
              </div>
              {item.shortDesc && (
                <div className="mt-1 text-xs leading-5 text-neutral-500">
                  {item.shortDesc}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}