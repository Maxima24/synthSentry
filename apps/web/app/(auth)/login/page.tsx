import { AuthForm } from "../_components/auth-form";

export const metadata = {
  title: "Sign in · Synth Sentry",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
