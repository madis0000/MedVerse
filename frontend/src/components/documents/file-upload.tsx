import { useState, useRef, useCallback } from 'react';
import { useUploadDocument } from '@/api/documents';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Upload, FileUp, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/dicom',
];

const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.dcm';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const CATEGORIES = [
  { value: 'LAB_REPORT', label: 'Lab Report' },
  { value: 'IMAGING', label: 'Imaging' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'CONSENT', label: 'Consent Form' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'OTHER', label: 'Other' },
];

interface FileUploadProps {
  patientId: string;
  onUploadComplete?: () => void;
}

export function FileUpload({ patientId, onUploadComplete }: FileUploadProps) {
  const uploadDocument = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('OTHER');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`;
    }

    const isAcceptedType = ACCEPTED_TYPES.includes(file.type) ||
      file.name.toLowerCase().endsWith('.dcm');

    if (!isAcceptedType) {
      return 'Invalid file type. Accepted formats: PDF, JPEG, PNG, GIF, WebP, DICOM';
    }

    return null;
  };

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedFile(file);
    setUploadStatus('idle');
    setUploadProgress(0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !patientId) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('patientId', patientId);
    formData.append('category', category);

    setUploadStatus('uploading');
    setUploadProgress(0);

    // Simulate progress since axios doesn't provide upload progress with mutation
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await uploadDocument.mutateAsync(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      toast.success('Document uploaded successfully');
      onUploadComplete?.();

      // Reset after a brief delay
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setUploadProgress(0);
        setCategory('OTHER');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadStatus('error');
      setUploadProgress(0);
      toast.error(err.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          selectedFile && 'border-solid',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag and drop a file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, Images, or DICOM files up to 10MB
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {uploadStatus === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : uploadStatus === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <FileUp className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            {uploadStatus !== 'uploading' && (
              <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {uploadStatus === 'uploading' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {selectedFile && uploadStatus !== 'success' && (
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleUpload} disabled={uploadStatus === 'uploading'}>
            <Upload className="w-4 h-4 mr-2" />
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
}
