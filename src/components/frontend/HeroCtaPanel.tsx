'use client';

import Link from 'next/link';
import { useState } from 'react';

type QuickLink = {
  label: string;
  href: string;
};

type Props = {
  primaryText: string;
  secondaryText: string;
  secondaryHref: string;
  quickLinks: QuickLink[];
};

export default function HeroCtaPanel({
  primaryText,
  secondaryText,
  secondaryHref,
  quickLinks,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-10">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="hero-quick-links"
        >
          {primaryText}
        </button>
        <Link href={secondaryHref} className="btn btn-secondary">
          {secondaryText}
        </Link>
      </div>

      {expanded && quickLinks.length > 0 && (
        <div id="hero-quick-links" className="mt-4 flex flex-wrap gap-3">
          {quickLinks.map((item) => (
            <Link key={`${item.label}-${item.href}`} href={item.href} className="btn btn-secondary">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
