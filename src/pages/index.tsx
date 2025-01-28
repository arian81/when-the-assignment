import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const { data } = api.session.create.useQuery();

  console.log(data);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white">
            Welcome to Your App
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Get started by creating a new session
          </p>
          <Button size="lg" onClick={() => router.push(`/session/${data}`)}>
            Start Session
          </Button>
        </div>
      </div>
    </main>
  );
}
