import { describe, expect, test } from 'bun:test';
import { renderWikiMarkup } from '../src/lib/server/wiki-markup';
import { getWikiCategories } from '../src/lib/server/wiki-categories';
import { resolveWikiRedirect, wikiRedirect } from '../src/lib/wiki';

const render = (content: string) => renderWikiMarkup(content);

describe('wiki markup', () => {
	test('renders formatting, paragraphs and lists', () => {
		const html = render("== Heading ==\n''italic'' '''bold''' '''''both'''''\n\n* item\n** nested\n# numbered\n#* mixed\n; term\n: definition\n\n----\n\nfirst\nsecond<br>third");
		for (const tag of ['<h2', '<i>', '<b>', '<ul>', '<ol>', '<dl>', '<dt>', '<dd>', '<hr', '<br']) {
			expect(html).toContain(tag);
		}
		expect(html).toContain('first\nsecond<br />third');
	});

	test('renders internal, section and external links', () => {
		const html = render('[[Main Page]] [[Main Page|Home]] [[Main Page#Section]] [https://example.com Label]');
		expect(html).toContain('href="/wiki/Main_Page"');
		expect(html).toContain('>Home</a>');
		expect(html).toContain('href="/wiki/Main_Page#Section"');
		expect(html).toContain('href="https://example.com/"');
		expect(render('[[lower case]] [[Lower case]]')).toContain('href="/wiki/lower_case"');
		expect(render('[[:Category:People]] [[:File:lower.png]]')).toContain('href="/wiki/Category%3APeople"');
		expect(render('[[:File:lower.png]]')).toContain('href="/wiki/File%3Alower.png"');
	});

	test('preserves literal text and safe HTML without executing unsafe markup', () => {
		const html = render('<nowiki>[[Literal]]</nowiki>\n\n <nowiki>preformatted</nowiki>\n\n<pre>plain</pre> <code>code</code> <u>under</u> <ins>inserted</ins> <s>strike</s> <del>deleted</del> <q>quote</q> <blockquote>block</blockquote> <!-- hidden --> &mdash; <script>alert(1)</script>');
		for (const tag of ['<pre>', '<code>', '<u>', '<ins>', '<s>', '<del>', '<q>', '<blockquote>']) {
			expect(html).toContain(tag);
		}
		expect(html).toContain('[[Literal]]');
		expect(html).toContain('—');
		expect(html).not.toContain('hidden');
		expect(html).not.toContain('<script>');
	});

	test('generates and suppresses a table of contents', () => {
		const headings = '== One ==\n== Two ==\n== Three ==\n== Four ==';
		expect(render(headings)).toContain('id="toc"');
		expect(render(`${headings}\n__NOTOC__`)).not.toContain('id="toc"');
	});

	test('expands templates, parameters and page context', () => {
		const pages = {
			'Template:Notice': { content: 'Hello {{{name|reader}}}! <includeonly>Included</includeonly><noinclude>Docs</noinclude> [[Category:People]]' },
			Main_Page: { content: 'Current page' }
		};
		const html = renderWikiMarkup('{{Notice|name=Alex}} {{PAGENAME}} {{SITENAME}} {{fullurl:Main Page}}', 'Main_Page', pages, 'https://example.com');
		expect(html).toContain('Hello Alex! Included');
		expect(html).not.toContain('Docs');
		expect(html).toContain('Main Page MGTV24 News');
		expect(html).toContain('https://example.com/wiki/Main_Page');
		expect(renderWikiMarkup('{{#ifexist:Main Page|exists|missing}} {{#ifexist:Unknown|exists|missing}}', 'Main_Page', pages)).toContain('exists missing');
	});

	test('indexes categories from transcluded templates and preserves category names', () => {
		const pages = {
			'Template:Tag': { content: '<includeonly>[[Category:people|Z]]</includeonly>' },
			Person: { content: '{{Tag}}' },
			'Category:subgroup': { content: '[[Category:people|A]]' }
		};
		expect(getWikiCategories(pages)['Category:people']).toEqual([
			{ address: 'Category:subgroup', sort: 'A' },
			{ address: 'Person', sort: 'Z' }
		]);
	});

	test('renders file links and tables without changing file name case', () => {
		const html = render('[[File:lower.png|200px|alt=Example|Caption]]\n{|\n! Header\n|-\n| Cell\n|}');
		expect(html).toContain('href="/wiki/File%3Alower.png"');
		expect(html).toContain('src="/wiki/files/lower.png"');
		expect(html).toContain('alt="Example"');
		expect(html).toContain('<table>');
		expect(html).toContain('<th>Header');
		expect(html).toContain('<td>Cell');
		expect(render('[[Image:lower.png]]')).toContain('href="/wiki/File%3Alower.png"');
	});

	test('parses redirects and detects recursive templates', () => {
		expect(wikiRedirect('#REDIRECT [[Main Page#History]]')).toEqual({ address: 'Main_Page', fragment: 'History' });
		expect(wikiRedirect('Ordinary text')).toBeNull();
		expect(resolveWikiRedirect({ A: { content: '#REDIRECT [[B]]' }, B: { content: '#REDIRECT [[C#Section]]' } }, 'A')).toEqual({ address: 'C', fragment: 'Section', loop: false });
		expect(resolveWikiRedirect({ A: { content: '#REDIRECT [[B]]' }, B: { content: '#REDIRECT [[A]]' } }, 'A').loop).toBe(true);
		const html = renderWikiMarkup('{{Loop}}', 'Page', { 'Template:Loop': { content: '{{Loop}}' } });
		expect(html).toContain('Template loop detected');
	});
});
