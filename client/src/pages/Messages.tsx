import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import api from '../services/api';
import { messageService } from '../services/messageService';
import type { Message, MessageContact } from '../types/message';

const doctorContacts: MessageContact[] = [
  { id: 'urgent-care-team', name: 'Urgent Care Team', role: 'doctor', subtitle: 'Emergency escalation' },
  { id: 'dr-joyce-mwangi', name: 'Dr. Joyce Mwangi', role: 'doctor', subtitle: 'Primary Care' },
  { id: 'dr-isaac-owen', name: 'Dr. Isaac Owen', role: 'doctor', subtitle: 'Cardiology' },
  { id: 'dr-nadia-kamau', name: 'Dr. Nadia Kamau', role: 'doctor', subtitle: 'Mental Health' },
  { id: 'dr-rita-nyambura', name: 'Dr. Rita Nyambura', role: 'doctor', subtitle: 'Dermatology' },
  { id: 'dr-samuel-otieno', name: 'Dr. Samuel Otieno', role: 'doctor', subtitle: 'Orthopedics' },
  { id: 'dr-lucy-adhiambo', name: 'Dr. Lucy Adhiambo', role: 'doctor', subtitle: 'Nutrition' },
  { id: 'dr-peter-kariuki', name: 'Dr. Peter Kariuki', role: 'doctor', subtitle: 'Hypertension' },
  { id: 'dr-farah-abdi', name: 'Dr. Farah Abdi', role: 'doctor', subtitle: 'Pediatrics' },
];

const getContactLabel = (contact: MessageContact) => `${contact.name}${contact.subtitle ? ` · ${contact.subtitle}` : ''}`;

