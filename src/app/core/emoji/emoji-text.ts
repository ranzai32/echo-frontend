import { EMOJI_CODES } from './emoji-codes';

const CODE_SET = new Set<string>(EMOJI_CODES);
const TOKEN_PATTERN = /:([a-z0-9_]+):/gi;

export type EmojiContentPart =
  | { type: 'text'; value: string }
  | { type: 'emoji'; code: string };

export function isEmojiCode(code: string): boolean {
  return CODE_SET.has(code);
}

export function emojiToken(code: string): string {
  return `:${code}:`;
}

export function parseEmojiContent(text: string): EmojiContentPart[] {
  if (!text) {
    return [];
  }

  const parts: EmojiContentPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(text)) !== null) {
    const code = match[1].toLowerCase();
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    if (isEmojiCode(code)) {
      parts.push({ type: 'emoji', code });
    } else {
      parts.push({ type: 'text', value: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: text }];
}

export function insertEmojiToken(value: string, token: string, selectionStart: number, selectionEnd: number): {
  value: string;
  caret: number;
} {
  const start = Math.max(0, Math.min(selectionStart, value.length));
  const end = Math.max(start, Math.min(selectionEnd, value.length));
  const next = `${value.slice(0, start)}${token}${value.slice(end)}`;
  const caret = start + token.length;

  return { value: next, caret };
}
