import React from 'react';

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <h1 className="text-5xl font-bold mb-4">404</h1>
    <p className="text-xl mb-4">Page Not Found</p>
    <a href="/" className="text-blue-600 underline">Go Home</a>
  </div>
);

export default NotFound;
