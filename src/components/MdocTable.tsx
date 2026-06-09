import React from 'react';

export default function MdocTable({ children }: { children?: React.ReactNode }) {
  if (!children) {
    return null;
  }

  return (
    <table>
      {children}
    </table>
  );
}