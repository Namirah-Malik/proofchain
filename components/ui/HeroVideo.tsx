"use client";

import { useEffect, useRef } from "react";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Some browsers ignore the `muted` JSX attribute on <video> because it
    // only sets the DOM attribute, not the IDL property autoplay actually
    // checks -- setting it imperatively guarantees autoplay isn't blocked.
    v.muted = true;
    v.play().catch(() => {
      // Autoplay can still be refused in rare cases (e.g. data-saver mode);
      // the poster frame remains visible either way, so this is a silent
      // graceful fallback rather than an error state.
    });
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/hero-poster.jpg"
      aria-hidden
    >
      <source src="/hero-animation.mp4" type="video/mp4" />
    </video>
  );
}
