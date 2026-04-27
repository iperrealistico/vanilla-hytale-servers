import type { MDXComponents } from 'mdx/types';
import { PropsWithChildren } from 'react';
import Link from 'next/link';

import type { ArticleCtaCard } from '@/lib/articles/schema';

interface BlockProps extends PropsWithChildren {
  title: string;
}

function EditorialBlock({ children, title, tone, icon }: BlockProps & { tone: string; icon: string }) {
  return (
    <aside className={`article-note article-note--${tone}`}>
      <div className="article-note__header">
        <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
        <strong>{title}</strong>
      </div>
      <div className="article-note__content">{children}</div>
    </aside>
  );
}

export function ArticleQuickAnswer({ children, title }: BlockProps) {
  return <EditorialBlock icon="fa-bolt" tone="answer" title={title}>{children}</EditorialBlock>;
}

export function ArticlePlanningNote({ children, title }: BlockProps) {
  return <EditorialBlock icon="fa-map" tone="planning" title={title}>{children}</EditorialBlock>;
}

export function ArticleChecklist({ children, title }: BlockProps) {
  return <EditorialBlock icon="fa-list-check" tone="checklist" title={title}>{children}</EditorialBlock>;
}

export function ArticleCommonMistake({ children, title }: BlockProps) {
  return <EditorialBlock icon="fa-triangle-exclamation" tone="mistake" title={title}>{children}</EditorialBlock>;
}

export function ArticleExpertTip({ children, title }: BlockProps) {
  return <EditorialBlock icon="fa-compass" tone="tip" title={title}>{children}</EditorialBlock>;
}

export function ArticleDeepDive({ children, title }: BlockProps) {
  return <EditorialBlock icon="fa-layer-group" tone="dive" title={title}>{children}</EditorialBlock>;
}

export function ArticlePullQuote({ children, title }: BlockProps) {
  return <EditorialBlock icon="fa-quote-left" tone="quote" title={title}>{children}</EditorialBlock>;
}

export function ArticlePrimarySegue({ cta }: { cta: ArticleCtaCard }) {
  return (
    <section className="article-segue">
      <span className="article-segue__eyebrow">{cta.eyebrow}</span>
      <h3>{cta.title}</h3>
      <p>{cta.body}</p>
      <Link className={`btn ${cta.primaryCta.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} pressable`} href={cta.primaryCta.href}>
        {cta.primaryCta.label}
      </Link>
    </section>
  );
}

function Paragraph({ children }: PropsWithChildren) {
  return <p className="article-body-paragraph">{children}</p>;
}

function List({ children }: PropsWithChildren) {
  return <ul className="article-body-list">{children}</ul>;
}

function OrderedList({ children }: PropsWithChildren) {
  return <ol className="article-body-list article-body-list--ordered">{children}</ol>;
}

function ListItem({ children }: PropsWithChildren) {
  return <li>{children}</li>;
}

export function getArticleMdxComponents(segueCta: ArticleCtaCard): MDXComponents {
  return {
    p: Paragraph,
    ul: List,
    ol: OrderedList,
    li: ListItem,
    ArticleQuickAnswer,
    ArticlePlanningNote,
    ArticleChecklist,
    ArticleCommonMistake,
    ArticleExpertTip,
    ArticleDeepDive,
    ArticlePullQuote,
    ArticlePrimarySegue: () => <ArticlePrimarySegue cta={segueCta} />,
  };
}
