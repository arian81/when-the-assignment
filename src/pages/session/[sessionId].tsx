import Head from "next/head";
import { api } from "@/utils/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  Trash2,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import type { RouterOutputs } from "@/utils/api";
import { useRouter } from "next/router";
import ClipboardButton from "@/components/ClipboardButton";
import { env } from "@/env";

type Assignment = RouterOutputs["assignment"]["get"][number];

function Home({ sessionId }: { sessionId: string }) {
  const utils = api.useUtils();
  const session = api.session.get.useQuery({
    id: sessionId,
  });
  const courses = api.course.get.useQuery();
  const createAssignment = api.assignment.create.useMutation({
    async onMutate(newAssignment) {
      await utils.assignment.get.cancel();

      const previousAssignments = utils.assignment.get.getData();

      utils.assignment.get.setData({ sessionId }, (old) => {
        const optimisticAssignment = {
          id: -1,
          title: newAssignment.title,
          url: newAssignment.url ?? null,
          dueDate: newAssignment.dueDate,
          courseCode: newAssignment.courseCode,
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          course: { code: newAssignment.courseCode, name: "" },
          sessionId: sessionId,
        } satisfies Assignment;
        return old ? [...old, optimisticAssignment] : [optimisticAssignment];
      });

      return { previousAssignments };
    },
    onError(_err, _newAssignment, context) {
      utils.assignment.get.setData(
        { sessionId: sessionId },
        context?.previousAssignments,
      );
    },
    onSettled() {
      void utils.assignment.get.invalidate();
    },
    onSuccess: () => {
      form.reset();
      void session.refetch();
    },
  });

  const createCourse = api.course.create.useMutation({
    onSuccess: () => {
      setCourseDialogOpen(false);
      courseForm.reset();
      void courses.refetch();
    },
  });

  const [courseDialogOpen, setCourseDialogOpen] = useState(false);

  // Add course form
  const courseForm = useForm({
    defaultValues: {
      code: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      createCourse.mutate(value);
    },
  });

  const form = useForm({
    defaultValues: {
      title: "",
      url: "",
      dueDate: "",
      courseCode: "",
    },
    onSubmit: async ({ value }) => {
      createAssignment.mutate({
        ...value,
        dueDate: new Date(value.dueDate),
        sessionId: sessionId,
      });
    },
  });

  // Add state for forcing updates
  const [, setForceUpdate] = useState(0);

  // Add effect for real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Add delete mutation
  const deleteAssignment = api.assignment.delete.useMutation({
    onSuccess: () => {
      void session.refetch();
    },
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await utils.assignment.get.cancel();

      // Save previous assignments
      const previousAssignments = utils.assignment.get.getData();

      // Optimistically update assignments
      utils.assignment.get.setData({ sessionId: sessionId }, (old) => {
        if (!old) return [];
        return old.filter((assignment) => assignment.id !== id);
      });

      return { previousAssignments };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      utils.assignment.get.setData(
        { sessionId: sessionId },
        context?.previousAssignments,
      );
    },
  });

  return (
    <>
      <Head>
        <title>When the Assignment</title>
        <meta name="description" content="Manage your assignments" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="noise-bg min-h-screen bg-[hsl(228,18%,6%)] pb-16">
        <div className="relative z-10 mx-auto max-w-6xl px-5 pt-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(224,12%,16%)] bg-[hsl(225,16%,9%)] text-[hsl(218,11%,50%)] transition-all hover:border-[hsl(224,12%,22%)] hover:text-[hsl(210,20%,88%)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
              <div className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="text-[hsl(38,92%,50%)]"><path fill="currentColor" d="M10.6 16.05L17.65 9l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h4.2q.325-.9 1.088-1.45T12 1t1.713.55T14.8 3H19q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm7.538-16.963q.212-.212.212-.537t-.213-.537T12 2.75t-.537.213t-.213.537t.213.538t.537.212t.538-.213"/></svg>
                <h1 className="text-xl font-semibold tracking-tight text-[hsl(210,20%,95%)]">
                  When the Assignment
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardButton
                textForCopying={`http://${env.NEXT_PUBLIC_SITE_URL}/api/calendar?sessionId=${sessionId}`}
              >
                Calendar Link
              </ClipboardButton>
              <a
                href={`webcal://${env.NEXT_PUBLIC_SITE_URL}/api/calendar?sessionId=${sessionId}`}
              >
                <Button
                  variant="outline"
                  className="border-[hsl(224,12%,16%)] bg-transparent text-[hsl(210,20%,80%)] hover:border-[hsl(224,12%,22%)] hover:bg-[hsl(225,16%,10%)] hover:text-[hsl(210,20%,92%)]"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Subscribe
                </Button>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-8 md:flex-row md:items-start">
          {/* Create Assignment Form */}
          <div className="glass-card-glow rounded-xl p-6 md:sticky md:top-8 md:w-[380px] md:shrink-0">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[hsl(210,20%,92%)]">
                New Assignment
              </h2>
              <p className="mt-1 text-sm text-[hsl(218,11%,45%)]">
                Add an upcoming deadline to track.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
              className="space-y-5"
            >
              <div className="grid gap-5">
                <form.Field
                  name="title"
                  validators={{
                    onChange: ({ value }) =>
                      !value
                        ? "Title is required"
                        : value.length < 3
                          ? "Title must be at least 3 characters"
                          : undefined,
                  }}
                >
                  {(field) => (
                    <div className="space-y-1.5">
                      <label
                        htmlFor={field.name}
                        className="text-[13px] font-medium text-[hsl(218,11%,55%)]"
                      >
                        Title
                      </label>
                      <Input
                        id={field.name}
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter assignment title"
                        className="input-dark h-10 rounded-lg border bg-[hsl(225,16%,8%)] text-[hsl(210,20%,88%)] placeholder:text-[hsl(218,11%,35%)] focus-visible:ring-0"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-red-400">
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field name="url">
                  {(field) => (
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[hsl(218,11%,55%)]">
                        Link
                        <span className="ml-1.5 text-[hsl(218,11%,35%)]">
                          (optional)
                        </span>
                      </label>
                      <Input
                        type="url"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://..."
                        className="input-dark h-10 rounded-lg border bg-[hsl(225,16%,8%)] text-[hsl(210,20%,88%)] placeholder:text-[hsl(218,11%,35%)] focus-visible:ring-0"
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="courseCode">
                  {(field) => (
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[hsl(218,11%,55%)]">
                        Course
                      </label>
                      <div className="flex gap-2">
                        <Select
                          value={field.state.value}
                          onValueChange={field.handleChange}
                        >
                          <SelectTrigger className="input-dark h-10 rounded-lg border bg-[hsl(225,16%,8%)] text-[hsl(210,20%,88%)] focus:ring-0 [&>span]:text-[hsl(218,11%,35%)] [&[data-state=open]>span]:text-[hsl(210,20%,88%)]">
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-[hsl(224,12%,18%)] bg-[hsl(225,16%,10%)] text-[hsl(210,20%,88%)]">
                            {courses.isLoading ? (
                              <SelectItem value="loading">
                                Loading courses...
                              </SelectItem>
                            ) : (
                              courses.data?.map((course) => (
                                <SelectItem
                                  key={course.code}
                                  value={course.code}
                                  className="focus:bg-[hsl(225,16%,14%)] focus:text-[hsl(210,20%,92%)]"
                                >
                                  {course.code} - {course.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>

                        <Dialog
                          open={courseDialogOpen}
                          onOpenChange={setCourseDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 shrink-0 rounded-lg border-[hsl(224,12%,16%)] bg-[hsl(225,16%,8%)] text-[hsl(218,11%,50%)] hover:border-[hsl(224,12%,22%)] hover:bg-[hsl(225,16%,12%)] hover:text-[hsl(38,92%,55%)]"
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-card-glow rounded-xl border-[hsl(224,12%,18%)] bg-[hsl(225,16%,9%)] text-[hsl(210,20%,92%)]">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-semibold text-[hsl(210,20%,95%)]">
                                New Course
                              </DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void courseForm.handleSubmit();
                              }}
                              className="space-y-4"
                            >
                              <courseForm.Field
                                name="code"
                                validators={{
                                  onChange: ({ value }) =>
                                    !value
                                      ? "Course code is required"
                                      : value.length < 2
                                        ? "Course code must be at least 2 characters"
                                        : undefined,
                                }}
                              >
                                {(field) => (
                                  <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-[hsl(218,11%,55%)]">
                                      Course Code
                                    </label>
                                    <Input
                                      value={field.state.value}
                                      onChange={(e) =>
                                        field.handleChange(e.target.value)
                                      }
                                      placeholder="e.g., 3AC3"
                                      className="input-dark h-10 rounded-lg border bg-[hsl(225,16%,8%)] text-[hsl(210,20%,88%)] placeholder:text-[hsl(218,11%,35%)] focus-visible:ring-0"
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                      <p className="text-xs text-red-400">
                                        {field.state.meta.errors.join(", ")}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </courseForm.Field>

                              <courseForm.Field
                                name="name"
                                validators={{
                                  onChange: ({ value }) =>
                                    !value
                                      ? "Course name is required"
                                      : value.length < 3
                                        ? "Course name must be at least 3 characters"
                                        : undefined,
                                }}
                              >
                                {(field) => (
                                  <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-[hsl(218,11%,55%)]">
                                      Course Name
                                    </label>
                                    <Input
                                      value={field.state.value}
                                      onChange={(e) =>
                                        field.handleChange(e.target.value)
                                      }
                                      placeholder="e.g., Algorithms and Complexity"
                                      className="input-dark h-10 rounded-lg border bg-[hsl(225,16%,8%)] text-[hsl(210,20%,88%)] placeholder:text-[hsl(218,11%,35%)] focus-visible:ring-0"
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                      <p className="text-xs text-red-400">
                                        {field.state.meta.errors.join(", ")}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </courseForm.Field>

                              <courseForm.Subscribe
                                selector={(state) => [
                                  state.canSubmit,
                                  state.isSubmitting,
                                ]}
                              >
                                {([canSubmit, isSubmitting]) => (
                                  <button
                                    type="submit"
                                    className="btn-accent w-full rounded-lg py-2.5 text-sm disabled:opacity-50"
                                    disabled={
                                      !canSubmit || createCourse.isPending
                                    }
                                  >
                                    {isSubmitting || createCourse.isPending
                                      ? "Creating..."
                                      : "Create Course"}
                                  </button>
                                )}
                              </courseForm.Subscribe>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="dueDate"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return "Due date is required";
                      const date = new Date(value);
                      if (date <= new Date())
                        return "Due date must be in the future";
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[hsl(218,11%,55%)]">
                        Due Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "input-dark h-10 w-full justify-start rounded-lg border bg-[hsl(225,16%,8%)] text-left font-normal text-[hsl(210,20%,88%)] hover:bg-[hsl(225,16%,10%)] focus:ring-0",
                              !field.state.value && "text-[hsl(218,11%,35%)]",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[hsl(218,11%,45%)]" />
                            {field.state.value ? (
                              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                              format(
                                new Date(field.state.value),
                                "MM/dd/yyyy HH:mm",
                              )
                            ) : (
                              <span>Pick a date and time</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto rounded-xl border-[hsl(224,12%,18%)] bg-[hsl(225,16%,9%)] p-0">
                          <div className="sm:flex">
                            <Calendar
                              mode="single"
                              selected={
                                field.state.value
                                  ? new Date(field.state.value)
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  const currentValue = field.state.value
                                    ? new Date(field.state.value)
                                    : new Date();
                                  const newDate = date;
                                  newDate.setHours(currentValue.getHours());
                                  newDate.setMinutes(currentValue.getMinutes());
                                  field.handleChange(newDate.toISOString());
                                }
                              }}
                              initialFocus
                            />
                            <div className="flex flex-col divide-y divide-[hsl(224,12%,16%)] sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
                              <ScrollArea className="w-64 sm:w-auto">
                                <div className="flex p-2 sm:flex-col">
                                  {Array.from({ length: 24 }, (_, i) => i)
                                    .reverse()
                                    .map((hour) => (
                                      <Button
                                        key={hour}
                                        size="icon"
                                        variant={
                                          field.state.value &&
                                          new Date(
                                            field.state.value,
                                          ).getHours() === hour
                                            ? "default"
                                            : "ghost"
                                        }
                                        className="aspect-square shrink-0 sm:w-full"
                                        onClick={() => {
                                          const date = field.state.value
                                            ? new Date(field.state.value)
                                            : new Date();
                                          date.setHours(hour);
                                          field.handleChange(
                                            date.toISOString(),
                                          );
                                        }}
                                      >
                                        {hour}
                                      </Button>
                                    ))}
                                </div>
                                <ScrollBar
                                  orientation="horizontal"
                                  className="sm:hidden"
                                />
                              </ScrollArea>
                              <ScrollArea className="w-64 sm:w-auto">
                                <div className="flex p-2 sm:flex-col">
                                  {Array.from(
                                    { length: 12 },
                                    (_, i) => i * 5,
                                  ).map((minute) => (
                                    <Button
                                      key={minute}
                                      size="icon"
                                      variant={
                                        field.state.value &&
                                        new Date(
                                          field.state.value,
                                        ).getMinutes() === minute
                                          ? "default"
                                          : "ghost"
                                      }
                                      className="aspect-square shrink-0 sm:w-full"
                                      onClick={() => {
                                        const date = field.state.value
                                          ? new Date(field.state.value)
                                          : new Date();
                                        date.setMinutes(minute);
                                        field.handleChange(date.toISOString());
                                      }}
                                    >
                                      {minute.toString().padStart(2, "0")}
                                    </Button>
                                  ))}
                                </div>
                                <ScrollBar
                                  orientation="horizontal"
                                  className="sm:hidden"
                                />
                              </ScrollArea>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-red-400">
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <button
                    type="submit"
                    className="btn-accent w-full rounded-lg py-2.5 text-sm disabled:opacity-50"
                    disabled={!canSubmit || createAssignment.isPending}
                  >
                    {isSubmitting || createAssignment.isPending
                      ? "Submitting..."
                      : "Add Assignment"}
                  </button>
                )}
              </form.Subscribe>
            </form>
          </div>

          {/* Assignments List */}
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[hsl(218,11%,45%)]">
                Assignments
                {session.data?.assignments && session.data.assignments.length > 0 && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(225,16%,14%)] text-[11px] font-medium tabular-nums text-[hsl(218,11%,55%)]">
                    {session.data.assignments.length}
                  </span>
                )}
              </h2>
            </div>

            {session.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[hsl(224,12%,20%)] border-t-[hsl(38,92%,50%)]" />
              </div>
            ) : session.data?.assignments.length === 0 ? (
              <div className="glass-card rounded-xl py-16 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(225,16%,12%)]">
                  <CalendarIcon className="h-4 w-4 text-[hsl(218,11%,40%)]" />
                </div>
                <p className="text-sm text-[hsl(218,11%,45%)]">
                  No assignments yet. Add one above to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {session.data?.assignments
                  ?.sort(
                    (a, b) =>
                      new Date(a.dueDate).getTime() -
                      new Date(b.dueDate).getTime(),
                  )
                  .map((assignment, index) => {
                    const dueDate = new Date(assignment.dueDate);
                    const today = new Date();
                    const timeLeft = dueDate.getTime() - today.getTime();
                    const daysLeft = Math.ceil(
                      timeLeft / (1000 * 60 * 60 * 24),
                    );

                    let statusClass = "status-safe";
                    if (daysLeft < 0) statusClass = "status-danger";
                    else if (daysLeft <= 3) statusClass = "status-warn";

                    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                    const minutesLeft = Math.floor(
                      (timeLeft % (1000 * 60 * 60)) / (1000 * 60),
                    );
                    const secondsLeft = Math.floor(
                      (timeLeft % (1000 * 60)) / 1000,
                    );

                    const getTimeDisplay = () => {
                      if (timeLeft < 0) return "Overdue";
                      if (daysLeft > 1) return `${daysLeft} days left`;
                      if (timeLeft < 1000 * 60 * 60 * 24) {
                        return `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s left`;
                      }
                      return "Due today";
                    };

                    return (
                      <div
                        key={assignment.id}
                        className="animate-fade-slide-in"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <div className="assignment-card group rounded-xl p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="min-w-0 truncate text-[15px] font-semibold text-[hsl(210,20%,90%)]">
                              {assignment.title}
                            </h3>
                            <div className="flex shrink-0 items-center gap-2">
                              {assignment.url && (
                                <Link
                                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                  href={assignment.url}
                                  target="_blank"
                                  className="text-[hsl(218,11%,40%)] transition-colors hover:text-[hsl(38,92%,55%)]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteAssignment.mutate({
                                    id: assignment.id,
                                  });
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[hsl(218,11%,35%)] opacity-0 transition-all hover:bg-[hsl(0,70%,50%,0.08)] hover:text-red-400 group-hover:opacity-100"
                              >
                                {timeLeft < 0 ? (
                                  <CheckCircle className="h-4 w-4 text-[hsl(152,60%,55%)]" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[hsl(218,11%,45%)]">
                            <span className="inline-flex items-center rounded-md bg-[hsl(225,16%,13%)] px-2 py-0.5 font-medium text-[hsl(218,11%,55%)]">
                              {assignment.course.code}
                            </span>
                            <span>
                              {dueDate.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {dueDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span
                              className={`${statusClass} ${
                                timeLeft > 0 &&
                                timeLeft < 1000 * 60 * 60 * 24
                                  ? "animate-soft-pulse"
                                  : ""
                              } ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums`}
                            >
                              {getTimeDisplay()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function Wrapper() {
  const router = useRouter();
  const { sessionId } = router.query;
  if (!sessionId || typeof sessionId !== "string") {
    return null;
  }

  return <Home sessionId={sessionId} />;
}
