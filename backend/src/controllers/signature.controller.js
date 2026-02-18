const prisma = require('../config/database');
const universignService = require('../services/universign.service');
const storageService = require('../services/storage.service');
const { successResponse } = require('../utils/response');

const initiate = async (req, res, next) => {
  try {
    const { documentId, signers } = req.body;

    const document = await prisma.document.findFirst({
      where: { id: documentId, tenantId: req.tenant.id },
    });

    const presignedUrl = await storageService.generatePresignedUrl(document.objectKey, 86400);
    const transaction = await universignService.createTransaction(presignedUrl, signers);

    const signatures = await Promise.all(
      transaction.signatureUrls.map(s =>
        prisma.signature.create({
          data: {
            documentId,
            signerEmail: s.email,
            signerName: signers.find(signer => signer.email === s.email).firstName,
            transactionId: transaction.transactionId,
            signatureUrl: s.url,
            status: 'PENDING',
          },
        })
      )
    );

    return successResponse(res, { signatures });
  } catch (error) {
    next(error);
  }
};

const webhook = async (req, res) => {
  const { transactionId, status } = req.body;

  await prisma.signature.updateMany({
    where: { transactionId },
    data: {
      status: status === 'completed' ? 'SIGNED' : 'PENDING',
      signedAt: status === 'completed' ? new Date() : null,
    },
  });

  res.status(200).send('OK');
};

module.exports = { initiate, webhook };
