// This test suite verifies that all 
// required translation keys for legal, 
// data, and security content exist and are 
// non-empty for each supported language. 
// It also tests the getTranslation function 
// to ensure it returns the correct localized 
// value, falls back to English when a key is 
// missing in the chosen language, and returns 
// the key itself when it's missing from all languages.





//imports
import { translations, getTranslation } from '../../utils/translations';
//imports end





// The test suite includes tests to check that
describe('translations for legal, data, and security content', () => {
  const supportedLanguages = ['en', 'es', 'fr', 'it'];






  // Define the required translation keys
  //  for legal, data, and security content
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







  // Test that all required keys 
  // exist and are non-empty for each supported language
  test('all required legal/data/security keys exist and are non-empty for each supported language', () => {
    supportedLanguages.forEach((lang) => {
      requiredKeys.forEach((key) => {
        const value = translations[lang]?.[key];
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });
  });





  // Test the getTranslation function for correct behavior
  test('getTranslation returns localized value when key exists', () => {
    expect(getTranslation('es', 'termsOfServiceTitle')).toBe(translations.es.termsOfServiceTitle);
    expect(getTranslation('fr', 'privacyPolicyTitle')).toBe(translations.fr.privacyPolicyTitle);
    expect(getTranslation('it', 'authRequiredTitle')).toBe(translations.it.authRequiredTitle);
  });






  // Test that getTranslation falls 
  // back to English when a key is 
  // missing in the chosen language
  test('getTranslation falls back to English when key is missing in chosen language', () => {
    const fallbackKey = 'home';
    expect(getTranslation('xx', fallbackKey)).toBe(translations.en[fallbackKey]);
  });






  // Test that getTranslation returns the key itself
  // when it's missing from all languages
  test('getTranslation returns key itself when missing from all languages', () => {
    const missingKey = 'totallyUnknownTranslationKey';
    expect(getTranslation('en', missingKey)).toBe(missingKey);
    expect(getTranslation('es', missingKey)).toBe(missingKey);
  });
});
