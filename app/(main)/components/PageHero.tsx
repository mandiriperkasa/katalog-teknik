'use client';

import { motion } from 'framer-motion';

type PageHeroProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
};

export default function PageHero({ eyebrow, title, description, children, aside }: PageHeroProps) {
  const copy = (
    <>
      <div className="site-eyebrow">{eyebrow}</div>
      <h1 className="page-title">{title}</h1>
      <p className="page-description">{description}</p>
      {children}
    </>
  );

  return (
    <section className={`page-hero section-shell ${aside ? 'page-hero-with-aside' : ''}`}>
      {aside ? (
        <div className="page-hero-layout">
          <motion.div
            initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 min-w-0"
          >
            {copy}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="page-hero-aside"
          >
            {aside}
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-4xl"
        >
          {copy}
        </motion.div>
      )}
    </section>
  );
}
