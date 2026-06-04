import React from 'react';

export function StaffCard(props: any) {
  return (
    <div className="border rounded-md p-4 bg-card">
      <h3 className="font-semibold">{props.full_name || 'Unnamed Staff'}</h3>
      <p className="text-sm text-muted-foreground">{props.email || 'No email'}</p>
    </div>
  );
}
