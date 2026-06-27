import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET(context: APIContext): Promise<Response> {
  const site = (context.site?.toString() ?? 'https://allm-academy.example/').replace(/\/$/, '');
  const days = (await getCollection('daily')).sort((a, b) => (a.data.date < b.data.date ? 1 : -1)).slice(0, 30);
  const items = days.flatMap((d) =>
    d.data.lessons.map((l) => {
      const link = l.sourceLinks[0]?.url ?? site;
      const abs = link.startsWith('http') ? link : site + link;
      return `  <entry>
    <title>${esc(l.headline)}</title>
    <link href="${esc(abs)}"/>
    <id>${esc(site)}/daily/${d.data.date}#${esc(l.id)}</id>
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
  <link href="${site}/feed.xml" rel="self"/>
  <link href="${site}/"/>
  <id>${site}/</id>
  <updated>${updated}</updated>
${items.join('\n')}
</feed>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
