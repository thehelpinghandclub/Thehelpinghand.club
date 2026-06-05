# thehelpinghand.club

Educational blog for parents — built with plain HTML, hosted free on GitHub Pages.

---

## How to add a new blog post

Open `posts.json` in GitHub and find the `"posts": [` array.

Copy this template and paste it at the **top** of the array (after the `"posts": [` line),
then fill in your content:

```json
{
  "id": "your-post-url-slug",
  "title": "Your Post Title Here",
  "excerpt": "A short 1-2 sentence summary shown on the blog grid.",
  "category": "Parenting",
  "categoryColor": "#8faa96",
  "date": "June 2026",
  "readTime": "4 min",
  "featured": false,
  "body": [
    { "type": "p", "text": "Your opening paragraph goes here." },
    { "type": "h2", "text": "A subheading" },
    { "type": "p", "text": "Another paragraph." },
    { "type": "ul", "items": [
      "First bullet point",
      "Second bullet point",
      "Third bullet point"
    ]},
    { "type": "p", "text": "Closing paragraph." }
  ]
},
```

### Category colours
- Parenting / New Dads: `#8faa96` (sage)
- Development / Speech: `#a898cc` (lavender)
- Wellbeing / Education: `#c9ab72` (gold)
- Behaviour: `#cc8e87` (blush)

### To make a post the featured (large) one
Set `"featured": true` — and set the previous featured post to `false`.

---

## Files in this repo

| File | What it does |
|------|-------------|
| `index.html` | The entire website — design, layout, all pages |
| `posts.json` | All blog post content — **this is the only file you ever edit** |
| `CNAME` | Tells GitHub Pages to use thehelpinghand.club |

---

## Domain setup (one-time, at Porkbun)

1. Log in to Porkbun → DNS for thehelpinghand.club
2. Delete any existing A records for `@`
3. Add these four A records (type: A, host: @):
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153
4. Add a CNAME record: host `www` → value `yourusername.github.io`
5. Wait up to 1 hour, then enable HTTPS in GitHub Pages settings

---

Built and maintained with Claude — https://claude.ai
