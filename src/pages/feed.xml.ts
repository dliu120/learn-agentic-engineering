import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET(context: APIContext): Promise<Response> {
  const site = context.site ?? new URL('https://allm-academy.example/');
  const home = new URL(import.meta.env.BASE_URL, site).toString().replace(/\/$/, '');
  const days = (await getCollection('daily')).sort((a, b) => (a.data.date < b.data.date ? 1 : -1)).slice(0, 30);
  const items = days.flatMap((d) =>
    d.data.lessons.map((l) => {
      const link = l.sourceLinks[0]?.url ?? home;
      const abs = link.startsWith('http') ? link : home + link;
      return `  <entry>
    <title>${esc(l.headline)}</title>
    <link href="${esc(abs)}"/>
    <id>${esc(home)}/daily/${d.data.date}#${esc(l.id)}</id>
    <updated>${d.data.generatedAt}</updated>
    <summary>${esc(l.whyItMatters)}</summary>
    <category term="${esc(l.module)}"/>
  </entry>`;
    }),
  );
  const updated = days[0]?.data.generatedAt ?? new Date(0).toISOString();
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>ALLM Academy — Daily AI Engineering Briefing</title>
  <link href="${home}/feed.xml" rel="self"/>
  <link href="${home}/"/>
  <id>${home}/</id>
  <updated>${updated}</updated>
${items.join('\n')}
</feed>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
