"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            return !inline && match ? (
              <SyntaxHighlighter style={tomorrow} language={match[1]} PreTag="div" {...props}>
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {children}
              </th>
            )
          },
          td({ children }) {
            return <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{children}</td>
          },
          blockquote({ children }) {
            return <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">{children}</blockquote>
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
