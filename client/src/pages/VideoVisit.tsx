import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
}

const normalizeTime = (time: string) => time.slice(0, 5);

const getContactName = (appointment: Appointment, isPatient: boolean) =>
  isPatient
    ? appointment.doctorName || appointment.doctorId
    : appointment.patientName || appointment.patientId;

const formatCountdown = (milliseconds: number) => {
  const minutes = Math.max(0, Math.floor(milliseconds / 60000));
  if (minutes === 0) {
    return 'less than a minute';
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hour${hours === 1 ? '' : 's'}${remainingMinutes ? ` ${remainingMinutes} min` : ''}`;
};

const videoProvider = import.meta.env.VITE_VIDEO_PROVIDER || 'demo';

export const VideoVisit = () => {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [visitNotes, setVisitNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadAppointment = async () => {
      if (!appointmentId) {
        setStatusError('Missing appointment id.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get<{ data: Appointment }>(`/appointments/${appointmentId}`);
        const loadedAppointment = response.data.data;
        setAppointment(loadedAppointment);
        setVisitNotes(loadedAppointment.notes || '');
      } catch (error) {
        console.error('Failed to load video visit:', error);
        setStatusError('Unable to load this video visit right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadAppointment();
  }, [appointmentId]);

  const startDateTime = useMemo(() => {
    if (!appointment) {
      return null;
    }

    return new Date(`${appointment.appointmentDate}T${normalizeTime(appointment.startTime)}`);
  }, [appointment]);

  const countdownLabel = startDateTime ? formatCountdown(startDateTime.getTime() - now) : 'soon';
  const canJoin = checkedIn || (startDateTime ? startDateTime.getTime() <= now : false);

  const handleCheckIn = () => {
    setStatusError('');
    setStatusMessage('You are in the waiting room.');
    setCheckedIn(true);
  };

  const handleJoinRoom = () => {
    setStatusError('');
    setStatusMessage('Video room joined.');
    setInCall(true);
  };

  const handleSaveNotes = async () => {
    if (!appointment) {
      return;
    }

    setSavingNotes(true);
    setStatusError('');
    setStatusMessage('');

    try {
      await api.put(`/appointments/${appointment.id}`, {
        notes: visitNotes.trim(),
      });
      setStatusMessage('Visit notes saved to the appointment record.');
    } catch (error) {
      console.error('Failed to save visit notes:', error);
      setStatusError('Unable to save visit notes right now.');
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-slate-600">Loading video visit...</div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
          <div className="rounded-3xl border border-rose-200 bg-white p-6 text-rose-700 shadow-sm">
            {statusError || 'Video visit not found.'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isPatient = user?.role === 'patient';
  const contactName = getContactName(appointment, isPatient);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">Telehealth Room</p>
            <h1 className="text-3xl font-black text-slate-900">Video Visit</h1>
            <p className="text-sm text-slate-500">
              Waiting room, secure call controls, and visit notes for {contactName}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to appointments
          </button>
        </div>

        {statusError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {statusError}
          </div>
        )}

        {statusMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-linear-to-r from-[#130f2d] to-[#2e2161] px-5 py-4 text-white sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/70">Waiting room</p>
                  <h2 className="text-xl font-bold">{appointment.reason}</h2>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                  {appointment.appointmentDate} at {appointment.startTime}
                </span>
              </div>
            </div>

            {!checkedIn ? (
              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_320px]">
                <div className="rounded-3xl border border-dashed border-[#6a45f0]/25 bg-[#faf8ff] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6a45f0]">You are in the queue</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">Waiting room</h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    Please check in when you are ready. Your provider will be notified and the room will open when the visit starts.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimated wait</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">{countdownLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Visit type</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">Secure video</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckIn}
                    className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#8e171b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#741215]"
                  >
                    Check into waiting room
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Visit details</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div>
                      <p className="text-slate-500">Participant</p>
                      <p className="font-semibold text-slate-900">{contactName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Appointment</p>
                      <p className="font-semibold text-slate-900">{appointment.reason}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Status</p>
                      <p className="font-semibold text-slate-900 capitalize">{appointment.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 p-5 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl bg-[#1f163b] p-4 text-white shadow-inner">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>You</span>
                      <span>{cameraOn ? 'Camera on' : 'Camera off'}</span>
                    </div>
                    <div className="mt-4 flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-[#6a45f0] to-[#130f2d]">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl">
                          {cameraOn ? '🎥' : '📷'}
                        </div>
                        <p className="text-lg font-semibold">{user?.name || 'You'}</p>
                        <p className="text-sm text-white/70">{muted ? 'Muted' : 'Mic on'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-100 p-4 shadow-inner">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Provider</span>
                      <span>Waiting live</span>
                    </div>
                    <div className="mt-4 flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                      <div className="text-center text-slate-700">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f1ff] text-2xl text-[#6a45f0]">
                          {isPatient ? '🩺' : '👤'}
                        </div>
                        <p className="text-lg font-semibold">{contactName}</p>
                        <p className="text-sm text-slate-500">Secure room connected</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setMuted((current) => !current)}
                    className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                      muted ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraOn((current) => !current)}
                    className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                      cameraOn ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {cameraOn ? 'Turn camera off' : 'Turn camera on'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/appointments')}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#8e171b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#741215]"
                  >
                    End visit
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Video provider</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {videoProvider === 'demo'
                  ? 'Demo room is active. Configure VITE_VIDEO_PROVIDER and server provider keys before using live calls.'
                  : `${videoProvider} integration is selected for live video visits.`}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Visit status</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span>Check-in</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${checkedIn ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {checkedIn ? 'Complete' : 'Waiting'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Muted</span>
                  <span className="font-semibold text-slate-900">{muted ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Camera</span>
                  <span className="font-semibold text-slate-900">{cameraOn ? 'On' : 'Off'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Room</span>
                  <span className="font-semibold text-slate-900">{canJoin ? 'Ready' : 'Waiting room'}</span>
                </div>
              </div>

              {!checkedIn && (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#6a45f0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5a39d1]"
                >
                  Enter waiting room
                </button>
              )}
              {checkedIn && !inCall && (
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#6a45f0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5a39d1]"
                >
                  Join video room
                </button>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Visit notes</p>
              <textarea
                value={visitNotes}
                onChange={(event) => setVisitNotes(event.target.value)}
                rows={10}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                placeholder="Write clinical notes, next steps, or follow-up tasks..."
              />
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-[#6a45f0] bg-[#f5f1ff] px-4 py-3 text-sm font-semibold text-[#6a45f0] transition hover:bg-[#ece5ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingNotes ? 'Saving notes...' : 'Save visit notes'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};
