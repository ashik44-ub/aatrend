const POSTS = [
  { title: "Summer 2025: The Trends Worth Your Money", date: "Nov 2, 2026", tag: "Fashion", excerpt: "Light layers, bold sneakers and smart accessories — our edit of the season's best looks." },
  { title: "How to Pick Headphones That Actually Sound Good", date: "Oct 24, 2026", tag: "Electronics", excerpt: "Drivers, ANC and battery life explained in plain language before you spend a taka." },
  { title: "A 5-Step Skincare Routine for Busy Mornings", date: "Oct 15, 2026", tag: "Beauty", excerpt: "Cleanse, treat, moisturise, protect — the routine our beauty editors actually follow." },
  { title: "Home Gym Essentials Under ৳12,000", date: "Oct 5, 2026", tag: "Fitness", excerpt: "Dumbbells, bands and a mat: everything you need to train at home without a big budget." },
];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-black">aatrend Blog</h1>
      <p className="mt-2 text-zinc-500">Style guides, buying advice and new arrivals.</p>
      <div className="mt-8 space-y-5">
        {POSTS.map((p) => (
          <article key={p.title} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{p.tag}</span>
            <h2 className="mt-3 text-xl font-bold">{p.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{p.date}</p>
            <p className="mt-2 text-zinc-600">{p.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
