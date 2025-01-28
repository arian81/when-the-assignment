import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import React from "react";
import { z } from "zod";

// Update schema definitions
const sessionSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.string().datetime(),
});
const sessionsArraySchema = z.array(sessionSchema);

export default function Home() {
  const router = useRouter();
  const { data } = api.session.create.useQuery();
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

  const startNewSession = async () => {
    if (data) {
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
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white">
            When The Assignment
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Track and manage your upcoming assignments
          </p>
          <Button size="lg" onClick={startNewSession}>
            Start Session
          </Button>

          {sessions.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-2xl text-white">Previous Sessions</h2>
              <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
                {sessions
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((session) => (
                    <Button
                      key={session.id}
                      variant="outline"
                      onClick={() => router.push(`/session/${session.id}`)}
                    >
                      Session {new Date(session.createdAt).toLocaleString()}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
