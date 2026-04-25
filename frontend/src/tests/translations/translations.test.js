import { translations, getTranslation } from '../../utils/translations';

describe('translations for legal, data, and security content', () => {
  const supportedLanguages = ['en', 'es', 'fr', 'it'];

  const requiredKeys = [
    'termsOfServiceTitle',
    'termsIntro',
    'termsContent1',
    'termsContent2',
    'termsContent3',
    'termsContent4',
    'termsContent5',
    'termsContent6',
    'termsContent7',
    'termsFooter',
    'privacyPolicyTitle',
    'privacyPolicyIntro',
    'privacyPolicyBullet1',
    'privacyPolicyBullet2',
    'privacyPolicyBullet3',
    'agreeToTermsAndPrivacy',
    'authRequiredTitle',
    'authRequiredDefaultDesc',
  ];

  test('all required legal/data/security keys exist and are non-empty for each supported language', () => {
    supportedLanguages.forEach((lang) => {
      requiredKeys.forEach((key) => {
        const value = translations[lang]?.[key];
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });
  });

  test('getTranslation returns localized value when key exists', () => {
    expect(getTranslation('es', 'termsOfServiceTitle')).toBe(translations.es.termsOfServiceTitle);
    expect(getTranslation('fr', 'privacyPolicyTitle')).toBe(translations.fr.privacyPolicyTitle);
    expect(getTranslation('it', 'authRequiredTitle')).toBe(translations.it.authRequiredTitle);
  });

  test('getTranslation falls back to English when key is missing in chosen language', () => {
    const fallbackKey = 'home';
    expect(getTranslation('xx', fallbackKey)).toBe(translations.en[fallbackKey]);
  });

  test('getTranslation returns key itself when missing from all languages', () => {
    const missingKey = 'totallyUnknownTranslationKey';
    expect(getTranslation('en', missingKey)).toBe(missingKey);
    expect(getTranslation('es', missingKey)).toBe(missingKey);
  });
});
