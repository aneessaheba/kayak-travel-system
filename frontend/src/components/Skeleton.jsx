import React from 'react';

const Skeleton = ({ className = '', variant = 'default' }) => {
  const variants = {
    default: 'h-4 bg-gray-200 rounded',
    card: 'h-48 bg-gray-200 rounded-xl',
    text: 'h-4 bg-gray-200 rounded',
    title: 'h-6 bg-gray-200 rounded w-3/4',
    avatar: 'w-12 h-12 bg-gray-200 rounded-full',
  };

  return (
    <div
      className={`${variants[variant]} ${className} animate-pulse`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="card p-6">
      <div className="flex items-start space-x-4 mb-4">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" />
          <Skeleton variant="text" className="w-2/3" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" className="w-5/6" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t">
        <Skeleton variant="text" className="w-20 h-6" />
        <Skeleton variant="text" className="w-24 h-10 rounded-lg" />
      </div>
    </div>
  );
};

export default Skeleton;

