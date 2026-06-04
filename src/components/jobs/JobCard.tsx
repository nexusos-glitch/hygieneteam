import React from 'react';

export function JobCard(props: any) {
  return (
    <div className="p-4 border rounded-md">
      Job: {props.id}
    </div>
  );
}
