import { useEffect } from "react";
import { useRouter } from "next/router";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/recipes");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <LoadingSpinner size="lg" message="Opening the cookbook..." />
    </div>
  );
}
