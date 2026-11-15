// s1115a A2. eslint-plugin-obsidianmd 0.6.0 regex-lookbehind (iOS before 16.4 has no lookbehind). Equivalence of the
// rewrite with the old lookbehind expression, on a table of edge cases and on seeded fuzz input (as lanes/R1-A1/eq/eq.mts).
import { describe, expect, it } from 'vitest';
import { inlineProblems } from '../src/parse';

let seed = 1115;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const gen = (alpha: string[], len: number) => Array.from({ length: Math.floor(rnd() * len) }, () => alpha[Math.floor(rnd() * alpha.length)]).join('');
const FUZZ = 20000;
const j = (x: unknown) => JSON.stringify(x);
/** Runs old and new on each input. Returns the inputs where they differ. */
function differ(inputs: string[], oldF: (s: string) => unknown, newF: (s: string) => unknown): string[] {
	return inputs.filter((s) => j(oldF(s)) !== j(newF(s)));
}
const fuzz = (alpha: string[], len: number) => Array.from({ length: FUZZ }, () => gen(alpha, len));

/** inlineProblems of 1.x before s1115a, with the lookbehinds. */
function oldProblems(line: string, pro: boolean): string[] {
	const out: string[] = [];
	const add = (msg: string) => {
		if (!out.includes(msg)) out.push(msg);
	};
	if (/!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)/.test(line)) add(pro ? 'image inside text (put the image on its own line)' : 'image (Pro)');
	if (/(?<!!)\[\[[^\]]*\]\]/.test(line)) add('internal link');
	if (/(?<!!)\[[^\]]*\]\([^)]*\)/.test(line)) add('Markdown link');
	if (/\[\^[^\]]+\]/.test(line)) add('footnote');
	if (/`/.test(line)) add('inline code');
	if (/\*\*\S|\S\*\*|__\S[\s\S]*?\S__/.test(line)) add('bold text');
	if (/(^|[^*\w])\*(?!\s)[^*]+?(?<!\s)\*(?!\w)|(^|[^\p{L}\p{N}_])_(?!\s)[^_]+?(?<!\s)_(?![\p{L}\p{N}_])/u.test(line)) add('italic text');
	if (/~~\S/.test(line)) add('strikethrough');
	if (/==\S[\s\S]*?\S==/.test(line)) add('highlight');
	if (/\$\$|\$\S[^$]*?\S\$|\$\S\$/.test(line)) add('math');
	if (/<!--|-->/.test(line)) add('HTML comment');
	if (/<\/?[a-zA-Z][^>]*>/.test(line)) add('HTML');
	if (/&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i.test(line)) add('HTML entity');
	if (/\\[!-/:-@[-`{-~]/.test(line)) add('backslash escape');
	return out;
}
const oldF = (s: string) => [oldProblems(s, false), oldProblems(s, true)];
const newF = (s: string) => [inlineProblems(s, false), inlineProblems(s, true)];
const TABLE = ['', '[[a]]', '![[a]]', '!![[a]]', '![[a]] [[b]]', '[a](b)', '![a](b)', '![a](b) [c](d)', '*a*', '* a*', '*a *', '*a b*', 'x*a*', '_a_', '_ a_', '_a _', 'snake_case_x', 'é_a_', '_a_é', '*\ta*', '**a**', '*a* ', '_a _'];

describe('inlineProblems without lookbehind', () => {
	it('matches the old expression on the table', () => {
		expect(differ(TABLE, oldF, newF)).toEqual([]);
	});
	it('matches the old expression on fuzz input', () => {
		expect(differ(fuzz(['[', ']', '(', ')', '!', 'a', ' ', '*', '_', '\t', 'é', '\u00a0', '[[', ']]'], 24), oldF, newF)).toEqual([]);
	});
});
