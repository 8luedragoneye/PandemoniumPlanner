import { useTranslation } from 'react-i18next';

export function LanguageToggle(): JSX.Element {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('de') ? 'de' : 'en';

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div style={{
      display: 'flex',
      borderRadius: '6px',
      overflow: 'hidden',
      border: '1px solid var(--albion-border)',
    }}>
      <button
        onClick={() => switchLanguage('de')}
        style={{
          padding: '0.35rem 0.6rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          backgroundColor: currentLang === 'de' ? 'var(--albion-gold)' : 'var(--albion-darker)',
          color: currentLang === 'de' ? 'var(--albion-dark)' : 'var(--albion-text-dim)',
          transition: 'all 0.15s',
        }}
      >
        DE
      </button>
      <button
        onClick={() => switchLanguage('en')}
        style={{
          padding: '0.35rem 0.6rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: 'none',
          borderLeft: '1px solid var(--albion-border)',
          cursor: 'pointer',
          backgroundColor: currentLang === 'en' ? 'var(--albion-gold)' : 'var(--albion-darker)',
          color: currentLang === 'en' ? 'var(--albion-dark)' : 'var(--albion-text-dim)',
          transition: 'all 0.15s',
        }}
      >
        EN
      </button>
    </div>
  );
}
