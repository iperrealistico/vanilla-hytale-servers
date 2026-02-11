import React from 'react';

export const BlogLayout = ({ children, config }: { children: React.ReactNode, config: any }) => {
  return (
    <>
      <div className="bg-floats" aria-hidden="true">
        <img className="bg-float" src="/img/hytale/hytale_vanilla_servers_list_11.jpeg" alt="" loading="lazy" decoding="async"
          style={{ top: '38vh', left: '-6vw', transform: 'translate3d(0,0,0) rotate(-6deg) scale(1.05)' }} />
        <img className="bg-float" src="/img/hytale/hytale_vanilla_servers_list_12.jpeg" alt="" loading="lazy" decoding="async"
          style={{ top: '132vh', right: '-10vw', width: 'min(820px, 66vw)', transform: 'translate3d(0,0,0) rotate(7deg) scale(1.04)' }} />
      </div>

      <header className="site-header" role="banner">
        <div className="container">
          <div className="topbar">
            <a className="brand pressable" href="/">
              <div className="brand-badge idle" aria-hidden="true">
                <img src="/img/favicon.png" alt="" width="32" height="32" />
              </div>
              <div className="brand-title">
                <strong>{config.blog.siteName}</strong>
                <span>Curated editor picks</span>
              </div>
            </a>
            <nav className="main-nav" aria-label="Main navigation">
              <a className="nav-text pressable" href="/">Home</a>
              <a className="btn btn-primary tilt pressable" href="/#suggest">
                <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                Submit
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="hero">
          <div className="container">
            <div className="hero-panel tilt idle" data-tilt-strength="0.60">
              <img
                className="hero-bg-img"
                src="/img/hytale/hytale_vanilla_servers_list_1.jpeg"
                alt="Background"
                width="1600"
                height="900"
              />
              <div className="hero-inner" style={{ gridTemplateColumns: '1fr' }}>
                <div className="hero-content">
                  <h1 className="text-4xl font-black tracking-tight" style={{ textTransform: 'none' }}>
                    {config.blog.siteName}
                  </h1>
                  <p className="mt-4 opacity-90 leading-relaxed max-w-2xl">
                    Latest updates, deep dives, and news from the Hytale community. We explore the evolving landscape of vanilla survival,
                    bringing you insights into the most promising servers, gameplay mechanics, and developer announcements.
                  </p>
                  <div className="hero-meta mt-6">
                    <span><i className="fa-regular fa-newspaper" aria-hidden="true"></i> Hytale Insights</span>
                    <span><i className="fa-solid fa-bolt" aria-hidden="true"></i> Community News</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="container">
            {children}
          </div>
        </section>
      </main>

      <footer role="contentinfo" className="mt-20">
        <div className="container">
          <div className="footer-grid">
            <div>
              <p className="footer-title">{config.blog.siteName}</p>
              <p className="footer-text opacity-70">
                Curating the largest database of vanilla Hytale servers and technical insights for the community.
              </p>
            </div>
            <div className="footer-links">
              <a className="link-pill" href="/"><i className="fa-solid fa-house"></i> Home</a>
              <a className="link-pill" href="/blog"><i className="fa-solid fa-book"></i> Blog</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export const PostList = ({ posts, basePath }: { posts: any[], basePath: string }) => {
  return (
    <div className="cards" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '40px 24px',
      alignItems: 'stretch'
    }}>
      {posts.map((post) => (
        <article key={post.slug} className="card pressable tilt group" style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible', // Allow image to float out
          marginTop: post.coverImage ? '20px' : '0'
        }}>
          {post.coverImage && (
            <div className="relative transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 overflow-hidden shadow-2xl border border-white/10" style={{
              width: '120px',
              height: '120px',
              aspectRatio: '1/1',
              borderRadius: '16px',
              margin: '-30px 24px 0 auto', // Floats up and out of the card
              zIndex: 2,
              background: 'var(--bg-2)'
            }}>
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          )}

          <div className="card-body" style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center" style={{ gap: '16px', marginBottom: '20px' }}>
              <span className="badge featured" style={{
                margin: 0,
                textTransform: 'uppercase',
                fontSize: '10px',
                letterSpacing: '0.06em',
                padding: '3px 10px',
                fontWeight: 900,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(94, 230, 255, 0.12)',
                border: '1px solid rgba(94, 230, 255, 0.3)'
              }}>
                {post.category}
              </span>
              <span className="text-xs opacity-40 font-bold uppercase tracking-widest" style={{ letterSpacing: '0.02em' }}>
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h3 className="text-xl font-bold leading-snug mb-3 group-hover:text-[var(--accent)] transition-colors" style={{ textTransform: 'none', fontFamily: 'inherit' }}>
              <a href={`${basePath}/${post.slug}`} className="hover:no-underline">
                {post.title}
              </a>
            </h3>

            <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed opacity-70 mb-6">
              {post.excerpt}
            </p>

            <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--accent)] cursor-pointer">
              <span>Read post</span>
              <i className="fa-solid fa-arrow-right text-[10px] transform group-hover:translate-x-1 transition-all"></i>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const PostDetail = ({ post }: { post: any }) => {
  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-10 text-center">
        <div className="badge featured mb-4" style={{ width: 'fit-content', margin: '0 auto', textTransform: 'lowercase' }}>
          #{post.category}
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tight leading-tight" style={{ fontFamily: 'var(--h-font)', textTransform: 'none' }}>
          {post.title}
        </h1>
        <div className="text-gray-400 text-sm">
          Published on <strong>{new Date(post.createdAt).toLocaleDateString()}</strong>
        </div>
      </header>

      {post.coverImage && (
        <div className="image-panel mb-12 shadow-2xl" style={{ minHeight: '340px' }}>
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="panel p-8 md:p-12 mb-12">
        <div className="blog-content prose prose-invert max-w-none text-gray-300 leading-relaxed" style={{ fontSize: '18px' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </div>

      {post.backlinks && post.backlinks.length > 0 && (
        <div className="panel p-6 border-l-4 border-[var(--accent)]">
          <h3 className="text-xl font-bold mb-4 title-with-icon" style={{ textTransform: 'none' }}>
            <i className="fa-solid fa-link"></i>
            Related Resources
          </h3>
          <ul className="space-y-3">
            {post.backlinks.map((link: string, i: number) => (
              <li key={i}>
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline flex items-center gap-2">
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