const formatClock = (value: string) =>
  new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const Messages = () => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [searchParams] = useSearchParams();
  const requestedContactId = searchParams.get('contact') || '';
  const urgentSubject = searchParams.get('subject') || '';
  const urgentBody = searchParams.get('body') || '';
  const urgentMode = searchParams.get('urgent') === '1' || requestedContactId === 'urgent-care-team';
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ subject: '', body: '' });

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) || null,
    [contacts, selectedContactId]
  );

  useEffect(() => {
    const loadContacts = async () => {
      if (!user?.id) return;

      setLoadingContacts(true);
      try {
        if (user.role === 'patient') {
          const contactsWithRequested = requestedContactId && !doctorContacts.some((contact) => contact.id === requestedContactId)
            ? [
                { id: requestedContactId, name: 'Message contact', role: 'doctor' as const, subtitle: 'Secure message' },
                ...doctorContacts,
              ]
            : doctorContacts;

          setContacts(contactsWithRequested);
          setSelectedContactId((current) => requestedContactId || current || contactsWithRequested[0]?.id || '');
          return;
        }

        const response = await api.get('/patients');
        const patientContacts = (response.data.data || []).map((patient: { id: string; name: string; email?: string }) => ({
          id: patient.id,
          name: patient.name,
          role: 'patient' as const,
          subtitle: patient.email,
        }));
        const contactsWithRequested = requestedContactId && !patientContacts.some((contact: MessageContact) => contact.id === requestedContactId)
          ? [
              { id: requestedContactId, name: 'Message contact', role: 'patient' as const, subtitle: 'Secure message' },
              ...patientContacts,
            ]
          : patientContacts;

        setContacts(contactsWithRequested);
        setSelectedContactId((current) => requestedContactId || current || contactsWithRequested[0]?.id || '');
      } catch (loadError) {
        console.error('Failed to load contacts:', loadError);
        setError('Unable to load message contacts right now.');
      } finally {
        setLoadingContacts(false);
      }
    };

    void loadContacts();
  }, [requestedContactId, user?.id, user?.role]);

  useEffect(() => {
    if (!urgentSubject && !urgentBody) {
      return;
    }

    setForm((current) => ({
      ...current,
      subject: urgentSubject || current.subject,
      body: urgentBody || current.body,
    }));
  }, [urgentBody, urgentSubject]);

  useEffect(() => {
    const loadThread = async () => {
      if (!selectedContactId) {
        setMessages([]);
        return;
      }

      setLoadingThread(true);
      setError('');
      try {
        const threadMessages = await messageService.getThread(selectedContactId);
        setMessages(threadMessages);
        void refreshNotifications();
      } catch (threadError) {
        console.error('Failed to load thread:', threadError);
        setError('Unable to load this conversation right now.');
      } finally {
        setLoadingThread(false);
      }
    };

    void loadThread();
  }, [refreshNotifications, selectedContactId]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedContactId) {
      setError('Choose a patient or provider first.');
      return;
    }

    if (!form.subject.trim() || !form.body.trim()) {
      setError('Add a subject and message before sending.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      await messageService.sendMessage({
        recipientId: selectedContactId,
        subject: form.subject.trim(),
        body: form.body.trim(),
      });
      setForm({ subject: '', body: '' });
      setSuccess('Message sent securely.');
      const refreshedThread = await messageService.getThread(selectedContactId);
      setMessages(refreshedThread);
      void refreshNotifications();
    } catch (sendError) {
      console.error('Failed to send message:', sendError);
      setError('Unable to send the message right now.');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">Secure Inbox</p>
            <h1 className="text-3xl font-black text-slate-900">Messages</h1>
            <p className="text-sm text-slate-500">Private threads between patients and providers.</p>
          </div>
        </div>

        {urgentMode && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Urgent symptom escalation is open. If this feels life-threatening, call your local emergency number now.
            The message below is prefilled for the care team.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Contacts</p>
            {loadingContacts ? (
              <div className="text-sm text-slate-500">Loading contacts...</div>
            ) : contacts.length > 0 ? (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      selectedContactId === contact.id
                        ? 'border-[#6a45f0] bg-[#f6f2ff]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{getContactLabel(contact)}</p>
                    <p className="text-sm text-slate-500 capitalize">{contact.role}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No contacts available.</div>
            )}
          </aside>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Conversation</p>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedContact ? getContactLabel(selectedContact) : 'Choose a contact'}
              </h2>
            </div>

            <div className="max-h-130 min-h-80 space-y-4 overflow-y-auto bg-slate-50 px-5 py-5 sm:px-6">
              {loadingThread ? (
                <div className="text-sm text-slate-500">Loading messages...</div>
              ) : messages.length > 0 ? (
                messages.map((message) => {
                  const isMine = message.senderId === user?.id;

                  return (
                    <article
                      key={message.id}
                      className={`max-w-2xl rounded-3xl px-4 py-3 shadow-sm ${
                        isMine ? 'ml-auto bg-[#6a45f0] text-white' : 'bg-white text-slate-900'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className={`text-sm font-semibold ${isMine ? 'text-white' : 'text-slate-900'}`}>
                          {message.subject}
                        </p>
                        <span className={`text-xs ${isMine ? 'text-white/80' : 'text-slate-500'}`}>
                          {formatClock(message.createdAt)}
                        </span>
                      </div>
                      <p className={`whitespace-pre-wrap text-sm leading-6 ${isMine ? 'text-white/90' : 'text-slate-700'}`}>
                        {message.body}
                      </p>
                    </article>
                  );
                })
              ) : selectedContact ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                  No messages yet. Start the conversation below.
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                  Select a contact to view the conversation.
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="space-y-4 border-t border-slate-200 bg-white px-5 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                    placeholder="Visit follow-up"
                  />
                </div>
                <div className="flex items-end">
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Secure messages stay within your authenticated session.
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
                <textarea
                  value={form.body}
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                  placeholder="Write a private note to your patient or provider..."
                />
              </div>

              <button
                type="submit"
                disabled={sending || !selectedContactId}
                className="inline-flex items-center justify-center rounded-2xl bg-[#8e171b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#741215] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Send securely'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};
