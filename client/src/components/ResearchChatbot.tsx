import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useOffline } from '../hooks/useOffline';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
  bullets?: string[];
  sources?: {
    label: string;
    href: string;
  }[];
}

interface ResearchTopic {
  keywords: string[];
  title: string;
  response: string;
  bullets: string[];
  sources: {
    label: string;
    href: string;
  }[];
}

export interface ResearchChatbotHandle {
  openWithPrompt: (prompt: string) => void;
}

const researchTopics: ResearchTopic[] = [
  {
    keywords: ['24/7 care', '247 care', 'urgent', 'telehealth'],
    title: '24/7 Care',
    response:
      '24/7 care is useful for quick medical questions, common illnesses, follow-up questions, and triage when you need guidance without leaving home.',
    bullets: [
      'Good for symptoms, medication questions, and fast care decisions.',
      'Telehealth can support both regular visits and behavioral health use cases.',
      'When symptoms are severe or life-threatening, emergency care is still the right choice.',
    ],
    sources: [
      { label: 'Telehealth patient guide', href: 'https://telehealth.hhs.gov/patients' },
      { label: 'What can be treated through telehealth?', href: 'https://telehealth.hhs.gov/patients/what-can-be-treated-through-telehealth' },
    ],
  },
  {
    keywords: ['primary care', 'checkup', 'preventive', 'screening'],
    title: 'Primary Care',
    response:
      'Primary care is the first stop for checkups, preventive care, routine illness, medication refills, and long-term care coordination.',
    bullets: [
      'Keeps your records, medications, and screenings organized.',
      'Helps with everyday health questions before they become bigger problems.',
      'Often coordinates referrals when a specialist is needed.',
    ],
    sources: [
      { label: 'Telehealth patient guide', href: 'https://telehealth.hhs.gov/patients' },
      { label: 'NIH wellness toolkits', href: 'https://www.nih.gov/health-information/your-healthiest-self-wellness-toolkits' },
    ],
  },
  {
    keywords: ['mental health', 'anxiety', 'depression', 'stress', 'therapy'],
    title: 'Mental Health',
    response:
      'Mental health care covers anxiety, depression, trauma, sleep issues, focus problems, and other conditions that affect daily life.',
    bullets: [
      'Therapy and medication can both be part of treatment.',
      'Professional help matters when stress starts affecting work, school, or relationships.',
      'Crisis support is available through emergency and suicide-prevention resources.',
    ],
    sources: [
      { label: 'NIMH health topics', href: 'https://www.nimh.nih.gov/health/topics' },
      { label: 'Caring for your mental health', href: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health' },
    ],
  },
  {
    keywords: ['diabetes', 'blood pressure', 'hypertension', 'condition management'],
    title: 'Condition Management',
    response:
      'Condition management focuses on tracking long-term health needs such as blood pressure, diabetes, weight, and lifestyle changes that support better outcomes.',
    bullets: [
      'Tracking numbers helps catch changes early.',
      'Nutrition, activity, sleep, and stress reduction all matter.',
      'Ongoing support usually works better than one-off care only.',
    ],
    sources: [
      { label: 'High blood pressure', href: 'https://www.cdc.gov/high-blood-pressure/index.html' },
      { label: 'Healthy weight and growth', href: 'https://www.cdc.gov/healthy-weight-growth/about/index.html' },
    ],
  },
  {
    keywords: ['specialty care', 'specialist', 'dermatology', 'cardiology', 'orthopedics'],
    title: 'Specialty Care',
    response:
      'Specialty care is what you use when a focused expert is needed, such as a cardiologist, dermatologist, orthopedist, or mental health specialist.',
    bullets: [
      'Usually follows a primary-care visit or referral.',
      'Helps with deeper evaluation, testing, and targeted treatment plans.',
      'Works best when the whole care team stays informed.',
    ],
    sources: [
      { label: 'Telehealth provider guidance', href: 'https://telehealth.hhs.gov/providers' },
      { label: 'NIMH treatment and support topics', href: 'https://www.nimh.nih.gov/health/topics' },
    ],
  },
  {
    keywords: ['healthy habits', 'nutrition', 'sleep', 'exercise', 'wellness'],
    title: 'Healthy Habits',
    response:
      'Healthy habits are the everyday behaviors that protect long-term health: eating well, moving more, sleeping enough, and reducing stress.',
    bullets: [
      'A balanced diet and fewer sugary drinks support better health.',
      'Physical activity and good sleep are part of the same wellness picture.',
      'Small, steady changes are easier to keep than extreme plans.',
    ],
    sources: [
      { label: 'NIH wellness toolkits', href: 'https://www.nih.gov/health-information/your-healthiest-self-wellness-toolkits' },
      { label: 'CDC healthy weight and growth', href: 'https://www.cdc.gov/healthy-weight-growth/about/index.html' },
    ],
  },
];

const defaultAssistantMessage: ChatMessage = {
  role: 'assistant',
  content:
    'Ask me for a simple research summary about a service, condition, or wellness topic. I work from built-in references when offline and can point you to source links when online.',
};

const pickTopic = (message: string) => {
  const normalized = message.toLowerCase();
  return researchTopics.find((topic) => topic.keywords.some((keyword) => normalized.includes(keyword)));
};

export const ResearchChatbot = forwardRef<ResearchChatbotHandle>((_props, ref) => {
  const { isOnline } = useOffline();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([defaultAssistantMessage]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const addAssistantMessage = (prompt: string) => {
    const topic = pickTopic(prompt);

    if (!topic) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            'I can help with primary care, mental health, condition management, specialty care, 24/7 care, and healthy habits. Try asking in plain language like “tell me about mental health” or “what is primary care?”',
          sources: isOnline
            ? [
                { label: 'Telehealth.HHS.gov', href: 'https://telehealth.hhs.gov/' },
                { label: 'NIMH health topics', href: 'https://www.nimh.nih.gov/health/topics' },
              ]
            : undefined,
        },
      ]);
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        content: topic.response,
        bullets: topic.bullets,
        sources: topic.sources,
      },
    ]);
  };

  const sendMessage = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { role: 'user', content: trimmed }]);
    addAssistantMessage(trimmed);
  };

  useImperativeHandle(ref, () => ({
    openWithPrompt: (prompt: string) => {
      setIsOpen(true);
      setInput('');
      sendMessage(prompt);
    },
  }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage(input);
    setInput('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 items-center gap-3 rounded-full bg-[#6a45f0] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(106,69,240,0.28)] transition hover:-translate-y-0.5 hover:bg-[#5638d6]"
      >
        <span className="text-lg">💬</span>
        <span>AI Research</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${isOnline ? 'bg-white/15' : 'bg-black/15'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[min(92vw,28rem)] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]">
          <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#3d2d7d] to-[#6a45f0] px-5 py-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">Afyasync AI</p>
              <h2 className="mt-1 text-lg font-black">Simple research chatbot</h2>
              <p className="mt-1 text-xs leading-5 text-white/80">
                Works offline with built-in medical summaries and online with official source links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4 sm:px-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === 'user'
                    ? 'ml-auto bg-[#6a45f0] text-white'
                    : 'bg-white text-slate-700'
                }`}
              >
                <p>{message.content}</p>
                {message.bullets && (
                  <ul className="mt-3 space-y-2">
                    {message.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className={`mt-2 h-2 w-2 flex-none rounded-full ${message.role === 'user' ? 'bg-white/80' : 'bg-[#6a45f0]'}`} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {message.sources && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.sources.map((source) => (
                      <a
                        key={source.href}
                        href={source.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                          message.role === 'user'
                            ? 'bg-white/15 text-white hover:bg-white/25'
                            : 'bg-[#f5f1ff] text-[#6a45f0] hover:bg-[#ece5ff]'
                        }`}
                      >
                        {source.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {['Primary care', 'Mental health', 'Healthy habits', 'Blood pressure'].map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => sendMessage(`Tell me about ${topic}.`)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:border-[#6a45f0] hover:text-[#6a45f0]"
                >
                  {topic}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask for simple research..."
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#6a45f0] focus:bg-white focus:ring-4 focus:ring-[#6a45f0]/10"
              />
              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-[#6a45f0] px-4 text-sm font-semibold text-white transition hover:bg-[#5638d6]"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
});
