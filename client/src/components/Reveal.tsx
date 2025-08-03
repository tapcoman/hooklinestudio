import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionSafe } from '../hooks/useReducedMotionSafe';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const prefersReducedMotion = useReducedMotionSafe();

  const variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.28,
        delay: prefersReducedMotion ? 0 : delay,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

interface RevealStaggerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  /** For dynamic panels, prefer animate over whileInView */
  inert?: boolean;
}

export function RevealStagger({ 
  children, 
  className, 
  staggerDelay = 0.06,
  inert = false 
}: RevealStaggerProps) {
  const prefersReducedMotion = useReducedMotionSafe();
  const items = React.Children.toArray(children); // preserves keys

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: prefersReducedMotion ? 0 : staggerDelay },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.28, ease: "easeOut" },
    },
  };

  // For dynamic panels, avoid whileInView (causes retriggers when height changes)
  const motionProps = inert
    ? { initial: "hidden" as const, animate: "visible" as const }
    : { initial: "hidden" as const, whileInView: "visible" as const, viewport: { once: true, margin: "-50px" } };

  return (
    <motion.div className={className} variants={containerVariants} {...motionProps}>
      {items.map((child) => (
        <motion.div key={(child as React.ReactElement).key ?? undefined} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}