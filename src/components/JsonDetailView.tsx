'use client';

import * as Dialog from '@radix-ui/react-dialog';

interface JsonDetailViewProps {
  data: any;
  open: boolean;
  onClose: () => void;
}

export function JsonDetailView({ data, open, onClose }: JsonDetailViewProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-6 rounded-lg w-[800px] max-h-[80vh]">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold">Row Details</Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-gray-700">
              ✕
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Detailed view of the selected database record in JSON format
          </Dialog.Description>
          <pre className="bg-black/5 p-4 rounded overflow-auto max-h-[60vh] font-mono text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
