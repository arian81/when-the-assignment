import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const sessionRouter = createTRPCRouter({
  create: publicProcedure.query(async ({ ctx }) => {
    try {
      const session = await ctx.db.session.create({
        data: {},
        select: {
          id: true,
        },
      });
      return session.id;
    } catch (error) {
      throw new Error("Failed to create session");
    }
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const session = await ctx.db.session.findUnique({
          where: {
            id: input.id,
          },
          include: {
            assignments: {
              include: {
                course: true,
              },
            },
          },
        });

        if (!session) {
          throw new Error("Session not found");
        }

        return session;
      } catch (error) {
        throw new Error("Failed to get session");
      }
    }),
});
