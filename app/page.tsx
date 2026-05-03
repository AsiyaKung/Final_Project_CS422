import { redirect } from "next/navigation";

// Root page redirects authenticated users to dashboard,
// unauthenticated users to login.
// The actual auth check happens client-side inside the dashboard layout.
export default function HomePage() {
  redirect("/login");
}
