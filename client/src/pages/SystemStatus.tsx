import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import api from '../services/api';
import { ENDPOINTS } from '../utils/constants';

interface SystemStatusData {
  api: string;
  database: string;
  databaseTime?: string | null;
  lastAuditEventAt?: string | null;
  documentCount: number;
  videoProvider: string;
  smsProvider: string;
  pwa: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export const SystemStatus = () => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStatus = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get<{ data: SystemStatusData }>(ENDPOINTS.SYSTEM_STATUS);
        setStatus(response.data.data);
      } catch (loadError) {
        console.error('Failed to load system status:', loadError);
        setError('Unable to load system status right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadStatus();
  }, []);

  const items = status
    ? [
        { label: 'API', value: status.api },
        { label: 'Database', value: status.database },
        { label: 'Database time', value: formatDate(status.databaseTime) },
        { label: 'Last audit event', value: formatDate(status.lastAuditEventAt) },
        { label: 'Documents', value: String(status.documentCount) },
        { label: 'Video provider', value: status.videoProvider },
        { label: 'SMS provider', value: status.smsProvider },
        { label: 'PWA', value: status.pwa },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">Production readiness</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">System Status</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Admin-only checks for deployment health, database connectivity, audit activity, and integration readiness.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Loading system status...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            {error}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <section key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 wrap-break-word text-xl font-bold text-slate-900">{item.value}</p>
              </section>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
