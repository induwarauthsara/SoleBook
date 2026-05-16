const stats = [
  { value: "8 in 10", label: "SMEs fail from cash discipline, not lack of revenue" },
  { value: "< 5 min", label: "Onboarding — connect, choose, done" },
  { value: "0", label: "New bank accounts required" },
  { value: "3", label: "Languages: Sinhala, Tamil, English" },
];

export function Stats() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-snow-300 bg-[#F8FAFC] px-6 py-10 sm:px-10">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <li key={s.label} className="text-center sm:text-left">
                <div className="text-3xl font-semibold tracking-tight text-ink-300 sm:text-4xl">
                  {s.value}
                </div>
                <p className="mt-2 text-sm text-ink-100">{s.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
