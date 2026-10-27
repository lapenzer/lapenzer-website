"use client";
import { useState, type FormEvent } from "react";
export function SalesForm() {
  const [prepared, setPrepared] = useState(false);
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Project inquiry: ${String(data.get("company") || data.get("name"))}`);
    const body = encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\nOrganization: ${data.get("company")}\nRole: ${data.get("role")}\n\nProject:\n${data.get("message")}`);
    window.location.href = `mailto:lapenzerparikh@gmail.com?subject=${subject}&body=${body}`; setPrepared(true);
  }
  return <form className="sales-form" onSubmit={send}><div className="field"><label htmlFor="contact-name">Name</label><input id="contact-name" name="name" autoComplete="name" required /></div><div className="field"><label htmlFor="contact-email">Email</label><input id="contact-email" name="email" type="email" autoComplete="email" required /></div><div className="field"><label htmlFor="contact-company">Organization <span>(optional)</span></label><input id="contact-company" name="company" autoComplete="organization" /></div><div className="field"><label htmlFor="contact-role">Role <span>(optional)</span></label><input id="contact-role" name="role" autoComplete="organization-title" /></div><div className="field full"><label htmlFor="contact-message">What would you like to work on?</label><textarea id="contact-message" name="message" required /></div><div className="field full"><button className="btn btn-dark" type="submit">Open email draft <span aria-hidden="true">↗</span></button><p className="form-note">Opens your email app with the details above. Send the message from there. You can also email <a href="mailto:lapenzerparikh@gmail.com">lapenzerparikh@gmail.com</a>.</p>{prepared && <p className="form-note" role="status">Your email app was requested. If it did not open, use the email link above. This website has not sent a message.</p>}</div></form>;
}
