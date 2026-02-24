import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Navbar from "@/components/Navbar";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import InstallPrompt from "@/components/InstallPrompt";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Navbar />
      <main className="p-4">
        <Component {...pageProps} />
      </main>
      <InstallPrompt />
    </>
  );
}
