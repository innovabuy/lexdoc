const prisma = require('../config/database');
const emailService = require('./email.service');
const logger = require('../config/logger');

class ReminderService {
  /**
   * Process pending reminders — called by cron or manually
   */
  async processPendingReminders() {
    const now = new Date();

    const reminders = await prisma.clientReminder.findMany({
      where: {
        status: 'pending',
        scheduledAt: { lte: now },
      },
      include: {
        // We don't have a relation, so we query manually
      },
    });

    let processed = 0;
    let errors = 0;

    for (const reminder of reminders) {
      try {
        const client = await prisma.client.findUnique({
          where: { id: reminder.clientId },
          include: {
            tenant: { select: { name: true } },
          },
        });

        if (!client) {
          await prisma.clientReminder.update({
            where: { id: reminder.id },
            data: { status: 'cancelled' },
          });
          continue;
        }

        // Check if client already completed profile
        if (reminder.type === 'profile_completion' && client.profileSubmittedAt) {
          await prisma.clientReminder.update({
            where: { id: reminder.id },
            data: { status: 'cancelled' },
          });
          continue;
        }

        // Send reminder email
        const clientName = client.companyName ||
          `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client';

        try {
          await emailService.sendDocumentRequestReminder({
            to: client.email,
            clientName,
            requestTitle: 'Compléter votre fiche d\'informations',
            folderTitle: '',
            dueDate: null,
            reminderCount: reminder.reminderNumber,
            tenantName: client.tenant?.name || 'Votre cabinet',
          });
        } catch (emailError) {
          logger.error('Failed to send reminder email:', emailError);
        }

        // Mark as sent
        await prisma.clientReminder.update({
          where: { id: reminder.id },
          data: { status: 'sent', sentAt: new Date() },
        });

        // Timeline event on first folder
        const firstFolder = await prisma.folder.findFirst({
          where: { clientId: client.id, tenantId: reminder.tenantId, deletedAt: null },
        });
        if (firstFolder) {
          await prisma.timelineEvent.create({
            data: {
              folderId: firstFolder.id,
              type: 'extranet_relance_auto',
              description: `Relance automatique #${reminder.reminderNumber} envoyée à ${client.email}`,
              metadata: { reminderNumber: reminder.reminderNumber },
            },
          });
        }

        processed++;
      } catch (error) {
        logger.error(`Error processing reminder ${reminder.id}:`, error);
        errors++;
      }
    }

    logger.info(`Reminders processed: ${processed} sent, ${errors} errors, ${reminders.length} total`);
    return { processed, errors, total: reminders.length };
  }
}

module.exports = new ReminderService();
