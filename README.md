# ZHUMERA

A responsive, front-end-only gift shop demo inspired by the supplied ZHUMERA brand artwork: coffee brown, caramel, beige, and cream.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` for a production build, `npm run preview` to preview it, and `npm test` for the storefront logic tests.

## GitHub Pages

The [deployment workflow](./.github/workflows/deploy-pages.yml) tests, builds, and publishes the demo on every push to `main`. You can also run it manually from the repository's Actions tab.

1. In [Settings > Pages](https://github.com/keyitechusa/zhumera/settings/pages), set **Build and deployment > Source** to **GitHub Actions**.
2. Push the website and workflow to `main`.
3. Wait for **Deploy demo to GitHub Pages** to finish in [Actions](https://github.com/keyitechusa/zhumera/actions).
4. Open **https://keyitechusa.github.io/zhumera/**.

If GitHub Pages is unavailable, check the repository's visibility, GitHub plan, and organization policies. Do not select branch-based deployment: the workflow publishes the built `dist` artifact, not the source files. No third-party hosting account, deployment secret, or backend is required.

If **Configure GitHub Pages** fails with **Pages site: Not Found**, enable the **GitHub Actions** source in Settings > Pages first. Then open the failed workflow run and choose **Re-run jobs > Re-run failed jobs**, or select **Deploy demo to GitHub Pages > Run workflow** on the Actions tab. Confirm the new attempt finishes successfully; enabling Pages alone does not retry a failed deployment.

Vite uses a relative base URL, and dynamically rendered product images use that same base, so the built demo works under `/zhumera/` as well as a custom domain. To check a production build locally under the project path:

```sh
npm run build
npm run preview -- --base=/zhumera/
```

Open the preview URL with `/zhumera/` appended. Bag and favorites are browser- and origin-specific; selections from localhost do not carry over to GitHub Pages.

## Demo features

- Responsive desktop and mobile layouts, mobile navigation, and reduced-motion support.
- Category filters, new arrivals, saved favorites, live product search, and product detail dialogs.
- Shopping bag with quantity controls, a $60 free-shipping preview, and optional $4 gift wrapping.
- Bag and favorites persisted in browser local storage. Prices use USD.
- Accessible native dialogs, keyboard controls, visible focus states, and live status messages.
- Honest checkout and newsletter previews: no orders, payments, emails, or personal details are submitted.

All products, prices, specifications, shipping offers, and policies are illustrative. No backend or account system is connected. This is a standalone visual prototype, **not an installable Shopify theme**. The design can be translated into Shopify Liquid sections, product templates, and Shopify's cart/checkout when ready.

## Assets

Logo and packaging images are cropped from the supplied [brand reference](./zhumera_abstract.jpg). Product photography is stored locally in `public/images`:

- [Mug source image](https://images.unsplash.com/photo-1514228742587-6b1558fcca3d).
- [Candle source image](https://images.unsplash.com/photo-1603006905003-be475563bc59).
- [Notebook source image](https://images.unsplash.com/photo-1531346878377-a5be20888e57).
- [Flowers source image](https://images.unsplash.com/photo-1457089328109-e5d9bd499191).

Google Fonts supplies DM Sans and Lora, with local system-font fallbacks. No analytics is included.
