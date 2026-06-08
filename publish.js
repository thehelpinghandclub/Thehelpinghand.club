// publish.js
// Runs every Thursday at 7am UTC via GitHub Actions.
// 1. Publishes any scheduled posts due today
// 2. Generates rss.xml
// 3. Sends a branded Brevo email to subscribers for each new post

const fs = require('fs');

const SITE_URL  = 'https://thehelpinghand.club';
const SITE_NAME = 'The Helping Hand';
const SITE_DESC = 'Evidence-based parenting guidance for families at every stage.';

// ── Brand colours ─────────────────────────────────────────────
const TERRA  = '#c4674a';
const CREAM  = '#faf7f2';
const INK    = '#2a2420';
const INK_M  = '#5a4e46';
const VIOLET = '#3d3558';

// ── 1. Load and publish due posts ─────────────────────────────
const data  = JSON.parse(fs.readFileSync('posts.json', 'utf8'));
const today = new Date();
today.setHours(0, 0, 0, 0);

const newlyPublished = [];

data.posts = data.posts.map(post => {
  if (!post.published && post.publishDate) {
    const due = new Date(post.publishDate);
    due.setHours(0, 0, 0, 0);
    if (due <= today) {
      console.log(`✓ Publishing: "${post.title}"`);
      post.published = true;
      newlyPublished.push(post);
    }
  }
  return post;
});

if (newlyPublished.length > 0) {
  fs.writeFileSync('posts.json', JSON.stringify(data, null, 2));
  console.log(`posts.json updated — ${newlyPublished.length} post(s) published`);
} else {
  console.log('No posts due today');
}

// ── 2. Generate RSS feed ──────────────────────────────────────
const published = data.posts
  .filter(p => p.published)
  .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

function postToRSS(post) {
  const bodyText = (post.body || [])
    .filter(b => b.type === 'p').map(b => b.text).join(' ').slice(0, 400) + '...';
  const pubDate = new Date(post.publishDate).toUTCString();
  const url = `${SITE_URL}/#${post.id}`;
  return `  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <category><![CDATA[${post.category}]]></category>
    <description><![CDATA[<p>${post.excerpt}</p><p>${bodyText}</p><p><a href="${url}">Read the full article →</a></p>]]></description>
  </item>`;
}

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESC}</description>
    <language>en-gb</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${published.map(postToRSS).join('\n')}
  </channel>
</rss>`;

fs.writeFileSync('rss.xml', rss);
console.log(`rss.xml generated — ${published.length} published posts`);

// ── 3. Send Brevo email for each newly published post ─────────
async function buildEmailHTML(post) {
  const url = `${SITE_URL}/#${post.id}`;

  // Build body preview (first 2 paragraphs)
  const paras = (post.body || [])
    .filter(b => b.type === 'p')
    .slice(0, 2)
    .map(b => `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:${INK_M};">${b.text}</p>`)
    .join('');

  // Build bullet list if present
  const ulBlock = post.body.find(b => b.type === 'ul');
  const bullets = ulBlock
    ? `<ul style="margin:0 0 20px;padding-left:0;list-style:none;">
        ${ulBlock.items.map(i =>
          `<li style="font-size:14px;line-height:1.65;color:${INK_M};padding:4px 0 4px 18px;position:relative;">
            <span style="position:absolute;left:0;color:${TERRA};">·</span>${i}
          </li>`
        ).join('')}
       </ul>`
    : '';

  // Pull-out quote if present
  const quoteBlock = post.body.find(b => b.type === 'quote');
  const quote = quoteBlock
    ? `<blockquote style="margin:20px 0;padding:14px 20px;background:#fdf6ec;border-left:3px solid ${TERRA};font-style:italic;font-size:14px;color:${INK_M};line-height:1.7;">
        ${quoteBlock.text}
       </blockquote>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${post.title}</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe0;font-family:'Helvetica Neue',Arial,sans-serif;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe0;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf7f2;border-radius:4px;overflow:hidden;">

  <!-- Header -->
  <tr>
    <td style="background:${TERRA};padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:11px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.85);">The Helping Hand</p>
      <p style="margin:4px 0 0;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Evidence-based parenting</p>
    </td>
  </tr>

  <!-- Category band -->
  <tr>
    <td style="background:${post.categoryColor};padding:8px 40px;">
      <p style="margin:0;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.85);">${post.category} · ${post.readTime} read</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:40px 40px 32px;">

      <!-- Title -->
      <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;line-height:1.15;color:${INK};">${post.title}</h1>

      <!-- Intro rule -->
      <div style="width:40px;height:2px;background:${TERRA};margin:0 0 24px;"></div>

      <!-- Excerpt -->
      <p style="margin:0 0 20px;font-size:15px;font-weight:400;line-height:1.7;color:${INK_M};font-style:italic;">${post.excerpt}</p>

      ${paras}
      ${quote}
      ${bullets}

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
        <tr>
          <td style="background:${TERRA};border-radius:24px;padding:12px 28px;">
            <a href="${url}" style="color:#ffffff;font-size:11px;font-weight:400;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;">Read the full article →</a>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- Divider -->
  <tr><td style="padding:0 40px;"><div style="height:1px;background:#e8dfd0;"></div></td></tr>

  <!-- Footer -->
  <tr>
    <td style="padding:24px 40px;background:${VIOLET};">
      <p style="margin:0 0 6px;font-size:13px;font-weight:300;color:rgba(255,255,255,0.85);">thehelpinghand.club</p>
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);">
        You're receiving this because you subscribed at thehelpinghand.club.
        <a href="{{unsubscribeLink}}" style="color:rgba(255,255,255,0.4);">Unsubscribe</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendBrevoEmail(post) {
  const apiKey    = process.env.BREVO_API_KEY;
  const listId    = parseInt(process.env.BREVO_LIST_ID || '2', 10);
  const fromEmail = process.env.SENDER_EMAIL || 'hello@thehelpinghand.club';
  const fromName  = 'The Helping Hand';

  if (!apiKey) {
    console.log('ℹ No BREVO_API_KEY found — skipping email (add it to GitHub Secrets to enable)');
    return;
  }

  console.log(`📧 Sending email for: "${post.title}"`);

  const htmlContent = await buildEmailHTML(post);

  // Step 1: Create the campaign
  const createRes = await fetch('https://api.brevo.com/v3/emailCampaigns', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      name: `THH: ${post.title.slice(0, 60)} — ${post.date}`,
      subject: `New article: ${post.title}`,
      sender: { name: fromName, email: fromEmail },
      type: 'classic',
      htmlContent,
      recipients: { listIds: [listId] },
      inlineImageActivation: false,
      mirrorActive: false
    })
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error('Brevo create campaign error:', err);
    return;
  }

  const { id: campaignId } = await createRes.json();
  console.log(`  Campaign created: id=${campaignId}`);

  // Step 2: Send immediately
  const sendRes = await fetch(
    `https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`,
    {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Accept': 'application/json' }
    }
  );

  if (!sendRes.ok) {
    const err = await sendRes.text();
    console.error('Brevo send error:', err);
    return;
  }

  console.log(`  ✓ Email sent to list ${listId}`);
}

// ── Run email sends ───────────────────────────────────────────
(async () => {
  if (newlyPublished.length === 0) {
    console.log('No new posts — nothing to email');
    return;
  }
  for (const post of newlyPublished) {
    await sendBrevoEmail(post);
  }
  console.log('Done.');
})();
