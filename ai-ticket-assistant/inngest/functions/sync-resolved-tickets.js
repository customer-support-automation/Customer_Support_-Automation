import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import { storeResolvedTicket } from "../../utils/rag.js";

export const syncResolvedTickets = inngest.createFunction(
  {
    id: "sync-resolved-tickets",
    retries: 2,
    triggers: [{ cron: "0 2 * * *" }],
  },
  async ({ step }) => {
    const newlyResolved = await step.run("find-unsynced-tickets", async () => {
      return await Ticket.find({
        status: "RESOLVED",
        resolutionNote: { $ne: null },
      }).lean();
    });

    let synced = 0;
    for (const ticket of newlyResolved) {
      await step.run(`sync-ticket-${ticket._id}`, async () => {
        await storeResolvedTicket(ticket);
        synced++;
      });
    }

    console.log(`Synced ${synced} resolved tickets to Qdrant`);
    return { synced };
  }
);