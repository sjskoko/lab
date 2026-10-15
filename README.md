# Interactive Lab

**[Open the collection →](https://sjskoko.github.io/lab/)**

One permanent bio link for a growing collection of interactive web experiments. Each project keeps its own repository and demo; this lightweight hub brings them together.

## Featured experiment

**[Orbit — Fourier Pattern Studio](https://sjskoko.github.io/orbit-fourier-studio/)** turns sketches, image contours, and 24 preset shapes into rotating Fourier circles. Explore up to 5,000 terms and export an animation.

[Launch Orbit](https://sjskoko.github.io/orbit-fourier-studio/) · [Watch the story](https://sjskoko.github.io/orbit-fourier-studio/story/) · [Star Orbit on GitHub](https://github.com/sjskoko/orbit-fourier-studio)

## Add a project

1. Publish the new repository's demo, for example with GitHub Pages.
2. Add a preview image to `dist/` (SVG, PNG, JPG, or WebP).
3. Append an entry to `projects.json` using this structure:

```json
{
  "id": "your-project",
  "title": "Your Project",
  "subtitle": "An interactive experiment",
  "description": "A short, specific invitation to try it.",
  "tags": ["Interactive", "Creative coding"],
  "demo": "https://YOUR-HANDLE.github.io/YOUR-REPO/",
  "repository": "https://github.com/YOUR-HANDLE/YOUR-REPO",
  "image": "your-project.svg",
  "imageAlt": "A meaningful description of the preview"
}
```

The optional `story` property adds a story link. Array order controls display order. Use a unique ID and public HTTPS URLs. No private links, credentials, or uploaded personal files belong in this public repository.

4. Commit to `main`. GitHub Actions validates the catalog, generates the page, and deploys `dist/`. The bio URL stays the same.

Project sites can coexist at `https://<owner>.github.io/<repository>/`, one per repository. See [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Development

Node.js 20+ is sufficient; there are no package dependencies.

```sh
npm run build
python3 -m http.server 8000 --directory dist
```

Edit `template.html`, `dist/style.css`, or `projects.json`, then rebuild. `dist/index.html` is generated and committed for convenient static hosting. On GitHub, set **Settings → Pages → Source → GitHub Actions**.

## Design and privacy

- Mobile-first layout with large demo links, a repository Star link, and optional story links.
- Static HTML cards work without JavaScript. The optional Share button uses native sharing or copies the collection URL, with a selectable-text fallback.
- System fonts, local SVG artwork, keyboard focus states, and reduced-motion support.
- No cookies, external fonts, GitHub API calls, or personal contact details in the page. Optional aggregate page-view analytics have an opt-out page; see the traffic section for activation status. The GitHub account handle is visible in the hosting and repository URLs. Hosting providers still receive ordinary page requests.
- This is an independent link hub, not an account on Linktree.

## GitHub Pages traffic

<!-- LIVE-TRAFFIC:START -->
![Traffic tracking setup status](assets/traffic-status.svg)

**Not active yet:** collector registration is blocked by a hosting-service error. The endpoint is deliberately empty. [Implementation and activation instructions](https://github.com/sjskoko/lab/tree/main/analytics).
<!-- LIVE-TRAFFIC:END -->
