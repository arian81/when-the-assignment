import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/server/db";
import { createEvents, type DateTime, type EventAttributes } from "ics";
import { TRPCError } from "@trpc/server";
import { env } from "@/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const assignments = await db.assignment.findMany({
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

  res.setHeader("Content-Type", "text/calendar");
  res.status(200).send(ics);
}

const dateToArray = (date: Date): DateTime => {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
};
