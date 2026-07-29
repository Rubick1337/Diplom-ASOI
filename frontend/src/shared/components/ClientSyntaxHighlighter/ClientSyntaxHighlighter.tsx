'use client';

// Этот компонент намеренно загружается только на клиенте (ssr: false),
// потому что react-syntax-highlighter зависит от refractor (ESM-only)
// что вызывает ERR_REQUIRE_ESM при серверной сборке Next.js Pages Router.
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Props = React.ComponentProps<typeof SyntaxHighlighter> & { isDarkTheme?: boolean };

const ClientSyntaxHighlighter: React.FC<Props> = ({ isDarkTheme = true, ...props }) => {
    const style = props.style ?? (isDarkTheme ? vscDarkPlus : oneLight);
    return <SyntaxHighlighter style={style} {...props} />;
};

export default ClientSyntaxHighlighter;
