import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { createEvents, type DateTime, type EventAttributes } from "ics";
import { TRPCError } from "@trpc/server";
import { env } from "@/env";

export const assignmentRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.assignment.findMany({
      include: {
        course: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });
  }),
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        url: z.string().optional(),
        dueDate: z.date().refine((date) => date > new Date(), {
          message: "Due date must be in the future",
        }),
        courseCode: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.assignment.create({
        data: {
          title: input.title,
          url: input.url,
          dueDate: input.dueDate,
          courseCode: input.courseCode,
        },
        include: {
          course: true,
        },
      });
    }),
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.assignment.delete({
        where: { id: input.id },
      });
    }),
  getCalendar: publicProcedure.output(z.string()).query(async ({ ctx }) => {
    const assignments = await ctx.db.assignment.findMany({
      include: { course: true },
    });

    // TODO might have to fix up date timezones
    const rawEvents = assignments.map((assignment) => {
      return {
        productId: "When the Assignment?",
        uid: "X" + assignment.id, // Google calendar requires an 'X' prefix
        title: assignment.courseCode + " - " + assignment.title,
        description: "",
        categories: ["event"],
        start: dateToArray(assignment.dueDate),
        created: dateToArray(assignment.createdAt),
        // todo: `tzid: 'America/Los_Angeles'`
        startOutputType: "local",
        duration: { hours: 0, minutes: 15 },
        status: "CONFIRMED",
        sequence: 0,
      } as EventAttributes;
    });

    const events = createEvents(rawEvents);
    const error = events.error;
    let ics = events.value ?? "";
    if (error) {
      throw new TRPCError({
        code: "PARSE_ERROR",
      });
    }

    // add feed metadata
    // todo: this is really brittle, make it more robust
    const methodPublish = `\r\nMETHOD:PUBLISH\r\n`;
    const markerI = ics.indexOf(methodPublish);
    if (markerI >= 0) {
      const endI = markerI + methodPublish.length;
      ics = [
        ics.slice(0, endI),
        `X-WR-CALNAME:My Courses\r\n`,
        env.SITE_URL ? `X-ORIGINAL-URL:\r\n` : env.SITE_URL,
        ics.slice(endI),
      ].join("");
    }

    return ics;
  }),
});

export const courseRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.course.findMany({
      orderBy: {
        code: "asc",
      },
    });
  }),
  create: publicProcedure
    .input(z.object({ code: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.course.create({
        data: {
          code: input.code,
          name: input.name,
        },
      });
    }),
});

const dateToArray = (date: Date): DateTime => {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
};
