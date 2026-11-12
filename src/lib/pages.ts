import type { PageSlug } from "@/models/Page";

export const PAGE_SLUGS: PageSlug[] = ["about", "contact", "terms"];

export const DEFAULT_PAGES: Record<PageSlug, { title: string; content: string }> = {
  about: {
    title: "About aatrend",
    content: `aatrend is a modern online store built for people who love discovering great products. From fashion and electronics to beauty, fitness, home decor and accessories, every item in our catalogue is hand-picked for quality, style and value.

We believe shopping should be simple, safe and fun: delivery ৳70 inside Dhaka and ৳120 outside Dhaka, secure checkout, easy 30-day returns and 24/7 support on every order.

Our team curates new arrivals every week, so there is always something fresh to discover — whether you are refreshing your wardrobe, upgrading your home, or finding the perfect gift.`,
  },
  contact: {
    title: "Contact Us",
    content: `We would love to hear from you. Send us a message with the form and we will reply within one business day.

You can also reach us by email or visit us in Dhaka, Bangladesh. For order questions, please include your order number so we can help faster.`,
  },
  terms: {
    title: "Terms & Conditions",
    content: `Welcome to aatrend. By placing an order on this store you agree to the terms below.

Orders and payment: All prices are in Bangladeshi Taka (৳). We accept cash on delivery and demo card payments at checkout. An order is confirmed once you receive an order number.

Shipping: Delivery charge is ৳70 inside Dhaka and ৳120 outside Dhaka. Orders are usually dispatched within 2 business days and delivered within 3–7 business days.

Returns: You can return unused items within 30 days of delivery for a refund or exchange. Sale items are final sale unless faulty.

Privacy: We only use your contact details to fulfil your order and to reply to your messages. We never sell your personal information.

If you have any questions about these terms, please contact us.`,
  },
};

/** Split stored text into paragraphs (blank line = new paragraph). */
export function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
