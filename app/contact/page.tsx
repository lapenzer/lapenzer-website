import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Lapenzer for technical projects, research, software development, partnerships, or business inquiries.",
};

export default function ContactPage() {
  return (
    <div className="shell page-shell contact-layout">
      <header className="page-header contact-header">
        <p className="eyebrow">Contact Lapenzer</p>
        <h1>Technical projects, research, software development, partnerships, or business inquiries.</h1>
        <a className="contact-email" href="mailto:contact@lapenzer.com">contact@lapenzer.com</a>
      </header>
      <ContactForm />
    </div>
  );
}
