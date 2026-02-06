import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { usePatientDocuments, useDeleteDocument } from '@/api/documents';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/documents/file-upload';
import { DocumentViewer } from '@/components/documents/document-viewer';
import { formatDateTime } from '@/lib/utils';
import {
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  FolderOpen,
  Upload,
  Image,
  File,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Patient } from '@/types';

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'LAB_REPORT', label: 'Lab Report' },
  { value: 'IMAGING', label: 'Imaging' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'CONSENT', label: 'Consent Form' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'OTHER', label: 'Other' },
];

const CATEGORY_ICONS: Record<string, any> = {
  LAB_REPORT: ClipboardList,
  IMAGING: Image,
  REFERRAL: FileText,
  CONSENT: FileText,
  INSURANCE: FileText,
  OTHER: File,
};

const CATEGORY_COLORS: Record<string, string> = {
  LAB_REPORT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IMAGING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  REFERRAL: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CONSENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  INSURANCE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

interface DocumentRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  patientId: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

function usePatientSearch(query: string) {
  return useQuery({
    queryKey: ['patients', 'search', query],
    queryFn: async () => {
      const { data } = await apiClient.get('/patients', {
        params: { search: query, limit: 10 },
      });
      return data;
    },
    enabled: query.length >= 2,
  });
}

export function DocumentManagerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewingDocument, setViewingDocument] = useState<DocumentRecord | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const { data: searchResults } = usePatientSearch(searchQuery);
  const { data: documentsData, isLoading: docsLoading, refetch: refetchDocs } = usePatientDocuments(
    selectedPatient?.id || '',
  );
  const deleteDocument = useDeleteDocument();

  const patients: Patient[] = searchResults?.data || [];
  const allDocuments: DocumentRecord[] = documentsData?.data || [];

  const documents =
    categoryFilter === 'ALL'
      ? allDocuments
      : allDocuments.filter((doc) => doc.category === categoryFilter);

  // Group documents by category
  const grouped = documents.reduce<Record<string, DocumentRecord[]>>((acc, doc) => {
    const cat = doc.category || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setCategoryFilter('ALL');
  };

  const handleDeleteDocument = async (doc: DocumentRecord) => {
    try {
      await deleteDocument.mutateAsync(doc.id);
      toast.success('Document deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleDownload = (doc: DocumentRecord) => {
    const link = window.document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.target = '_blank';
    link.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <PageWrapper
      title="Documents"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Documents' },
      ]}
    >
      <div className="space-y-6">
        {/* Patient Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients by name or MRN..."
                  className="pl-10"
                />
                {searchQuery.length >= 2 && patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                          {patient.firstName?.[0]}
                          {patient.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">MRN: {patient.mrn}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedPatient && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
                  <span className="text-sm font-medium text-primary">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </span>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="text-primary hover:text-primary/80"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedPatient ? (
          <>
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
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
              <Button onClick={() => setShowUpload(!showUpload)}>
                <Upload className="w-4 h-4 mr-2" />
                {showUpload ? 'Hide Upload' : 'Upload Document'}
              </Button>
            </div>

            {/* Upload Area */}
            {showUpload && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    patientId={selectedPatient.id}
                    onUploadComplete={() => refetchDocs()}
                  />
                </CardContent>
              </Card>
            )}

            {/* Document List */}
            {docsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No documents found"
                description={
                  categoryFilter !== 'ALL'
                    ? 'No documents found in this category. Try selecting a different filter.'
                    : 'No documents uploaded for this patient yet.'
                }
                action={
                  !showUpload ? (
                    <Button onClick={() => setShowUpload(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([category, docs]) => {
                  const CategoryIcon = CATEGORY_ICONS[category] || File;
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">
                          {category.replace('_', ' ')}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {docs.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {docs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                  CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.OTHER
                                }`}
                              >
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {doc.fileName}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                  <span>-</span>
                                  <span>{formatDateTime(doc.createdAt)}</span>
                                  {doc.uploadedBy && (
                                    <>
                                      <span>-</span>
                                      <span>
                                        by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingDocument(doc)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="Select a patient"
            description="Search for a patient above to view and manage their documents."
          />
        )}
      </div>

      <DocumentViewer
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        document={viewingDocument}
      />
    </PageWrapper>
  );
}
