interface CodeBlockProps {
  code: string;
}

// Simple SQL syntax highlighting
function highlightSQL(code: string) {
  const keywords = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|HAVING|ORDER|DESC|ASC|AND|OR|IN|NOT|NULL|COUNT|SUM|AVG|MAX|MIN|LIMIT|OFFSET|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|DATABASE|AS|DISTINCT|CASE|WHEN|THEN|ELSE|END|WITH|INTERVAL|DATE_SUB|NOW)\b/gi;
  const strings = /'[^']*'/g;
  const numbers = /\b\d+\b/g;
  const functions = /\b(COUNT|SUM|AVG|MAX|MIN|DATE_SUB|NOW|COALESCE|CONCAT|LOWER|UPPER|TRIM|LENGTH)\b/gi;

  let highlighted = code;

  // Replace strings first (to preserve them)
  const stringMatches: Record<string, string> = {};
  let stringIndex = 0;
  highlighted = highlighted.replace(strings, (match) => {
    const placeholder = `__STRING_${stringIndex}__`;
    stringMatches[placeholder] = `<span class="text-primary-400">${match}</span>`;
    stringIndex++;
    return placeholder;
  });

  // Highlight keywords
  highlighted = highlighted.replace(keywords, '<span class="font-semibold text-primary-300">$&</span>');

  // Highlight functions
  highlighted = highlighted.replace(functions, '<span class="font-semibold text-primary-200">$&</span>');

  // Highlight numbers
  highlighted = highlighted.replace(numbers, '<span class="text-primary-100">$&</span>');

  // Restore strings
  Object.entries(stringMatches).forEach(([placeholder, replacement]) => {
    highlighted = highlighted.replace(placeholder, replacement);
  });

  return highlighted;
}

export function CodeBlock({ code }: CodeBlockProps) {
  const lines = code.split('\n');
  const highlighted = highlightSQL(code);

  return (
    <div className="flex h-full flex-col bg-slate-950 font-mono text-sm text-slate-100">
      <div className="flex overflow-hidden">
        {/* Line Numbers */}
        <div className="flex select-none flex-col border-r border-slate-800 bg-slate-900 px-4 py-4 text-right text-slate-500">
          {lines.map((_, index) => (
            <div key={index} className="h-6 leading-6">
              {index + 1}
            </div>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto px-4 py-4">
          <pre>
            <code
              dangerouslySetInnerHTML={{
                __html: highlighted,
              }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}
