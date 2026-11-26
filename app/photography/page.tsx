import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const photographs = [
  {
    "title": "Urban architecture",
    "alt": "City skyline beneath a clear blue sky",
    "description": "Cityscapes, architecture and commercial location imagery.",
    "src": "https://sites.google.com/sitesv-images-rt/APXyLQelbttUiOPe_kW4QICBvocA848z6r8GJIw-OuO2f6sM89ek9iPrcs1u8S07ht1Jfl6JhKJ3IQbKvwSZA6rlF2uAMJd0C9Gsf_gHCH-oZzJ7GHrOZ9a97uH9jh8XLDICBGbRVJCIH_EpAMTOPYsE1LxPPzReYcxhLsS4eGXSCn9vDPofVTFg__b5Twt_IPo4_XUFL6-21rXM4vQJQCdEaOkaBn3irzD67gjR-FJz7Ts=w1280",
    "width": 1000,
    "height": 749
  },
  {
    "title": "Pet & lifestyle",
    "alt": "Dog stretching on a tiled floor",
    "description": "Natural expressions, candid moments and lifestyle storytelling.",
    "src": "https://sites.google.com/sitesv-images-rt/APXyLQeWjQ5bzFzPvzBdNU-8HVk80Guuyz2ZMKiLAWvxoKsRYg0WYIbTobGng6Kox3_CF-T5hBuAY6JZGD2gZbr7ZQ8SbWoVrY1EFL6ae6xXb4AoqCSvtDXblWhUrzKeGiImE7FA5ru4Net0xKXUcqpahGu2xlun5GUsSes2uhz6V-U8M4PA4f8dwa_aRV0kTlkUS5CKgYvUAqWnZOtobItwq3vi6eYkGBnXQ8WiPbyLRiA=w1280",
    "width": 837,
    "height": 1000
  },
  {
    "title": "Nature & travel",
    "alt": "Rainbow over a waterfall and turquoise water framed by a curved railing",
    "description": "Scenic compositions, travel imagery and creative perspectives.",
    "src": "https://sites.google.com/sitesv-images-rt/APXyLQcuW8yBe9HAS5_S_ua0rrIQouWSfA6wbmH5T2ZLtT44aJNEGTIXIvw5Ow98nSMPecS9GcRj64FMP7VQsDKn1sbKmkULeBVSpVYq-q_VwuaHNx8hSmV1kLsUF3r2AhY_1EdM89OhJq1w2pVH30P9ivrvesgTrStubojSHU9DM1HuQzs_I1Lw-UvDfLQ1oVSrSwPsby4ibYTwtdyVqQTgKOyaGIS7-bf13OGIsfRB=w1280",
    "width": 1000,
    "height": 750
  },
  {
    "title": "Automotive & motion",
    "alt": "Car moving past blue illuminated structures at night",
    "description": "Motion, atmosphere and high-impact automotive imagery.",
    "src": "https://sites.google.com/sitesv-images-rt/APXyLQdvx-HjCTjnQY_MGyJp0QGW0Akng2lsYIW_g9B0xprgrSFHMtS7xDoKHaKJr3vn8eX5FxUUp9EqFwT477gsRPkypTEXK7gxU73VUTCRMROhTRJrOeY9xE-u9liCDsM3UFYJcJa7Rp2Hwje3V-HFztU_T3YxwU-MT9N5-csOIiURxirztq2zBWQeDYSUKbrLhEqYdLi9tak6ezu8M1wm7AC_9wfDj3l5VcXwKtjnZio=w1280",
    "width": 1000,
    "height": 716
  }
];
const email = "lapenzerparikh@gmail.com";
const inquiries = [
  { title: "Modelling & portraits", description: "For models, aspiring models, agencies and creatives interested in portfolio development, editorial portraits or collaborative shoots.", subject: "Photography inquiry: Modelling", body: "Hello LAPENZER Photography,\n\nName:\nLocation:\nType of shoot or collaboration:\nPreferred dates:\nPortfolio or reference links:\n\nThank you." },
  { title: "Product photography", description: "For businesses and brands requiring product imagery for e-commerce, catalogues, social media or advertising. Tell us what you sell and the images you need.", subject: "Photography inquiry: Product photography", body: "Hello LAPENZER Photography,\n\nName and business:\nProduct type and quantity:\nRequired images and usage:\nLocation or shipping arrangements:\nTarget delivery date:\n\nThank you." }
];
export const metadata: Metadata = {
  title: "Photography portfolio & commercial photography",
  description: "LAPENZER Photography in Ontario, Canada. Explore original urban, lifestyle, landscape and automotive photography. Inquire about modelling portraits and commercial product photography.",
  alternates: { canonical: "/photography" },
  openGraph: { title: "LAPENZER Photography", description: "Photography portfolio, modelling and commercial product photography in Ontario.", url: "/photography", type: "website" }
};

