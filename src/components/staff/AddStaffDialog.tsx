import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function AddStaffDialog({ onAdd }: { onAdd?: () => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Staff</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Staff</DialogTitle>
        </DialogHeader>
        <div className="p-4">Staff form stub</div>
      </DialogContent>
    </Dialog>
  );
}
