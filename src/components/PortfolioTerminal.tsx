'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties, type KeyboardEvent } from 'react';

export type TerminalEntry = {
  dir: string;
  label: string;
  count: number;
  status: string;
  href?: string;
};

type PortfolioTerminalProps = {
  entries: TerminalEntry[];
  badge: string;
  prompt?: string;
};

/**
 * A compact beige computer whose screen lists the portfolio as `ls -l` output.
 * The typed command and the rows appear through CSS animation, so the full list is
 * in the server-rendered HTML and nothing flashes on load. Hovering or focusing a row
 * writes `open <dir>` at the prompt; the arrow keys, Enter and typing work once the
 * screen has focus.
 */
export default function PortfolioTerminal({ entries, badge, prompt = 'taffy ~ %' }: PortfolioTerminalProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(-1);
  const [filter, setFilter] = useState('');
  const [output, setOutput] = useState('');

  const matches = entries.map(
    (entry) => !filter || entry.dir.includes(filter) || entry.label.toLowerCase().includes(filter)
  );
  const input = selected >= 0 ? `open ${entries[selected].dir}` : filter;

  const open = (index: number) => {
    const entry = entries[index];
    if (entry.href) router.push(entry.href);
    else setOutput(`${entry.label} · 作品整理中`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = (step: number) => {
      let next = selected;
      for (let tries = 0; tries < entries.length; tries++) {
        next = (next + step + entries.length) % entries.length;
        if (matches[next]) break;
      }
      setSelected(next);
    };
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && event.target === event.currentTarget) {
      event.preventDefault();
      if (selected >= 0) open(selected);
    } else if (event.key === 'Escape') {
      setFilter('');
      setSelected(-1);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      setFilter((value) => value.slice(0, -1));
      setSelected(-1);
    } else if (event.key.length === 1 && /[a-z0-9\-]/i.test(event.key) && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      const next = filter + event.key.toLowerCase();
      setFilter(next);
      setSelected(entries.findIndex((entry) => entry.dir.includes(next) || entry.label.toLowerCase().includes(next)));
    }
  };

  return (
    <div className="portfolio-mac">
      <div className="portfolio-mac-bezel">
        <div className="portfolio-mac-screen">
          <div
            className="portfolio-terminal"
            tabIndex={0}
            role="group"
            aria-label="作品集目录：用上下键选择，回车打开，直接输入可以筛选"
            onKeyDown={onKeyDown}
          >
            <p className="portfolio-terminal-line">
              <span className="portfolio-terminal-prompt">{prompt}</span>{' '}
              <span className="portfolio-terminal-command">ls -l</span>
            </p>
            <ol className="portfolio-terminal-list">
              {entries.map((entry, index) => {
                const className = [
                  'portfolio-terminal-row',
                  index === selected ? 'is-selected' : '',
                  matches[index] ? '' : 'is-dimmed',
                ].join(' ').trim();
                const content = (
                  <>
                    <span className="portfolio-terminal-count">{entry.count}</span>
                    <span className="portfolio-terminal-name">{entry.dir}</span>
                    <span className="portfolio-terminal-note">
                      {entry.label} · {entry.status}
                    </span>
                  </>
                );
                const handlers = {
                  onPointerEnter: () => setSelected(index),
                  onPointerLeave: () => setSelected(-1),
                  onFocus: () => setSelected(index),
                  onBlur: () => setSelected(-1),
                };
                return (
                  <li key={entry.dir} style={{ '--row': index } as CSSProperties}>
                    {entry.href ? (
                      <Link className={className} href={entry.href} {...handlers}>
                        {content}
                      </Link>
                    ) : (
                      <button className={className} type="button" onClick={() => open(index)} {...handlers}>
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
            {output ? <p className="portfolio-terminal-output">{output}</p> : null}
            <p className="portfolio-terminal-line portfolio-terminal-input">
              <span className="portfolio-terminal-prompt">{prompt}</span> <span>{input}</span>
              <span className="portfolio-terminal-caret" aria-hidden="true" />
            </p>
          </div>
        </div>
      </div>
      <div className="portfolio-mac-chin" aria-hidden="true">
        <span className="portfolio-mac-badge">{badge}</span>
        <span className="portfolio-mac-slot" />
      </div>
    </div>
  );
}
