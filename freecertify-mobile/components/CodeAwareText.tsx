/**
 * Renders text with inline code segments in monospace + highlight.
 * Detects backtick spans plus common Python code patterns (calls, dunders,
 * quoted strings, brackets, operators) so questions like
 * "What does print('a', 'b', sep='-') output?" read like code.
 */
import { Text, StyleSheet, Platform, type StyleProp, type TextStyle } from 'react-native';
import { Colors } from '../constants/theme';

const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const CODE_RE =
  /(`[^`]+`|__\w+__(?:\(\))?|\*{1,2}\w+\b|\b[\w.]+\([^()]*\)|'[^']*'|\[[^\[\]]*\]|\{[^{}]*\}|==|!=|<=|>=|\+=|-=)/g;

interface Segment {
  text: string;
  code: boolean;
}

function splitSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(CODE_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) segments.push({ text: text.slice(last, idx), code: false });
    let token = m[0];
    if (token.startsWith('`') && token.endsWith('`')) token = token.slice(1, -1);
    segments.push({ text: token, code: true });
    last = idx + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), code: false });
  return segments;
}

export function CodeAwareText({
  children,
  style,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
}) {
  const segments = splitSegments(children ?? '');
  return (
    <Text style={style}>
      {segments.map((s, i) =>
        s.code ? (
          <Text key={i} style={styles.code}>
            {s.text}
          </Text>
        ) : (
          <Text key={i}>{s.text}</Text>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  code: {
    fontFamily: MONO_FONT,
    backgroundColor: Colors.bgDark,
    // color intentionally inherited so answer-state tinting still applies
  },
});
