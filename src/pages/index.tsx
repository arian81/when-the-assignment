import Head from "next/head";
import { api } from "@/utils/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Copy } from "lucide-react";
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
import { PlusCircle, Trash2, CheckCircle, ClipboardCopy } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import type { RouterOutputs } from "@/utils/api";

type Assignment = RouterOutputs["assignment"]["get"][number];

export default function Home() {
  const utils = api.useUtils();
  const assignments = api.assignment.get.useQuery();
  const courses = api.course.get.useQuery();
  const createAssignment = api.assignment.create.useMutation({
    async onMutate(newAssignment) {
      await utils.assignment.get.cancel();

      const previousAssignments = utils.assignment.get.getData();

      utils.assignment.get.setData(undefined, (old) => {
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
        } satisfies Assignment;
        return old ? [...old, optimisticAssignment] : [optimisticAssignment];
      });

      return { previousAssignments };
    },
    onError(_err, _newAssignment, context) {
      utils.assignment.get.setData(undefined, context?.previousAssignments);
    },
    onSettled() {
      void utils.assignment.get.invalidate();
    },
    onSuccess: () => {
      form.reset();
      void assignments.refetch();
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
      void assignments.refetch();
    },
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await utils.assignment.get.cancel();

      // Save previous assignments
      const previousAssignments = utils.assignment.get.getData();

      // Optimistically update assignments
      utils.assignment.get.setData(undefined, (old) => {
        if (!old) return [];
        return old.filter((assignment) => assignment.id !== id);
      });

      return { previousAssignments };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      utils.assignment.get.setData(undefined, context?.previousAssignments);
    },
  });

  return (
    <>
      <Head>
        <title>When the Assignment</title>
        <meta name="description" content="Manage your assignments" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-[#121212] p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-3xl font-medium text-white/90">
            When the Assignment
          </h1>

          {/* Submit Form */}
          <Card className="border-0 bg-[#1a1a1a] text-white/90">
            <CardHeader>
              <CardTitle className="text-2xl font-medium">
                Create New Assignment
              </CardTitle>
              <CardDescription className="text-white/60">
                Fill out the form below to create a new assignment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void form.handleSubmit();
                }}
                className="space-y-6"
              >
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
                    <div className="space-y-2">
                      <label
                        htmlFor={field.name}
                        className="text-base font-medium text-white/90"
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
                        className="border-0 bg-[#2a2a2a] text-white/90 placeholder:text-white/40"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-red-500">
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field name="url">
                  {(field) => (
                    <div className="space-y-2">
                      <label className="text-base font-medium text-white/90">
                        Assignment Link
                      </label>
                      <Input
                        type="url"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://..."
                        className="border-0 bg-[#2a2a2a] text-white/90 placeholder:text-white/40"
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="courseCode">
                  {(field) => (
                    <div className="space-y-2">
                      <label className="text-base font-medium text-white/90">
                        Course Code
                      </label>
                      <div className="flex gap-2">
                        <Select
                          value={field.state.value}
                          onValueChange={field.handleChange}
                        >
                          <SelectTrigger className="border-0 bg-[#2a2a2a] text-white/90">
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent className="border-0 bg-[#2a2a2a] text-white/90">
                            {courses.isLoading ? (
                              <SelectItem value="loading">
                                Loading courses...
                              </SelectItem>
                            ) : (
                              courses.data?.map((course) => (
                                <SelectItem
                                  key={course.code}
                                  value={course.code}
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
                              className="border-0 bg-[#2a2a2a] text-white/90 hover:bg-[#3a3a3a]"
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="border-0 bg-[#1a1a1a] text-white/90">
                            <DialogHeader>
                              <DialogTitle>Create New Course</DialogTitle>
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
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/90">
                                      Course Code
                                    </label>
                                    <Input
                                      value={field.state.value}
                                      onChange={(e) =>
                                        field.handleChange(e.target.value)
                                      }
                                      placeholder="e.g., 3AC3"
                                      className="border-0 bg-[#2a2a2a] text-white/90 placeholder:text-white/40"
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                      <p className="text-sm text-red-500">
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
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/90">
                                      Course Name
                                    </label>
                                    <Input
                                      value={field.state.value}
                                      onChange={(e) =>
                                        field.handleChange(e.target.value)
                                      }
                                      placeholder="e.g., Algorithms and Complexity"
                                      className="border-0 bg-[#2a2a2a] text-white/90 placeholder:text-white/40"
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                      <p className="text-sm text-red-500">
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
                                  <Button
                                    type="submit"
                                    className="w-full bg-[#00c853] text-black hover:bg-[#00b34a]"
                                    disabled={
                                      !canSubmit || createCourse.isPending
                                    }
                                  >
                                    {isSubmitting || createCourse.isPending
                                      ? "Creating..."
                                      : "Create Course"}
                                  </Button>
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
                    <div className="space-y-2">
                      <label className="text-base font-medium text-white/90">
                        Due Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start border-0 bg-[#2a2a2a] text-left font-normal text-white/90",
                              !field.state.value && "text-white/40",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
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
                        <PopoverContent className="w-auto border-0 p-0">
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
                            <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
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
                        <p className="text-sm text-red-500">
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      className="w-full bg-[#00c853] text-black hover:bg-[#00b34a]"
                      disabled={!canSubmit || createAssignment.isPending}
                    >
                      {isSubmitting || createAssignment.isPending
                        ? "Submitting..."
                        : "Submit Assignment"}
                    </Button>
                  )}
                </form.Subscribe>
              </form>
            </CardContent>
          </Card>

          {/* Assignments List */}
          <Card className="border-0 bg-[#1a1a1a] text-white/90">
            <CardHeader className="flex flex-row justify-between">
              <div>
                <CardTitle>Current Assignments</CardTitle>
                <CardDescription>
                  View and manage your existing assignments.
                </CardDescription>
              </div>
              <Button
                onMouseDown={() => {
                  console.log("Click");
                }}
              >
                <Copy />
                Calendar Link
              </Button>
            </CardHeader>
            <CardContent>
              {assignments.isLoading ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : assignments.data?.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No assignments yet
                </p>
              ) : (
                <div className="space-y-4">
                  {assignments.data
                    ?.sort(
                      (a, b) =>
                        new Date(a.dueDate).getTime() -
                        new Date(b.dueDate).getTime(),
                    )
                    .map((assignment) => {
                      const dueDate = new Date(assignment.dueDate);
                      const today = new Date(); // This will now update every second
                      const timeLeft = dueDate.getTime() - today.getTime();
                      const daysLeft = Math.ceil(
                        timeLeft / (1000 * 60 * 60 * 24),
                      );

                      let statusColor = "bg-green-500";
                      if (daysLeft < 0) statusColor = "bg-red-500";
                      else if (daysLeft <= 3) statusColor = "bg-yellow-500";

                      // Calculate detailed time remaining when less than 24 hours
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
                        <div key={assignment.id}>
                          <Link
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            href={assignment.url ?? "#"}
                            target={assignment.url ? "_blank" : undefined}
                            className="flex-1 cursor-pointer"
                            onClick={(e) => {
                              if (!assignment.url) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <div className="rounded-lg border p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold">
                                    {assignment.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {assignment.course.code} -{" "}
                                    {assignment.course.name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`rounded-full ${statusColor} px-3 py-1 text-sm font-medium text-black`}
                                  >
                                    {getTimeDisplay()}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      deleteAssignment.mutate({
                                        id: assignment.id,
                                      });
                                    }}
                                    className="hover:bg-red-500/10"
                                  >
                                    {timeLeft < 0 ? (
                                      <CheckCircle className="text-green-500" />
                                    ) : (
                                      <Trash2 className="h-10 w-10 *:text-red-500" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Due: {dueDate.toLocaleDateString()} at{" "}
                                {dueDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
