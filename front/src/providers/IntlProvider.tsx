import { IntlProvider as GenericIntlProvider } from "react-intl";

const AVAILABLE_LOCALES = ["en"];

const IntlProvider = ({ children }) => {
  // REVISIT
  const localLanguages = navigator.languages;
  const chosenLocale =
    localLanguages.filter((language) =>
      AVAILABLE_LOCALES.includes(language),
    )[0] || "en";

  return (
    <GenericIntlProvider locale={chosenLocale}>{children}</GenericIntlProvider>
  );
};

export default IntlProvider;
