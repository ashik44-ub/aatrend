import { connectDB } from "@/lib/db";
import { Page } from "@/models/Page";
import { DEFAULT_PAGES, splitParagraphs } from "@/lib/pages";
import ContactForm from "@/components/ContactForm";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  await connectDB();
  const pageDoc = await Page.findOne({ slug: "contact" }).lean();
  const title = (pageDoc?.title as string) ?? DEFAULT_PAGES.contact.title;
  const content = (pageDoc?.content as string) ?? DEFAULT_PAGES.contact.content;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-black">{title}</h1>
      <div className="mt-4 space-y-3">
        {splitParagraphs(content).map((p, i) => (
          <p key={i} className="leading-relaxed text-zinc-600">
            {p}
          </p>
        ))}
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="font-bold">💬 Live Chat</p>
            <p className="text-zinc-600">Available 24/7 from the help widget.</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="font-bold">📍 Address</p>
            <p className="text-zinc-600">Dhaka, Bangladesh</p>
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
