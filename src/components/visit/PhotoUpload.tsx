import React from 'react';

export function PhotoUpload({ onUpload }: { onUpload?: (urls: string[]) => void }) {
  return (
    <div>
      <input type="file" multiple />
    </div>
  );
}
