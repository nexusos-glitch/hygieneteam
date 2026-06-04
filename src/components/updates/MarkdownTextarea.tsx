import React from 'react';

export function MarkdownTextarea(props: any) {
  return (
    <textarea {...props} className="w-full min-h-[200px] border rounded-md p-2" />
  );
}
