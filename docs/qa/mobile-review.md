# Mobile layout review

Reviewed on 27 October 2026 using the production Next.js standalone build.

- Phone frames: 360 px and 390 px; tablet frame: 768 px.
- The homepage, all three technology pages, models, research, contact, and capabilities were checked for horizontal page overflow.
- Mobile navigation opens, closes, and navigates to a selected page.
- The route calculator updates Top-K shares; Top-1 normalizes to 100%.
- An unreachable N-to-A input displays an empty-state message; reset restores the bundled example.
- The contact page, footer, and email links use lapenzerparikh@gmail.com.
- Small labels and controls have larger text or touch targets.

The 360 px and 768 px frames reserve a desktop scrollbar, giving effective CSS widths of 345 px and 753 px. The checked pages had scrollWidth equal to clientWidth.

The development preview did not hydrate reliably. The production build was used for interaction verification.

![Homepage in a 390 px phone frame](mobile-home-390.jpg)
