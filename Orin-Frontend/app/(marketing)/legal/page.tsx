const sections = [
  {
    title: 'Terms of Service',
    content: [
      { heading: 'Acceptance of Terms', text: 'By accessing or using Orin ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.' },
      { heading: 'Description of Service', text: 'Orin is a career proof platform that helps users create verified proof cards from their work, receive AI-powered career coaching, and discover job opportunities matched to their skills.' },
      { heading: 'User Accounts', text: 'You are responsible for maintaining the confidentiality of your account credentials. You must be at least 16 years old to use Orin. You agree to provide accurate and complete information during registration.' },
      { heading: 'User Content', text: 'You retain ownership of all content you submit to Orin. By submitting content, you grant Orin a limited license to process, store, and display your content as necessary to provide the Service.' },
      { heading: 'Acceptable Use', text: 'You agree not to misuse the Service, attempt to access it without authorization, use it for illegal purposes, or interfere with its operation.' },
      { heading: 'Termination', text: 'You may cancel your account at any time. We may suspend or terminate your access if you violate these terms. Upon termination, your right to use the Service ceases immediately.' },
    ],
  },
  {
    title: 'Privacy Policy',
    content: [
      { heading: 'Information We Collect', text: 'We collect information you provide directly: name, email, and account details. We also collect data from connected cloud accounts (Google Drive, GitHub, etc.) on a read-only basis when you authorize connections.' },
      { heading: 'How We Use Your Information', text: 'We use your information to provide and improve the Service, generate proof cards, deliver AI coaching, and communicate with you about your account.' },
      { heading: 'Data Sharing', text: 'We do not sell your personal data. We may share anonymized, aggregate data for research purposes. We share data with third-party service providers only as necessary to operate the Service.' },
      { heading: 'Cloud Integrations', text: 'When you connect a cloud account, Orin uses OAuth read-only access. We never write to your connected accounts. You can disconnect any integration at any time, which immediately revokes access.' },
      { heading: 'Data Security', text: 'We use industry-standard encryption, secure authentication via Supabase, and regular security audits to protect your data.' },
      { heading: 'Data Retention', text: 'We retain your data as long as your account is active. Upon account deletion, we remove your personal data within 30 days, except as required by law.' },
    ],
  },
  {
    title: 'Cookie Policy',
    content: [
      { heading: 'Essential Cookies', text: 'We use cookies necessary for authentication and security. These cannot be disabled.' },
      { heading: 'Analytics Cookies', text: 'We use privacy-respecting analytics to understand how the Service is used. These cookies do not track you across websites.' },
      { heading: 'Managing Cookies', text: 'You can control cookies through your browser settings. Disabling essential cookies may affect Service functionality.' },
    ],
  },
];

export default function LegalPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden pt-28 pb-16 px-6"
        style={{ backgroundColor: 'var(--color-paper)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-[0.07] animate-pulse-slow"
            style={{ backgroundColor: 'var(--color-mist)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="badge-ink mb-6 animate-fadeInUp">Legal</div>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.06] animate-fadeInUp"
            style={{ color: 'var(--color-ink)', animationDelay: '0.1s' }}
          >
            Legal policies
          </h1>
          <p
            className="text-lg max-w-xl mx-auto animate-fadeInUp"
            style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}
          >
            The fine print, made readable.
          </p>
          <p
            className="text-xs mt-4 animate-fadeInUp"
            style={{ color: 'var(--color-text-tertiary)', animationDelay: '0.3s' }}
          >
            Last updated: June 7, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-3xl mx-auto space-y-16">
          {sections.map((section, i) => (
            <div key={section.title} className="animate-fadeInUp" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
              <h2 className="text-2xl font-bold tracking-tight mb-8 pb-4 border-b" style={{ color: 'var(--color-ink)', borderColor: 'var(--color-border)' }}>
                {section.title}
              </h2>
              <div className="space-y-6">
                {section.content.map((item) => (
                  <div key={item.heading}>
                    <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                      {item.heading}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
