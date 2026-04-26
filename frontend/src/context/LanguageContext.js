// LanguageContext.js - Provides a React context for 
// managing the user's language preference in the Stay Fit app. 
// Allows components to access the current 
// language and a translation function (t) for 
// retrieving localized strings. 
// The selected language is persisted in local 
// storage to maintain the user's preference across sessions.


//import necessary React hooks and translation utility
import { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from '../utils/translations';



// Create a context for language management
const LanguageContext = createContext();




// Custom hook to access the LanguageContext, 
// ensuring it is used within a provider
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};






// LanguageProvider component that wraps the app 
// and provides language state and translation function
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');






  // Whenever the language changes, save it to local storage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);





  // Translation function that components can use to get
  const t = (key) => getTranslation(language, key);




  // Provide the current language, a function to change it,
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
