'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const INTRO_STORAGE_KEY = 'katalog-mp-background-intro-v6';

export default function SiteBackground() {
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [playIntro, setPlayIntro] = useState(false);

  useEffect(() => {
    let hasPlayed = false;

    try {
      hasPlayed = window.sessionStorage.getItem(INTRO_STORAGE_KEY) === '1';

      if (!hasPlayed) {
        window.sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
      }
    } catch {
      // Jika sessionStorage ditolak browser, animasi pembuka tetap aman.
    }

    const frameId = window.requestAnimationFrame(() => {
      setPlayIntro(!hasPlayed && !reduceMotion);
      setReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [reduceMotion]);

  const pathInitial = playIntro ? { pathLength: 0, opacity: 0 } : false;

  return (
    <div
      className={'site-background site-background-v5' + (ready ? ' is-ready' : '')}
      aria-hidden="true"
    >
      <div className="site-background-v5-grid" />
      <div className="site-background-v5-glow site-background-v5-glow-one" />
      <div className="site-background-v5-glow site-background-v5-glow-two" />
      <div className="site-background-v5-ring site-background-v5-ring-one" />
      <div className="site-background-v5-ring site-background-v5-ring-two" />

      {ready && (
        <div className="site-background-v5-mark-wrap">
          <motion.svg
            key={playIntro ? 'intro' : 'static'}
            className="site-background-v5-mark"
            viewBox="0 0 1200 620"
            preserveAspectRatio="xMidYMid meet"
            initial={playIntro ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{
              duration: playIntro ? 0.55 : 0,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.path
              className="site-background-v5-stroke"
              d="M105 515V105L320 345L535 105V515"
              initial={pathInitial}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: {
                  duration: playIntro ? 1.45 : 0,
                  delay: playIntro ? 0.08 : 0,
                  ease: [0.22, 1, 0.36, 1],
                },
                opacity: { duration: playIntro ? 0.3 : 0 },
              }}
            />
            <motion.path
              className="site-background-v5-stroke"
              d="M685 515V105H885C1020 105 1095 158 1095 250C1095 342 1020 395 885 395H685"
              initial={pathInitial}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: {
                  duration: playIntro ? 1.55 : 0,
                  delay: playIntro ? 0.22 : 0,
                  ease: [0.22, 1, 0.36, 1],
                },
                opacity: { duration: playIntro ? 0.3 : 0 },
              }}
            />
          </motion.svg>
        </div>
      )}
    </div>
  );
}
