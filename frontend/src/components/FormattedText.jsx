import React from "react";
import { ExternalLink } from "lucide-react";

/**
 * Parses text containing Markdown links [Label](url) or raw URLs (http://, https://, www.)
 * and returns an array of React elements / strings with clickable blue links.
 */
export function parseFormattedContent(content) {
  if (!content || typeof content !== "string") return content;

  // Regex matches Markdown [Label](url) OR raw URLs (https://, http://, www.)
  const combinedRegex = /\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<>"'`]+)/g;

  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    const matchStart = match.index;
    const matchEnd = combinedRegex.lastIndex;

    // Push text before this link match
    if (matchStart > lastIndex) {
      elements.push(content.substring(lastIndex, matchStart));
    }

    if (match[1] && match[2]) {
      // Markdown link [Label](url)
      const label = match[1];
      let url = match[2];
      if (url.startsWith("www.")) url = "https://" + url;

      elements.push(
        <a
          key={`md-link-${matchStart}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300 break-all inline-flex items-center gap-1 mx-0.5 cursor-pointer transition-colors"
        >
          <span>{label}</span>
          <ExternalLink size={12} className="inline flex-shrink-0" />
        </a>
      );
      lastIndex = matchEnd;
    } else if (match[3]) {
      // Raw URL
      let rawUrl = match[3];
      let trailingPunctuation = "";

      // Strip trailing punctuation like ), ., ,, ;, !, ], >
      const punctRegex = /[.,;:!?)\]>]+$/;
      const punctMatch = rawUrl.match(punctRegex);
      if (punctMatch) {
        trailingPunctuation = punctMatch[0];
        rawUrl = rawUrl.slice(0, -trailingPunctuation.length);
      }

      let href = rawUrl;
      if (href.startsWith("www.")) href = "https://" + href;

      elements.push(
        <a
          key={`raw-link-${matchStart}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300 break-all inline-flex items-center gap-1 mx-0.5 cursor-pointer transition-colors"
        >
          <span>{rawUrl}</span>
          <ExternalLink size={12} className="inline flex-shrink-0" />
        </a>
      );

      if (trailingPunctuation) {
        elements.push(trailingPunctuation);
      }

      lastIndex = matchEnd;
    }
  }

  // Push remaining text after all matches
  if (lastIndex < content.length) {
    elements.push(content.substring(lastIndex));
  }

  return elements;
}

/**
 * Reusable FormattedText component to render text with clickable links
 */
export default function FormattedText({ text, className = "" }) {
  if (!text) return null;
  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {parseFormattedContent(text)}
    </span>
  );
}
