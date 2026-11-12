import { connectDB } from "@/lib/db";
import { Page } from "@/models/Page";
import { DEFAULT_PAGES, splitParagraphs } from "@/lib/pages";
import type { PageSlug } from "@/models/Page";

export const dynamic = "force-dynamic";

export default async function ContentPage({ slug }: { slug: PageSlug }) {
  await connectDB();
  const doc = await Page.findOne({ slug }).lean();
  const title = (doc?.title as string) ?? DEFAULT_PAGES[slug].title;
  const content = (doc?.content as string) ?? DEFAULT_PAGES[slug].content;
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-black">{title}</h1>
      <div className="mt-6 space-y-4">
        {splitParagraphs(content).map((p, i) => (
          <p key={i} className="leading-relaxed text-zinc-600">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
