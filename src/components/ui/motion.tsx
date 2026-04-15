"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, type Transition } from "framer-motion";

const defaultTransition: Transition = { duration: 0.25, ease: [0.22, 1, 0.36, 1] };

type FadeInProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
};

export const FadeIn = React.forwardRef<HTMLDivElement, FadeInProps>(
  ({ delay = 0, y = 8, transition, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...defaultTransition, delay, ...transition }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FadeIn.displayName = "FadeIn";

type StaggerProps = HTMLMotionProps<"div"> & {
  delayChildren?: number;
  staggerChildren?: number;
};

export const Stagger = React.forwardRef<HTMLDivElement, StaggerProps>(
  ({ delayChildren = 0, staggerChildren = 0.05, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { delayChildren, staggerChildren } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
Stagger.displayName = "Stagger";

export const StaggerItem = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: defaultTransition },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerItem.displayName = "StaggerItem";

export { motion };
