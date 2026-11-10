import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import Navbar from "./Navbar";
import { Button } from "./ui/button";

export default function ContentStatus({
  loading,
  error,
  kind,
  back,
  retry,
}: {
  loading?: boolean;
  error?: boolean;
  kind: string;
  back: string;
  retry: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <Navbar />
      <main className="text-center space-y-6" role={error ? "alert" : "status"}>
        {loading ? (
          <>
            <Loader2
              className="mx-auto w-8 h-8 animate-spin"
              aria-hidden="true"
            />
            <p>正在加载{kind}…</p>
          </>
        ) : (
          <>
            <p>{error ? `${kind}加载失败，请重试` : `404 · ${kind}不存在`}</p>
            <div className="flex justify-center gap-4">
              {error && <Button onClick={retry}>重试</Button>}
              <Button variant="outline" asChild>
                <Link href={back}>返回{kind}列表</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
