import { IntlProvider as GenericIntlProvider } from "react-intl";

const IntlProvider = ({ children }) => {
  const locale = navigator.language;
  return <GenericIntlProvider locale={locale}>{children}</GenericIntlProvider>;
};

export default IntlProvider;
