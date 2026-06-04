import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function AddJobDialog({ onAdd }: { onAdd?: () => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Job</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Job</DialogTitle>
        </DialogHeader>
        <div className="p-4">Job form stub</div>
      </DialogContent>
    </Dialog>
  );
}
