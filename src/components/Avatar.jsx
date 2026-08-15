import React from 'react';

export const Avatar = ({
  avatar = '🦉',
  size = 32,
  borderRadius = '50%',
  backgroundColor = 'transparent',
  className = '',
  style = {},
  alt = 'Avatar'
}) => {
  const isImage = typeof avatar === 'string' && avatar.startsWith('data:image');

  if (isImage) {
    return (
      <span
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          borderRadius,
          overflow: 'hidden',
          backgroundColor,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style
        }}
      >
        <img
          src={avatar}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius,
        backgroundColor,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.max(12, Math.round(size * 0.55))}px`,
        lineHeight: 1,
        userSelect: 'none',
        flexShrink: 0,
        ...style
      }}
    >
      {avatar || '🦉'}
    </span>
  );
};
