import { Building2, Landmark, Receipt, ShoppingBag, Utensils, Wrench } from "lucide-react";

const items = [
  { icon: ShoppingBag, label: "Retail shops" },
  { icon: Utensils, label: "Restaurants" },
  { icon: Receipt, label: "Pharmacies" },
  { icon: Wrench, label: "Service businesses" },
  { icon: Building2, label: "Wholesalers" },
  { icon: Landmark, label: "Bank-friendly" },
];

export function LogoCloud() {
  return (
    <section
      aria-label="Built for Sri Lankan small businesses"
      className="border-y border-snow-300 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-ink-50">
          Built for how Sri Lankan SMEs actually run
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-y-5 sm:grid-cols-3 md:grid-cols-6">
          {items.map((it) => (
            <li
              key={it.label}
              className="flex items-center justify-center gap-2 text-ink-100"
            >
              <it.icon className="size-4 text-ink-50" aria-hidden />
              <span className="text-sm font-medium">{it.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
