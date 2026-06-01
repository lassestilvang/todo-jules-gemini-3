'use client';

import * as React from 'react';
import { uploadFile, getAttachments } from '@/actions/upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, FileIcon, Loader2 } from 'lucide-react';
import { Attachment } from '@/lib/types';
import { toast } from 'sonner';

interface AttachmentsListProps {
  taskId: number;
  initialAttachments?: Attachment[] | null;
}

export function AttachmentsList({ taskId, initialAttachments }: AttachmentsListProps) {
  const [files, setFiles] = React.useState<Attachment[]>(initialAttachments || []);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadFiles = React.useCallback(async () => {
    const data = await getAttachments(taskId);
    setFiles(data);
  }, [taskId]);

  React.useEffect(() => {
    if (initialAttachments === undefined) {
        loadFiles();
    } else if (initialAttachments !== null) {
        setFiles(initialAttachments);
    }
  }, [taskId, initialAttachments, loadFiles]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
          const newAttachment = await uploadFile(taskId, formData);
          if (newAttachment) {
              setFiles(prev => [...(prev || []), newAttachment]);
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
          toast.success("Attachment uploaded successfully");
      } catch (error) {
          toast.error(error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message) : "Upload failed"));
      } finally {
          setIsUploading(false);
      }
  };

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-medium mb-2">Attachments</h3>

      <div className="space-y-2">
          {files.length === 0 && (
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 border border-dashed rounded-md text-center space-y-2">
                  <Paperclip className="w-6 h-6 text-muted-foreground opacity-50" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">No attachments yet.<br/><span className="text-xs">Add files relevant to this task.</span></p>
              </div>
          )}
          {files.map(file => (
              <a
                key={file.id}
                href={file.filePath}
                target="_blank"
                rel="noopener noreferrer"
                title={file.fileName}
                className="flex items-center p-2 rounded-md border bg-muted/50 hover:bg-muted transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden"
              >
                  <FileIcon className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
                  <span className="truncate">{file.fileName}</span>
              </a>
          ))}
      </div>

      <div className="flex items-center mt-2">
          <Input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : <Paperclip className="w-4 h-4 mr-2" aria-hidden="true" />}
              {isUploading ? "Uploading..." : "Add Attachment"}
          </Button>
      </div>
    </div>
  );
}
