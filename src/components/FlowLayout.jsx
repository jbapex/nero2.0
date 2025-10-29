import React from 'react';

const FlowLayout = ({ children }) => {
  return (
    <main className="w-screen h-screen overflow-hidden bg-background">
      {children}
    </main>
  );
};

export default FlowLayout;