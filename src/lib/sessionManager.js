import prisma from "./prisma.js";

let activeSessionId = null;

export async function initActiveSession() {
  const activeSession = await prisma.session.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  activeSessionId = activeSession ? activeSession.id : null;
}

export async function startSession(name) {
  const session = await prisma.session.create({
    data: { name },
  });
  activeSessionId = session.id;
  return session;
}

export async function stopSession() {
  if (!activeSessionId) return null;
  const session = await prisma.session.update({
    where: { id: activeSessionId },
    data: { endedAt: new Date() },
  });
  activeSessionId = null;
  return session;
}

export async function getActiveSessionId() {
  // If cached, use it
  if (activeSessionId) return activeSessionId;

  // Otherwise check DB
  const activeSession = await prisma.session.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  activeSessionId = activeSession ? activeSession.id : null;
  return activeSessionId;
}
