"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  className?: string;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 600,
  direction = "up",
  className = "",
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [once]);

  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0) scale(1)";
    switch (direction) {
      case "up": return "translate3d(0, 50px, 0)";
      case "down": return "translate3d(0, -50px, 0)";
      case "left": return "translate3d(50px, 0, 0)";
      case "right": return "translate3d(-50px, 0, 0)";
      case "scale": return "scale(0.9)";
      default: return "translate3d(0, 0, 0)";
    }
  };

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${isVisible ? 'revealed' : ''} ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

// Staggered children animation wrapper
export function StaggeredReveal({
  children,
  staggerDelay = 100,
  baseDelay = 0,
  direction = "up",
  className = "",
}: {
  children: ReactNode[];
  staggerDelay?: number;
  baseDelay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  className?: string;
}) {
  return (
    <>
      {children.map((child, index) => (
        <ScrollReveal
          key={index}
          delay={baseDelay + index * staggerDelay}
          direction={direction}
          className={className}
        >
          {child}
        </ScrollReveal>
      ))}
    </>
  );
}

