import { api } from "@/utils/api";
import { useRouter } from "next/router";
import React from "react";
import { z } from "zod";
import Head from "next/head";
import { ArrowRight, Plus } from "lucide-react";

// Update schema definitions
const sessionSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.string().datetime(),
});
const sessionsArraySchema = z.array(sessionSchema);

export default function Home() {
  const router = useRouter();
  const createSession = api.session.create.useMutation({
    onSuccess: async (data) => {
      try {
        // Validate the new session ID
        const validSessionId = z.string().cuid().parse(data);
        const newSession = {
          id: validSessionId,
          createdAt: new Date().toISOString(),
        };
        const updatedSessions = [...sessions, newSession];
        localStorage.setItem("sessions", JSON.stringify(updatedSessions));
        setSessions(updatedSessions);
        await router.push(`/session/${validSessionId}`, undefined, {
          shallow: true,
        });
      } catch (error) {
        console.error("Invalid session ID:", error);
      }
    },
  });
  const [sessions, setSessions] = React.useState<
    z.infer<typeof sessionsArraySchema>
  >([]);

  React.useEffect(() => {
    // Load sessions from localStorage on component mount
    const storedSessions = localStorage.getItem("sessions");
    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions) as unknown;
        // Validate the parsed data against our schema
        const validatedSessions = sessionsArraySchema.parse(parsed);
        setSessions(validatedSessions);
      } catch (error) {
        console.error("Invalid sessions data:", error);
        // Clear invalid data from localStorage
        localStorage.removeItem("sessions");
      }
    }
  }, []);

  const startNewSession = () => {
    createSession.mutate();
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Head>
        <title>When The Assignment</title>
        <meta name="description" content="Track and manage your upcoming assignments" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="hero-gradient noise-bg flex min-h-screen flex-col items-center justify-center px-6 py-24">
        <div className="relative z-10 w-full max-w-lg">
          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(224,12%,18%)] bg-[hsl(225,16%,9%)] px-4 py-1.5 text-xs tracking-wide text-[hsl(218,11%,55%)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" className="text-[hsl(38,92%,50%)]"><path fill="currentColor" d="M10.6 16.05L17.65 9l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h4.2q.325-.9 1.088-1.45T12 1t1.713.55T14.8 3H19q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm7.538-16.963q.212-.212.212-.537t-.213-.537T12 2.75t-.537.213t-.213.537t.213.538t.537.212t.538-.213"/></svg>
              Assignment tracker
            </div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-[hsl(210,20%,95%)] sm:text-5xl">
              When The
              <span className="block bg-gradient-to-r from-[hsl(38,92%,55%)] to-[hsl(28,90%,50%)] bg-clip-text text-transparent">
                Assignment
              </span>
            </h1>
            <p className="mx-auto max-w-sm text-base text-[hsl(218,11%,50%)]">
              Stay on top of deadlines. Track what&apos;s due, sync your calendar, and never miss a submission.
            </p>
          </div>

          {/* CTA */}
          <div className="mb-10 flex justify-center">
            <button
              onClick={startNewSession}
              disabled={createSession.isPending}
              className="btn-accent group inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold tracking-wide disabled:opacity-50"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              {createSession.isPending ? "Creating..." : "New Session"}
            </button>
          </div>

          {/* Previous Sessions */}
          {sessions.length > 0 && (
            <div className="animate-fade-slide-in">
              <div className="mb-4 flex items-center gap-3">
                <div className="divider-fade flex-1" />
                <span className="text-xs font-medium uppercase tracking-widest text-[hsl(218,11%,40%)]">
                  Recent
                </span>
                <div className="divider-fade flex-1" />
              </div>
              <div className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto pr-1">
                {sessions
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((session, index) => (
                    <button
                      key={session.id}
                      onClick={() => router.push(`/session/${session.id}`)}
                      className="assignment-card group flex w-full items-center justify-between rounded-lg px-4 py-3 text-left"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(38,92%,50%,0.08)] text-[hsl(38,92%,55%)]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M10.6 16.05L17.65 9l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h4.2q.325-.9 1.088-1.45T12 1t1.713.55T14.8 3H19q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm7.538-16.963q.212-.212.212-.537t-.213-.537T12 2.75t-.537.213t-.213.537t.213.538t.537.212t.538-.213"/></svg>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[hsl(210,20%,88%)]">
                            Session
                          </span>
                          <span className="ml-2 text-xs text-[hsl(218,11%,45%)]">
                            {formatRelativeDate(session.createdAt)}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[hsl(218,11%,35%)] transition-all group-hover:translate-x-0.5 group-hover:text-[hsl(38,92%,55%)]" />
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
