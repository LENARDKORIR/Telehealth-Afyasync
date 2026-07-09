import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { patientService } from '../services/patientService';
import { recordsService } from '../services/recordsService';
import type { Patient } from '../types/patient';
import type { CareTimelineItem, ClinicalDocument, LabResult, LabResultStatus } from '../types/record';
import { getPatientLanguagePack } from '../utils/patientLanguage';

const today = new Date().toISOString().slice(0, 10);
const maxDocumentBytes = 5 * 1024 * 1024;

const statusStyles: Record<LabResultStatus, string> = {
  normal: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  abnormal: 'border-amber-200 bg-amber-50 text-amber-700',
  critical: 'border-rose-200 bg-rose-50 text-rose-700',
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };

    reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const Records = () => {
  const { user } = useAuth();
  const languagePack = getPatientLanguagePack(user?.id);
  const [activeTab, setActiveTab] = useState<'timeline' | 'inbox' | 'labs' | 'documents'>('inbox');
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [timelineItems, setTimelineItems] = useState<CareTimelineItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingLab, setSavingLab] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [labForm, setLabForm] = useState({
    patientId: '',
    testName: '',
    resultValue: '',
    unit: '',
    referenceRange: '',
    status: 'normal' as LabResultStatus,
    resultDate: today,
    notes: '',
  });
  const [documentForm, setDocumentForm] = useState({
    ownerId: '',
    description: '',
  });

  const canManageLabResults = user?.role === 'doctor' || user?.role === 'admin';
  const canChooseDocumentOwner = user?.role === 'doctor' || user?.role === 'admin';
  const criticalResults = useMemo(
    () => labResults.filter((result) => result.status === 'critical').length,
    [labResults]
  );
  const inboxItems = useMemo(
    () => [
      ...labResults.map((result) => ({
        id: `lab-${result.id}`,
        kind: 'Lab result' as const,
        title: result.testName,
        subtitle: `${result.patientName || result.patientId} · ${formatDate(result.resultDate)}`,
        tone: statusStyles[result.status],
        description: result.notes || result.referenceRange || 'No extra notes provided.',
      })),
      ...documents.map((document) => ({
        id: `doc-${document.id}`,
        kind: 'Document' as const,
        title: document.fileName,
        subtitle: `${document.ownerName || document.ownerId} · ${formatDate(document.createdAt)}`,
        tone: 'border-slate-200 bg-slate-50 text-slate-700',
        description: document.description || document.mimeType,
      })),
    ].sort((left, right) => {
      const leftDate = left.subtitle.split('·').pop()?.trim() || '';
      const rightDate = right.subtitle.split('·').pop()?.trim() || '';
      return rightDate.localeCompare(leftDate);
    }),
    [documents, labResults]
  );

  const loadRecords = async () => {
    setLoading(true);
    setError('');

    try {
      const [labItems, documentItems, patientItems] = await Promise.all([
        recordsService.getLabResults(),
        recordsService.getDocuments(),
        canChooseDocumentOwner ? patientService.getAllPatients() : Promise.resolve([]),
      ]);

      setLabResults(labItems);
      setDocuments(documentItems);
      setPatients(patientItems);

      const defaultPatientId = patientItems[0]?.id || '';
      setLabForm((current) => ({
        ...current,
        patientId: current.patientId || defaultPatientId,
      }));
      setDocumentForm((current) => ({
        ...current,
        ownerId: current.ownerId || (canChooseDocumentOwner ? defaultPatientId : user?.id || ''),
      }));

      const timelinePatientId = canChooseDocumentOwner ? defaultPatientId : user?.id || '';
      if (timelinePatientId) {
        const timeline = await recordsService.getCareTimeline(timelinePatientId);
        setTimelineItems(timeline);
      } else {
        setTimelineItems([]);
      }
    } catch (loadError) {
      console.error('Failed to load records:', loadError);
      setError('Unable to load records right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    void loadRecords();
  }, [user?.id, user?.role]);

  const handleLabChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setMessage('');
    setError('');
    setLabForm((current) => ({ ...current, [name]: value }));
  };

  const handleDocumentChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setMessage('');
    setError('');
    setDocumentForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setMessage('');
    setError('');
  };

  const handleLabSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageLabResults) return;

    if (!labForm.patientId || !labForm.testName.trim() || !labForm.resultValue.trim() || !labForm.resultDate) {
      setError('Patient, test name, result, and date are required.');
      return;
    }

    setSavingLab(true);
    setError('');
    setMessage('');

    try {
      const created = await recordsService.createLabResult({
        patientId: labForm.patientId,
        testName: labForm.testName.trim(),
        resultValue: labForm.resultValue.trim(),
        unit: labForm.unit.trim(),
        referenceRange: labForm.referenceRange.trim(),
        status: labForm.status,
        notes: labForm.notes.trim(),
        resultDate: labForm.resultDate,
      });

      setLabResults((current) => [created, ...current]);
      setMessage('Lab result saved.');
      setLabForm((current) => ({
        ...current,
        testName: '',
        resultValue: '',
        unit: '',
        referenceRange: '',
        status: 'normal',
        resultDate: today,
        notes: '',
      }));
    } catch (saveError) {
      console.error('Failed to save lab result:', saveError);
      setError('Unable to save the lab result right now.');
    } finally {
      setSavingLab(false);
    }
  };

  const handleDocumentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ownerId = canChooseDocumentOwner ? documentForm.ownerId : user?.id || '';
    if (!ownerId) {
      setError('Choose a patient for this document.');
      return;
    }

    if (!selectedFile) {
      setError('Choose a document to upload.');
      return;
    }

    if (selectedFile.size > maxDocumentBytes) {
      setError('Documents must be 5 MB or smaller.');
      return;
    }

    setUploadingDocument(true);
    setError('');
    setMessage('');

    try {
      const contentBase64 = await readFileAsBase64(selectedFile);
      const created = await recordsService.uploadDocument({
        ownerId,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        contentBase64,
        description: documentForm.description.trim(),
      });

      setDocuments((current) => [created, ...current]);
      setSelectedFile(null);
      setFileInputKey((current) => current + 1);
      setMessage('Document uploaded.');
      setDocumentForm((current) => ({ ...current, description: '' }));
    } catch (uploadError) {
      console.error('Failed to upload document:', uploadError);
      setError('Unable to upload the document right now.');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownload = async (document: ClinicalDocument) => {
    setDownloadId(document.id);
    setError('');
    setMessage('');

    try {
      const blob = await recordsService.downloadDocument(document.id);
      downloadBlob(blob, document.fileName);
    } catch (downloadError) {
      console.error('Failed to download document:', downloadError);
      setError('Unable to download the document right now.');
    } finally {
      setDownloadId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">{languagePack.pageLabel}</p>
            <h1 className="text-3xl font-black text-slate-900">{languagePack.recordsTitle}</h1>
            <p className="text-sm text-slate-500">{languagePack.recordsSubtitle}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Labs</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{labResults.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Critical</p>
              <p className="mt-1 text-2xl font-black text-rose-700">{criticalResults}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Files</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{documents.length}</p>
            </div>
          </div>
        </div>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{languagePack.inboxLabel}</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Recent lab results and documents</h2>
              <p className="mt-1 text-sm text-slate-500">A single feed for new results, uploaded files, and compliance review.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              View inbox
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Critical labs</p>
              <p className="mt-2 text-2xl font-black text-rose-700">{criticalResults}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Inbox items</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{inboxItems.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Document uploads</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{documents.length}</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="mb-6 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'timeline'
                ? 'bg-[#8e171b] text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'inbox'
                ? 'bg-[#8e171b] text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {languagePack.inboxLabel}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('labs')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'labs'
                ? 'bg-[#8e171b] text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {languagePack.labsLabel}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'documents'
                ? 'bg-[#8e171b] text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {languagePack.documentsLabel}
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Loading records...
          </div>
        ) : activeTab === 'timeline' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4">
              {timelineItems.length > 0 ? (
                timelineItems.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {item.type.replace('_', ' ')}
                        </p>
                        <h2 className="mt-1 wrap-break-word text-xl font-bold text-slate-900">{item.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                      </div>
                      <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    {item.details && (
                      <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {item.details}
                      </p>
                    )}
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm">
                  No timeline items yet.
                </div>
              )}
            </section>

            <aside className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Care timeline</h2>
              <p className="mt-2">
                Appointments, records, labs, documents, and prescriptions are merged here for faster clinical review.
              </p>
            </aside>
          </div>
        ) : activeTab === 'inbox' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4">
              {inboxItems.length > 0 ? (
                inboxItems.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{item.kind}</p>
                        <h2 className="mt-1 wrap-break-word text-2xl font-bold text-slate-900">{item.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                      </div>
                      <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${item.tone}`}>
                        New
                      </span>
                    </div>

                    <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {item.description}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm">
                  No inbox items yet.
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Inbox guidance</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Lab results and uploaded files now land in one place so patients and clinicians can review the latest clinical updates together.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>Use the Documents tab to upload outside records.</p>
                  <p>Use the Labs tab to add provider-reviewed test results.</p>
                  <p>Check the intake form before your next appointment.</p>
                </div>
              </div>
            </aside>
          </div>
        ) : activeTab === 'labs' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4">
              {labResults.length > 0 ? (
                labResults.map((result) => (
                  <article key={result.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {result.patientName || result.patientId}
                        </p>
                        <h2 className="mt-1 wrap-break-word text-2xl font-bold text-slate-900">{result.testName}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(result.resultDate)} by {result.doctorName || result.doctorId}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyles[result.status]}`}
                      >
                        {result.status}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-slate-500">Result</p>
                        <p className="wrap-break-word font-semibold text-slate-900">
                          {result.resultValue}
                          {result.unit ? ` ${result.unit}` : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Reference range</p>
                        <p className="wrap-break-word font-semibold text-slate-900">{result.referenceRange || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Updated</p>
                        <p className="font-semibold text-slate-900">{formatDate(result.updatedAt)}</p>
                      </div>
                    </div>

                    {result.notes && (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {result.notes}
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm">
                  No lab results found.
                </div>
              )}
            </section>

            <aside className="space-y-4">
              {canManageLabResults ? (
                <form onSubmit={handleLabSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">Add lab result</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Patient</label>
                      <select
                        name="patientId"
                        value={labForm.patientId}
                        onChange={handleLabChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                      >
                        <option value="">Choose patient</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Test name</label>
                      <input
                        name="testName"
                        value={labForm.testName}
                        onChange={handleLabChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Result</label>
                        <input
                          name="resultValue"
                          value={labForm.resultValue}
                          onChange={handleLabChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Unit</label>
                        <input
                          name="unit"
                          value={labForm.unit}
                          onChange={handleLabChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Reference range</label>
                      <input
                        name="referenceRange"
                        value={labForm.referenceRange}
                        onChange={handleLabChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
                        <select
                          name="status"
                          value={labForm.status}
                          onChange={handleLabChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 capitalize outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                        >
                          <option value="normal">Normal</option>
                          <option value="abnormal">Abnormal</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                        <input
                          type="date"
                          name="resultDate"
                          value={labForm.resultDate}
                          onChange={handleLabChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Notes</label>
                      <textarea
                        name="notes"
                        value={labForm.notes}
                        onChange={handleLabChange}
                        rows={4}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingLab}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-[#8e171b] px-4 py-3 font-semibold text-white transition hover:bg-[#741215] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingLab ? 'Saving...' : 'Save lab result'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
                  New lab results appear here after your provider adds them.
                </div>
              )}
            </aside>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4">
              {documents.length > 0 ? (
                documents.map((document) => (
                  <article key={document.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {document.ownerName || document.ownerId}
                        </p>
                        <h2 className="mt-1 wrap-break-word text-xl font-bold text-slate-900">{document.fileName}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Uploaded by {document.uploadedByName || document.uploadedById} on {formatDate(document.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDownload(document)}
                        disabled={downloadId === document.id}
                        className="inline-flex items-center justify-center rounded-2xl border border-[#8e171b] px-4 py-2 text-sm font-semibold text-[#8e171b] transition hover:bg-[#fff1f1] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadId === document.id ? 'Downloading...' : 'Download'}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-500">Type</p>
                        <p className="wrap-break-word font-semibold text-slate-900">{document.mimeType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Updated</p>
                        <p className="font-semibold text-slate-900">{formatDate(document.updatedAt)}</p>
                      </div>
                    </div>

                    {document.description && (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {document.description}
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm">
                  No documents found.
                </div>
              )}
            </section>

            <aside>
              <form onSubmit={handleDocumentSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">{languagePack.uploadDocumentLabel}</h2>
                <div className="mt-4 space-y-4">
                  {canChooseDocumentOwner && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Patient</label>
                      <select
                        name="ownerId"
                        value={documentForm.ownerId}
                        onChange={handleDocumentChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                      >
                        <option value="">Choose patient</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">File</label>
                    <input
                      key={fileInputKey}
                      type="file"
                      onChange={handleFileChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-[#f5f1ff] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#6a45f0] focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                    />
                    {selectedFile && (
                      <p className="mt-2 wrap-break-word text-xs text-slate-500">
                        {selectedFile.name} ({Math.ceil(selectedFile.size / 1024)} KB)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                    <textarea
                      name="description"
                      value={documentForm.description}
                      onChange={handleDocumentChange}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingDocument}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#8e171b] px-4 py-3 font-semibold text-white transition hover:bg-[#741215] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingDocument ? 'Uploading...' : 'Upload document'}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
