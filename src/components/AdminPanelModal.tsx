import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  Lock,
  CheckCircle,
  AlertCircle,
  Database,
  FileSpreadsheet,
  FileCode,
  File,
  Search,
  Box,
  KeyRound,
  Shield,
  Layers
} from 'lucide-react';
import { DocumentRecord } from '../types';
import { saveCustomModel, removeCustomModel } from '../utils/modelStorage';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentsUpdated?: () => void;
}

export function AdminPanelModal({ isOpen, onClose, onDocumentsUpdated }: AdminPanelModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'documents' | 'uploadModel' | 'supabase' | 'testKb'>('documents');

  // Document management state
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Replacement modal / state
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);

  // KB Query testing state
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTestingKb, setIsTestingKb] = useState(false);

  // Supabase status
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);

  // Model upload state
  const [modelUploadStatus, setModelUploadStatus] = useState<string | null>(null);
  const [logoUploadStatus, setLogoUploadStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if token exists in session
    const savedToken = sessionStorage.getItem('vsb_admin_token');
    if (savedToken) {
      setIsAuthenticated(true);
      fetchDocuments(savedToken);
      fetchSupabaseStatus(savedToken);
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: adminKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      sessionStorage.setItem('vsb_admin_token', data.token);
      setIsAuthenticated(true);
      fetchDocuments(data.token);
      fetchSupabaseStatus(data.token);
    } catch (err: any) {
      setAuthError(err.message || 'Incorrect administrative secret key');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('vsb_admin_token');
    setIsAuthenticated(false);
    setAdminKey('');
  };

  const fetchDocuments = async (token?: string) => {
    const t = token || sessionStorage.getItem('vsb_admin_token');
    setIsLoadingDocs(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchSupabaseStatus = async (token?: string) => {
    const t = token || sessionStorage.getItem('vsb_admin_token');
    try {
      const res = await fetch('/api/admin/supabase-status', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setSupabaseStatus(data);
    } catch (err) {
      console.error('Failed to get Supabase status:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = sessionStorage.getItem('vsb_admin_token');
    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Upload failed');
      }
      setUploadStatus({ type: 'success', message: data.message });
      fetchDocuments(token || undefined);
      onDocumentsUpdated?.();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message || 'Error processing document' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplaceDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingDocId) return;

    const token = sessionStorage.getItem('vsb_admin_token');
    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/documents/${replacingDocId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Replacement failed');
      }
      setUploadStatus({ type: 'success', message: data.message });
      setReplacingDocId(null);
      fetchDocuments(token || undefined);
      onDocumentsUpdated?.();
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message || 'Error replacing document' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the VSB Knowledge Base?`)) {
      return;
    }
    const token = sessionStorage.getItem('vsb_admin_token');
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setUploadStatus({ type: 'success', message: data.message });
      fetchDocuments(token || undefined);
      onDocumentsUpdated?.();
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message });
    }
  };

  const handleUploadModel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.glb')) {
      setModelUploadStatus('Error: Only 3D GLB (.glb) binary models are supported.');
      return;
    }

    if (file.size < 512) {
      setModelUploadStatus('Error: The selected file is empty or corrupted (under 512 bytes).');
      return;
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const token = sessionStorage.getItem('vsb_admin_token');
    setModelUploadStatus(`Processing "${file.name}" (${sizeMB} MB)...`);

    // 1. Instantly store in IndexedDB and activate in 3D viewer via live event
    try {
      const blobUrl = await saveCustomModel(file);
      window.dispatchEvent(new CustomEvent('vsb-model-updated', { detail: { url: blobUrl } }));
    } catch (cacheErr: any) {
      console.warn('Local preview cache error:', cacheErr);
      setModelUploadStatus(`Error: ${cacheErr.message || 'Invalid GLB file'}`);
      return;
    }

    // 2. Upload to server storage
    const formData = new FormData();
    formData.append('model', file);

    try {
      const res = await fetch('/api/admin/model', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        const cleanMsg = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
        throw new Error(cleanMsg || `Server returned HTTP ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Upload failed (Status ${res.status})`);
      }

      setModelUploadStatus(`Success: Model "${file.name}" (${sizeMB} MB) uploaded and active in 3D viewer!`);
      if (modelInputRef.current) modelInputRef.current.value = '';
    } catch (err: any) {
      // If server returned error but client preview succeeded
      setModelUploadStatus(`Active in 3D viewer (${sizeMB} MB). (Server status: ${err.message})`);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = sessionStorage.getItem('vsb_admin_token');
    setLogoUploadStatus('Uploading official college logo...');

    // Also read as data URL for instant reactive preview across the app
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        try {
          localStorage.setItem('custom_vsb_logo', reader.result);
          window.dispatchEvent(new Event('vsb-logo-updated'));
        } catch {
          // ignore
        }
      }
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/admin/logo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Logo upload failed');
      setLogoUploadStatus(`Success: ${data.message} (${Math.round(file.size / 1024)} KB). Logo updated across all views!`);
      window.dispatchEvent(new Event('vsb-logo-updated'));
      if (logoInputRef.current) logoInputRef.current.value = '';
    } catch (err: any) {
      setLogoUploadStatus(`Success: Logo updated locally. (${err.message})`);
      window.dispatchEvent(new Event('vsb-logo-updated'));
    }
  };

  const handleTestKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setIsTestingKb(true);
    try {
      const res = await fetch('/api/admin/test-kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery }),
      });
      const data = await res.json();
      setTestResults(data.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestingKb(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    }
    if (ext === 'pdf') {
      return <FileText className="w-4 h-4 text-rose-400" />;
    }
    if (ext === 'docx' || ext === 'doc') {
      return <FileText className="w-4 h-4 text-blue-400" />;
    }
    return <FileCode className="w-4 h-4 text-amber-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden text-slate-900">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                VSB Administrative Knowledge Management
                {isAuthenticated && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Authorized Staff
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Official document indexing, file lifecycle, 3D mascot management, and Supabase database status
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-xs font-medium"
              >
                Lock Panel
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          /* Login Screen */
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">College Administrator Authentication</h4>
            <p className="text-xs text-slate-600 max-w-md mb-6">
              Only authorized staff of VSB Engineering College are permitted to upload or modify knowledge base records and institutional files.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3">
              <div>
                <input
                  type="password"
                  placeholder="Enter administrator secret key..."
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Verify Credentials</span>
              </button>

              <div className="pt-2 text-[11px] text-slate-500">
                Default initial key configured: <code className="text-slate-800 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded font-mono">vsbadmin2025</code>
              </div>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Bar */}
            <div className="flex items-center gap-1 px-4 border-b border-slate-200 bg-slate-50/80 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-3 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'documents'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>College Documents ({documents.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('testKb')}
                className={`px-3 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'testKb'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Knowledge Retrieval Tester</span>
              </button>
              <button
                onClick={() => setActiveTab('uploadModel')}
                className={`px-3 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'uploadModel'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D Mascot &amp; College Logo</span>
              </button>
              <button
                onClick={() => setActiveTab('supabase')}
                className={`px-3 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'supabase'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Supabase Database &amp; Auth</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Tab 1: Documents Management */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  {/* Upload Drop Area */}
                  <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50/20 transition-colors flex flex-col items-center justify-center text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="admin-file-upload"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="admin-file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-2 border border-blue-200 shadow-xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900 mb-1">
                        {isUploading ? 'Extracting & Indexing Document...' : 'Upload Official VSB College Document'}
                      </span>
                      <span className="text-[11px] text-slate-500 max-w-sm">
                        Supports <strong>.xlsx, .csv, .pdf, .docx, .txt</strong> (Max 25MB). Content is parsed and indexed directly into the Gemini chatbot's retrieval base.
                      </span>
                    </label>
                  </div>

                  {/* Hidden Input for Document Replacement */}
                  <input
                    ref={replaceInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf,.docx,.txt"
                    onChange={handleReplaceDocument}
                    className="hidden"
                  />

                  {/* Status Banner */}
                  {uploadStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                        uploadStatus.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {uploadStatus.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        )}
                        <span>{uploadStatus.message}</span>
                      </div>
                      <button
                        onClick={() => setUploadStatus(null)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Documents List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Indexed College Knowledge Files ({documents.length})
                      </h4>
                      <button
                        onClick={() => fetchDocuments()}
                        className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Refresh
                      </button>
                    </div>

                    {isLoadingDocs ? (
                      <div className="p-8 text-center text-xs text-slate-400">Loading documents...</div>
                    ) : documents.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
                        No documents indexed yet. Upload a document above to feed the college chatbot.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white transition-colors"
                          >
                            <div className="flex items-start gap-2.5 overflow-hidden">
                              <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0 shadow-xs">
                                {getFileIcon(doc.name)}
                              </div>
                              <div className="overflow-hidden">
                                <span className="font-semibold text-slate-900 block truncate">{doc.name}</span>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                  <span>{Math.round(doc.size / 1024)} KB</span>
                                  <span>•</span>
                                  <span className="text-blue-600 font-medium">{doc.chunkCount} indexed sections</span>
                                  <span>•</span>
                                  <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                </div>
                                {doc.rawTextPreview && (
                                  <p className="text-[11px] text-slate-600 truncate mt-1 italic">
                                    "{doc.rawTextPreview}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <button
                                onClick={() => {
                                  setReplacingDocId(doc.id);
                                  replaceInputRef.current?.click();
                                }}
                                title="Replace with updated file"
                                className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs flex items-center gap-1 transition-colors shadow-xs font-medium"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Replace</span>
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                title="Delete document"
                                className="p-1.5 rounded-md bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors shadow-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Knowledge Retrieval Tester */}
              {activeTab === 'testKb' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <p>
                      Test which indexed chunks are retrieved by the server when a student asks a specific query. The AI assistant uses only these actual retrieved facts when answering.
                    </p>
                  </div>

                  <form onSubmit={handleTestKb} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. What is the TNEA code? or What are the bus fees?"
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                    />
                    <button
                      type="submit"
                      disabled={isTestingKb}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isTestingKb ? 'Searching...' : 'Test Retrieval'}</span>
                    </button>
                  </form>

                  {testResults.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-slate-800">
                        Matching Chunks ({testResults.length}):
                      </h5>
                      {testResults.map((chunk, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-500 text-[10px]">
                            <span className="font-semibold text-blue-700">Source: {chunk.documentName}</span>
                            <span>Chunk #{chunk.index}</span>
                          </div>
                          <p className="text-slate-800 whitespace-pre-wrap">{chunk.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Upload Custom 3D Penguin Model */}
              {activeTab === 'uploadModel' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <Box className="w-4 h-4 text-blue-600" />
                      Target Model: <code className="text-blue-700 font-mono">Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb</code>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Upload your 3D mascot model in binary GLB format (<code className="text-slate-800 font-mono">.glb</code>, up to 150 MB). The uploaded 3D model immediately updates in the live 3D mascot viewport and persists across sessions.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={modelInputRef}
                        type="file"
                        accept=".glb,model/gltf-binary"
                        onChange={handleUploadModel}
                        className="hidden"
                        id="penguin-model-upload"
                      />
                      <label
                        htmlFor="penguin-model-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs cursor-pointer transition-colors shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Select .glb Model to Replace</span>
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await removeCustomModel();
                            window.dispatchEvent(new CustomEvent('vsb-model-updated', { detail: { url: null } }));
                            setModelUploadStatus('Reset to default official VSB Tech Penguin mascot model.');
                            if (modelInputRef.current) modelInputRef.current.value = '';
                          } catch (err: any) {
                            setModelUploadStatus(`Error resetting: ${err.message}`);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reset to Default 3D Model</span>
                      </button>
                    </div>

                    {modelUploadStatus && (
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-mono shadow-xs">
                        {modelUploadStatus}
                      </div>
                    )}
                  </div>

                  {/* College Official Logo Upload */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Official College Emblem / Logo</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Upload your official VSB Engineering College logo (.svg, .png, or .jpg). The uploaded emblem will immediately appear at the top-left of the sidebar and top navigation bar.
                    </p>

                    <input
                      ref={logoInputRef}
                        type="file"
                        accept=".svg,.png,.jpg,.jpeg"
                        onChange={handleUploadLogo}
                        className="hidden"
                        id="college-logo-upload"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="college-logo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs cursor-pointer transition-colors shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Custom Logo (.svg/.png)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            localStorage.removeItem('custom_vsb_logo');
                            window.dispatchEvent(new Event('vsb-logo-updated'));
                            setLogoUploadStatus('Reset to official VSB Engineering College crest emblem.');
                          } catch {
                            // ignore
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-xs transition-colors shadow-xs"
                      >
                        <span>Reset to Official Crest</span>
                      </button>
                    </div>

                    {logoUploadStatus && (
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-mono shadow-xs">
                        {logoUploadStatus}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Supabase Database & Auth */}
              {activeTab === 'supabase' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-600" />
                        Supabase Database, Storage &amp; Auth Integration
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          supabaseStatus?.configured
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {supabaseStatus?.configured ? 'Configured' : 'Standby (Server Storage Active)'}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed">
                      The application includes built-in persistent storage for document indexing and admin authentication. When you connect Supabase, documents and authentication are seamlessly synced with your remote Supabase PostgreSQL database and Storage bucket.
                    </p>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px]">
                      <div className="text-slate-600">SUPABASE_URL: <span className="text-slate-900">{supabaseStatus?.url || 'Not set'}</span></div>
                      <div className="text-slate-600">Connection Status: <span className={supabaseStatus?.connected ? 'text-emerald-700' : 'text-amber-700'}>{supabaseStatus?.message || 'Ready for configuration'}</span></div>
                    </div>

                    <div className="space-y-1.5 text-slate-600">
                      <p className="font-semibold text-slate-800">How to configure Supabase:</p>
                      <ol className="list-decimal list-inside space-y-1 pl-1">
                        <li>Create a project on supabase.com.</li>
                        <li>Add <code className="text-blue-700">SUPABASE_URL</code> and <code className="text-blue-700">SUPABASE_ANON_KEY</code> (or service key) to your environment.</li>
                        <li>Restart or reload; the chatbot will automatically utilize Supabase tables for records.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>VSB Engineering College Knowledge Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
