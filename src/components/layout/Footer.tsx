import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const groups = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Smart buckets", href: "#for-smes" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help centre", href: "#" },
      { label: "Security", href: "#" },
      { label: "Status", href: "#" },
      { label: "Bank partners", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Cookies", href: "#" },
      { label: "Data protection", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-snow-200">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-6">
          <div className="lg:col-span-2">
            <Logo variant="light" />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-snow-200">
              AI-powered financial discipline for Sri Lankan sole proprietors
              and small businesses. Built on top of your existing bank.
            </p>
            <p className="mt-2 text-xs text-snow-500">
              Made in Colombo · Sinhala · Tamil · English
            </p>
          </div>

          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-snow-500">
                {g.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-snow-200 transition hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-snow-500">
            © {new Date().getFullYear()} SoleBook. All rights reserved.
          </p>
          <p className="text-xs text-snow-500">
            From cash chaos to financial control.
          </p>
        </div>
      </div>
    </footer>
  );
}
