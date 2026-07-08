import type { Transition, Variants } from "framer-motion";

import { motionEasing } from "./tokens";

/** Standard spring used for interactive, physical-feeling transitions. */
export const springTransition: Transition = motionEasing.spring;

/** Softer spring for larger surfaces (cards, sheets, page containers). */
export const gentleSpringTransition: Transition = motionEasing.gentleSpring;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.28, ease: motionEasing.standard },
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.12, ease: motionEasing.standard },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.08, ease: motionEasing.standard },
  },
};

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: motionEasing.standard },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.18, ease: motionEasing.standard },
  },
};

/** Applies a staggered `riseIn` to direct children — use on list/grid containers. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.015,
      delayChildren: 0,
    },
  },
};

export const tapScale = { scale: 0.96 };
export const tapScaleSubtle = { scale: 0.98 };

/** Snappy press feedback for small, icon-sized controls (nav items, chips). */
export const tapScaleFirm = { scale: 0.88 };
