import { describe, expect, it } from 'vitest';
import { parseFeed } from '../scripts/lib/http';

describe('parseFeed', () => {
  it('decodes entities before stripping encoded feed markup', () => {
    const items = parseFeed(`
      <rss><channel><item>
        <title>Agent tooling update</title>
        <link>https://example.com/update</link>
        <description><![CDATA[
          &lt;p&gt;&lt;strong&gt;Tool:&lt;/strong&gt;
          &lt;a href=&quot;https://example.com/tool&quot;&gt;CORS Chat&lt;/a&gt;
          &amp;amp; APIs.&lt;/p&gt;
        ]]></description>
      </item></channel></rss>
    `);

    expect(items[0].summary).toBe('Tool: CORS Chat & APIs.');
    expect(items[0].summary).not.toMatch(/<|href=/);
  });

  it('removes raw markup and decodes numeric entities', () => {
    const items = parseFeed(`
      <rss><channel><item>
        <title>Classification update</title>
        <link>https://example.com/classification</link>
        <description><![CDATA[<p>Don&#x27;t <em>classify</em>.</p>]]></description>
      </item></channel></rss>
    `);

    expect(items[0].summary).toBe("Don't classify.");
  });
});
