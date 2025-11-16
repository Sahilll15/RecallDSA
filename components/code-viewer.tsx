'use client';

import { Highlight, themes } from 'prism-react-renderer';

export function CodeViewer({
  code,
  language,
}: {
  code: string;
  language?: string | null;
}) {
  const lang = language || 'text';

  return (
    <Highlight theme={themes.vsDark} code={code} language={lang}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} overflow-x-auto p-4 rounded-lg text-sm`}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span className="inline-block w-8 text-right mr-4 text-gray-500">
                {i + 1}
              </span>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
