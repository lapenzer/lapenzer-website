"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [note, setNote] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = String(data.get("subject") || "Lapenzer inquiry");
    const body = [
      `Name: ${String(data.get("name") || "")}`,
      `Email: ${String(data.get("email") || "")}`,
      `Organization: ${String(data.get("organization") || "")}`,
      "",
      String(data.get("message") || ""),
    ].join("\n");
    window.location.href = `mailto:contact@lapenzer.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setNote("Your email application should open with the inquiry prepared. No information is transmitted by this website.");
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          <span>Name</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span>Organization</span>
          <input name="organization" autoComplete="organization" />
        </label>
        <label>
          <span>Subject</span>
          <input name="subject" required />
        </label>
      </div>
      <label>
        <span>Message</span>
        <textarea name="message" rows={8} required />
      </label>
      <div className="form-actions">
        <button className="button button-primary" type="submit">Prepare email</button>
        <p className="form-disclosure">This form does not send data to a Lapenzer server. It opens your email client.</p>
      </div>
      {note ? <p className="form-note" aria-live="polite">{note}</p> : null}
    </form>
  );
}
