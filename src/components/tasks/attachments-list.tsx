'use client';

import * as React from 'react';
import { uploadFile, getAttachments } from '@/actions/upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, FileIcon, Loader2 } from 'lucide-react';
import { Attachment } from '@/lib/types';

interface AttachmentsListProps {
  taskId: number;
}

export function AttachmentsList({ taskId }: AttachmentsListProps) {
  const [files, setFiles] = React.useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadFiles = React.useCallback(async () => {
    const data = await getAttachments(taskId);
    setFiles(data);
  }, [taskId]);

  React.useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
          await uploadFile(taskId, formData);
          await loadFiles();
          if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
          console.error("Upload failed", error);
      } finally {
          setIsUploading(false);
      }
  };

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-medium mb-2">Attachments</h3>

      <div className="space-y-2">
          {files.map(file => (
              <a
                key={file.id}
                href={file.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-2 rounded-md border bg-muted/50 hover:bg-muted transition-colors text-sm"
              >
                  <FileIcon className="w-4 h-4 mr-2" />
                  {file.fileName}
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
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Paperclip className="w-4 h-4 mr-2" />}
              {isUploading ? "Uploading..." : "Add Attachment"}
          </Button>
      </div>
    </div>
  );
}
