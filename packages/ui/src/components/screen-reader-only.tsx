import React from "react";

export interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: "span" | "div";
}

export function ScreenReaderOnly({ children, as: Tag = "span" }: ScreenReaderOnlyProps) {
  return (
    <Tag className="sr-only">
      {children}
    </Tag>
  );
}
