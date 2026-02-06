import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { Download, FileText, Image, File } from 'lucide-react';

interface DocumentData {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentData | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(fileType: string): boolean {
  return fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileType);
}

function isPdfType(fileType: string): boolean {
  return fileType === 'application/pdf' || fileType.toLowerCase().endsWith('.pdf');
}

function getFileIcon(fileType: string) {
  if (isImageType(fileType)) return Image;
  if (isPdfType(fileType)) return FileText;
  return File;
}

export function DocumentViewer({ open, onOpenChange, document }: DocumentViewerProps) {
  if (!document) return null;

  const FileIcon = getFileIcon(document.fileType);
  const isImage = isImageType(document.fileType);
  const isPdf = isPdfType(document.fileType);

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.target = '_blank';
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileIcon className="w-5 h-5 text-muted-foreground" />
              {document.fileName}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-3 pb-3 border-b">
          <Badge variant="outline">{document.category.replace('_', ' ')}</Badge>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(document.fileSize)}
          </span>
          {document.uploadedBy && (
            <span className="text-xs text-muted-foreground">
              Uploaded by {document.uploadedBy.firstName} {document.uploadedBy.lastName}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDateTime(document.createdAt)}
          </span>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-[300px]">
          {isImage && (
            <div className="flex items-center justify-center p-4">
              <img
                src={document.fileUrl}
                alt={document.fileName}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
          )}

          {isPdf && (
            <div className="h-[60vh]">
              <iframe
                src={document.fileUrl}
                title={document.fileName}
                className="w-full h-full rounded-lg border"
              />
            </div>
          )}

          {!isImage && !isPdf && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <File className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Preview not available for this file type
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {document.fileType || 'Unknown type'} - {formatFileSize(document.fileSize)}
              </p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
