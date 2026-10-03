import type { Metadata } from "next";
import { VerifyEmailView } from "@/modules/auth/components/VerifyEmailView";

export const metadata: Metadata = { title: "Confirmation de l'e-mail", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <VerifyEmailView verificationKey={decodeURIComponent(key)} />;
}
