import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ErrorPage = ({ icon, title, children }) => (
  <Alert>
    {icon}
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{children}</AlertDescription>
  </Alert>
);

export default ErrorPage;
