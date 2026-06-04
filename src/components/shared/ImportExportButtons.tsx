import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Upload } from 'lucide-react';

interface Props {
  onExport: () => void;
  onImport: () => void;
  onPrint?: () => void;
}

export function ImportExportButtons({ onExport, onImport, onPrint }: Props) {
  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>
      <Button variant="outline" size="sm" onClick={onImport}>
        <Upload className="w-4 h-4 mr-2" />
        Import
      </Button>
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}
