# Embedding on kiver.org

Each model page embeds by iframe. `?embed=1` hides the navigation and footer chrome (the planning disclaimer stays) and the page posts its height to the parent so the iframe can resize.

```html
<iframe src="https://<site>/#/96?embed=1&lang=pt" title="Kiver 96: 30 working days"
        style="width:100%;border:0;min-height:900px" loading="lazy" allow="fullscreen"></iframe>
<script>
window.addEventListener("message", e => {
  if (e.data && e.data.type === "kiver-build:height") {
    document.querySelector("iframe[title^='Kiver']").style.height = e.data.height + "px";
  }
});
</script>
```

`<site>` is the Cloudflare Pages domain (`<project>.pages.dev`, or the custom domain such as `build.kiver.org`).

| Page | Route | Suggested iframe title |
|---|---|---|
| Kiver 64 | `#/64` | Kiver 64: 30 working days |
| Kiver 96 | `#/96` | Kiver 96: 30 working days |
| Kiver 96 Pro | `#/96-pro` | Kiver 96 Pro: 30 working days |
| Kiver 144 Pro | `#/144-pro` | Kiver 144 Pro: 30 working days |
| Kiver 144 Max | `#/144-max` | Kiver 144 Max: 45 working days |
| Home | `#/` | Kiver Build |
| Due diligence | `#/due-diligence` | Kiver Build: due diligence |

Parameters (inside the hash, after the route): `embed=1`, `lang=pt|en`, `day=0..N` (opens on that build day), `start=YYYY-MM-DD` (opens in calendar mode from that start date).

Notes
- The embedding site must be listed in `frame-ancestors` in `public/_headers`; kiver.org, www.kiver.org and igorbuildshouses.com already are.
- The WhatsApp buttons open in a new tab (WhatsApp does not allow being framed).
- The 3D scene starts loading when the visitor scrolls near it, so a page with several embeds stays light.
- The height message is `{ type: "kiver-build:height", height: <px> }`, posted to the parent on load and whenever the content resizes.
