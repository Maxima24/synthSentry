import { AuthForm } from "../_components/auth-form";

export const metadata = {
  title: "Create account · Synth Sentry",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
