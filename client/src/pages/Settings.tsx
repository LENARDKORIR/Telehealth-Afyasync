/**
 * Settings page
 */

import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';

type LanguageCode = 'en' | 'sw' | 'fr' | 'es';
type ReminderChannel = 'in-app' | 'sms' | 'email';
type ReminderCadence = 'off' | 'daily' | 'before-visit';
type EscalationMode = 'messages' | 'phone';
type ReviewDigest = 'off' | 'daily' | 'weekly';

interface UserPreferences {
  language: LanguageCode;
  notifications: boolean;
  offlineMode: boolean;
  reminderChannel: ReminderChannel;
  reminderCadence: ReminderCadence;
  escalationMode: EscalationMode;
  reviewDigest: ReviewDigest;
}

const defaultPreferences: UserPreferences = {
  language: 'en',
  notifications: true,
  offlineMode: true,
  reminderChannel: 'in-app',
  reminderCadence: 'before-visit',
  escalationMode: 'messages',
  reviewDigest: 'weekly',
};

const languageOptions: Array<{ value: LanguageCode; label: string; description: string }> = [
  { value: 'en', label: 'English', description: 'Default portal language' },
  { value: 'sw', label: 'Kiswahili', description: 'Patient-facing translations' },
  { value: 'fr', label: 'French', description: 'Support for francophone patients' },
  { value: 'es', label: 'Spanish', description: 'Support for Spanish-speaking patients' },
];

const loadPreferences = (userId?: string | null): UserPreferences => {
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }

  try {
    const stored = window.localStorage.getItem(`afyasync-settings:${userId || 'guest'}`);
    if (!stored) {
      return defaultPreferences;
    }

    return { ...defaultPreferences, ...(JSON.parse(stored) as Partial<UserPreferences>) };
  } catch {
    return defaultPreferences;
  }
};

export const Settings = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences(user?.id));
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    setPreferences(loadPreferences(user?.id));
    setSavedMessage('');
  }, [user?.id]);

  const handlePreferenceChange = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setSavedMessage('');
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const handleSavePreferences = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`afyasync-settings:${user?.id || 'guest'}`, JSON.stringify(preferences));
    }

    setSavedMessage('Preferences saved locally for this browser session.');
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">Account settings</p>
          <h1 className="text-3xl font-black text-slate-900">Settings</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Manage your profile, care preferences, and the first-pass language support for patient-facing screens.
          </p>
        </div>

        {savedMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {savedMessage}
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Profile information</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 capitalize text-slate-700 outline-none"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-slate-900">Shared preferences</h2>
              <p className="text-sm text-slate-500">
                These control the lightweight rollout for language and notification preferences.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Patient language</label>
                <select
                  value={preferences.language}
                  onChange={(event) => handlePreferenceChange('language', event.target.value as LanguageCode)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  {languageOptions.find((option) => option.value === preferences.language)?.description}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Notification channel</label>
                <select
                  value={preferences.reminderChannel}
                  onChange={(event) => handlePreferenceChange('reminderChannel', event.target.value as ReminderChannel)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                >
                  <option value="in-app">In-app</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Appointment reminders</label>
                <select
                  value={preferences.reminderCadence}
                  onChange={(event) => handlePreferenceChange('reminderCadence', event.target.value as ReminderCadence)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                >
                  <option value="before-visit">Before each visit</option>
                  <option value="daily">Daily summary</option>
                  <option value="off">Off</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Urgent escalation</label>
                <select
                  value={preferences.escalationMode}
                  onChange={(event) => handlePreferenceChange('escalationMode', event.target.value as EscalationMode)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                >
                  <option value="messages">Open secure message flow</option>
                  <option value="phone">Show call-first guidance</option>
                </select>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Patient-facing screens will read this language preference as the rollout expands.
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Role-based controls</h2>
            <p className="mt-2 text-sm text-slate-500">
              Different roles get different follow-up controls so the portal stays focused.
            </p>

            {user?.role === 'patient' && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">Care reminders</p>
                  <p className="mt-1 text-sm text-slate-500">Keep visit reminders aligned with your preferred channel and cadence.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">Urgent symptoms</p>
                  <p className="mt-1 text-sm text-slate-500">Use messaging escalation for urgent symptoms unless you need emergency services.</p>
                </div>
              </div>
            )}

            {user?.role === 'doctor' && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Provider review digest</label>
                  <select
                    value={preferences.reviewDigest}
                    onChange={(event) => handlePreferenceChange('reviewDigest', event.target.value as ReviewDigest)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="off">Off</option>
                  </select>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">Follow-up focus</p>
                  <p className="mt-1 text-sm text-slate-500">Use the provider dashboard to review no-shows, care gaps, and refill requests.</p>
                </div>
              </div>
            )}

            {user?.role === 'admin' && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Audit review cadence</label>
                  <select
                    value={preferences.reviewDigest}
                    onChange={(event) => handlePreferenceChange('reviewDigest', event.target.value as ReviewDigest)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="off">Off</option>
                  </select>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">Compliance review</p>
                  <p className="mt-1 text-sm text-slate-500">Keep audit logs and provider activity visible to the admin team.</p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">General preferences</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-900">Notifications</p>
                  <p className="text-sm text-slate-500">Receive push and in-app alerts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePreferenceChange('notifications', !preferences.notifications)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    preferences.notifications
                      ? 'bg-[#8e171b] text-white hover:bg-[#741215]'
                      : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  }`}
                >
                  {preferences.notifications ? 'On' : 'Off'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-900">Offline mode</p>
                  <p className="text-sm text-slate-500">Keep offline sync enabled for low-connectivity use.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handlePreferenceChange('offlineMode', !preferences.offlineMode);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    preferences.offlineMode
                      ? 'bg-[#8e171b] text-white hover:bg-[#741215]'
                      : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  }`}
                >
                  {preferences.offlineMode ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Dark mode remains a local browser preference for now.
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="inline-flex items-center justify-center rounded-2xl bg-[#8e171b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#741215]"
              >
                Save preferences
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Change password
              </button>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};
