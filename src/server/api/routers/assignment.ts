import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const assignmentRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.assignment.findMany({
        where: {
          sessionId: input.sessionId,
        },
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
        sessionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.assignment.create({
        data: {
          title: input.title,
          url: input.url,
          dueDate: input.dueDate,
          courseCode: input.courseCode,
          sessionId: input.sessionId,
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
