const prisma = require('../config/database');
const sendingBoxService = require('../services/sendingbox.service');
const storageService = require('../services/storage.service');
const { successResponse } = require('../utils/response');

const send = async (req, res, next) => {
  try {
    const { documentId, recipient } = req.body;

    const document = await prisma.document.findFirst({
      where: { id: documentId, tenantId: req.tenant.id },
    });

    const presignedUrl = await storageService.generatePresignedUrl(document.objectKey);
    const result = await sendingBoxService.sendRegisteredMail(
      { url: presignedUrl },
      recipient
    );

    const lrar = await prisma.registeredMail.create({
      data: {
        documentId,
        recipientName: recipient.name,
        recipientAddress: recipient.address,
        recipientCity: recipient.city,
        recipientPostalCode: recipient.postalCode,
        recipientCountry: recipient.country || 'FR',
        sendingBoxId: result.sendingBoxId,
        trackingNumber: result.trackingNumber,
        cost: result.cost,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return successResponse(res, lrar, 'LRAR sent', 201);
  } catch (error) {
    next(error);
  }
};

const track = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const lrar = await prisma.registeredMail.findFirst({
      where: { trackingNumber },
    });

    const status = await sendingBoxService.getTrackingStatus(trackingNumber);

    await prisma.registeredMail.update({
      where: { id: lrar.id },
      data: {
        status: status.status,
        deliveredAt: status.deliveredAt,
        proofUrl: status.proofUrl,
      },
    });

    return successResponse(res, { ...lrar, ...status });
  } catch (error) {
    next(error);
  }
};

module.exports = { send, track };
