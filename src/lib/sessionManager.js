import prisma from "./prisma.js";

let activeSessionId = null;

/** Initialize the cache from DB */
export async function initActiveSession() {
  const activeSession = await prisma.session.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  activeSessionId = activeSession ? activeSession.id : null;
}

/** Start a new session — only if none is active */
export async function startSession(name) {
  // Check if a session is already active
  const existingSession = await prisma.session.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });

  if (existingSession) {
    activeSessionId = existingSession.id;
    return existingSession;
  }

  // Create new session
  const session = await prisma.session.create({
    data: {
      name: name || `Session ${new Date().toISOString()}`,
    },
  });
  activeSessionId = session.id;
  return session;
}

/** Stop the current active session */
export async function stopSession() {
  if (!activeSessionId) return null;
  const session = await prisma.session.update({
    where: { id: activeSessionId },
    data: { endedAt: new Date() },
  });
  activeSessionId = null;
  return session;
}

/** Get only the active session ID */
export async function getActiveSessionId() {
  if (activeSessionId) return activeSessionId;
  const activeSession = await prisma.session.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  activeSessionId = activeSession ? activeSession.id : null;
  return activeSessionId;
}

/** Get full active session object */
export async function getActiveSession() {
  const activeSession = await prisma.session.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  activeSessionId = activeSession ? activeSession.id : null;
  return activeSession;
}