export default function Photography() {
  return <div className="bg-[#f2f0ea] text-[#0c0d0e]">
    <section className="bg-[#151719] text-white pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="shell">
        <div className="flex flex-wrap justify-between gap-4 border-b border-white/25 pb-5">
          <p className="eyebrow">LAPENZER / Photography</p>
          <p className="eyebrow text-white/70">Ontario, Canada</p>
        </div>
        <div className="grid gap-10 pt-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <h1 className="text-[clamp(3rem,9vw,8rem)] font-light leading-[0.95] tracking-[-0.065em]">Photography<br />with perspective.</h1>
          <div className="max-w-lg">
            <p className="mb-7 text-lg leading-relaxed text-white/80">Visual work for people, products and brands. Explore a selection of original photographs and get in touch to plan your next shoot.</p>
            <div className="btn-row"><a href="#selected-work" className="btn btn-light">Explore the portfolio ↓</a><a href="#photography-contact" className="btn btn-ghost">Book a shoot ↗</a></div>
          </div>
        </div>
      </div>
    </section>
    <section id="selected-work" className="shell py-16 md:py-24 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/15 pb-6 mb-9">
        <div><p className="eyebrow mb-4">01 / Portfolio</p><h2 className="h2">Selected work.</h2></div>
        <p className="text-sm text-black/60">Four original photographs</p>
      </div>
      <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
        {photographs.map((photo, index) => <figure key={photo.title} className="min-w-0">
          <a href={photo.src} target="_blank" rel="noreferrer" aria-label={`Open photograph: ${photo.title}`} className="block bg-[#e8e5de]">
            <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} unoptimized className="block w-full h-auto" />
          </a>
          <figcaption className="border-t border-black/15 pt-4 mt-4">
            <p className="eyebrow text-black/60 mb-2">{String(index + 1).padStart(2, "0")} / Photography</p>
            <h3 className="text-2xl font-medium tracking-tight">{photo.title}</h3>
            <p className="text-sm leading-relaxed text-black/70 mt-2">{photo.description}</p>
          </figcaption>
        </figure>)}
      </div>
      <a href="https://sites.google.com/view/lpnzr/home" className="text-link mt-9 inline-block" target="_blank" rel="noreferrer">Original portfolio ↗</a>
    </section>
    <section id="photography-contact" className="bg-[#e8e5de] py-16 md:py-24 scroll-mt-24">
      <div className="shell">
        <p className="eyebrow mb-4">02 / Services & inquiries</p>
        <h2 className="h2 mb-6">Work with us.</h2>
        <p className="max-w-2xl text-lg leading-relaxed mb-10">Available for photography projects in Ontario. Share your creative brief, preferred dates and intended use, and we can discuss availability, deliverables and a tailored quote.</p>
        <div className="grid md:grid-cols-2 gap-5">
          {inquiries.map((item) => <article key={item.title} className="border border-black/15 bg-[#f2f0ea] p-7 md:p-10 flex flex-col items-start">
            <h3 className="h3 mb-4">{item.title}</h3>
            <p className="leading-relaxed text-black/75 mb-7 flex-1">{item.description}</p>
            <a className="btn btn-dark" href={`mailto:${email}?subject=${encodeURIComponent(item.subject)}&body=${encodeURIComponent(item.body)}`}>Send inquiry ↗</a>
          </article>)}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-black/70">The inquiry buttons open a draft in your email application. You can also email <a className="underline break-all" href={`mailto:${email}`}>{email}</a> directly or contact <a className="underline" href="https://www.instagram.com/lapenzer_photography/" target="_blank" rel="noreferrer">@lapenzer_photography on Instagram</a>.</p>
        <p className="mt-5 text-sm"><Link href="/contact" className="underline">For mathematical modelling and software inquiries, visit our technology contact page.</Link></p>
      </div>
    </section>
  </div>;
}
