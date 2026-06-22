export const motionTokens = {
  duration: {
    instant: "0ms",
    fast: "100ms",
    normal: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
  easing: {
    linear: "linear",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  transition: {
    none: "none",
    all: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    colors:
      "color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), fill 200ms cubic-bezier(0.4, 0, 0.2, 1), stroke 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: "opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    transform: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    shadow: "box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

export type MotionTokens = typeof motionTokens;

export const componentTransitions = {
  button: {
    default: motionTokens.transition.colors,
    transform: motionTokens.transition.transform,
  },
  input: {
    default: motionTokens.transition.colors,
  },
  badge: {
    default: motionTokens.transition.colors,
  },
  avatar: {
    default: motionTokens.transition.all,
  },
  dialog: {
    overlay: `opacity ${motionTokens.duration.normal} ${motionTokens.easing.easeOut}`,
    content: `opacity ${motionTokens.duration.normal} ${motionTokens.easing.easeOut}, transform ${motionTokens.duration.normal} ${motionTokens.easing.spring}`,
  },
  skeleton: {
    pulse: `opacity 1.5s ${motionTokens.easing.easeInOut} infinite`,
  },
  sidebar: {
    chevron: `transform ${motionTokens.duration.fast} ${motionTokens.easing.easeOut}`,
  },
  dropdown: {
    default: `opacity ${motionTokens.duration.fast} ${motionTokens.easing.easeOut}, transform ${motionTokens.duration.fast} ${motionTokens.easing.easeOut}`,
  },
  tooltip: {
    default: `opacity ${motionTokens.duration.fast} ${motionTokens.easing.easeOut}, transform ${motionTokens.duration.fast} ${motionTokens.easing.easeOut}`,
  },
} as const;

export type ComponentTransitions = typeof componentTransitions;
