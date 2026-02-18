const prisma = require('../config/database');
const { successResponse } = require('../utils/response');
const { BadRequestError } = require('../utils/errors');

const getStatus = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { onboardingCompleted: true, onboardingStep: true },
    });

    return successResponse(res, {
      completed: user.onboardingCompleted,
      currentStep: user.onboardingStep,
    });
  } catch (error) {
    next(error);
  }
};

const saveStep = async (req, res, next) => {
  try {
    const step = parseInt(req.params.step, 10);
    if (isNaN(step) || step < 1 || step > 5) {
      throw new BadRequestError('Invalid step number (1-5)');
    }

    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    switch (step) {
      case 2: {
        // Profil cabinet
        const { name, address, city, zipCode, phone, email, siret, toque, barreau } = req.body;
        if (!name || !address || !city || !zipCode || !phone || !email || !barreau) {
          throw new BadRequestError('Missing required fields: name, address, city, zipCode, phone, email, barreau');
        }

        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            name,
            address,
            city,
            postalCode: zipCode,
            phone,
            email,
            siret: siret || null,
            toque: toque || null,
            barreau: barreau || null,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { onboardingStep: 2 },
        });

        return successResponse(res, { step: 2 }, 'Cabinet profile saved');
      }

      case 3: {
        // Arborescences
        const { juridique, judiciaire } = req.body;
        if (!Array.isArray(juridique) || !Array.isArray(judiciaire)) {
          throw new BadRequestError('juridique and judiciaire must be arrays');
        }

        // Upsert juridique tree template
        await prisma.folderTreeTemplate.upsert({
          where: {
            tenantId_name: { tenantId, name: 'Juridique' },
          },
          create: {
            tenantId,
            name: 'Juridique',
            folderType: 'juridique',
            categories: juridique,
            isDefault: true,
          },
          update: {
            categories: juridique,
            isDefault: true,
          },
        });

        // Upsert judiciaire tree template
        await prisma.folderTreeTemplate.upsert({
          where: {
            tenantId_name: { tenantId, name: 'Judiciaire' },
          },
          create: {
            tenantId,
            name: 'Judiciaire',
            folderType: 'judiciaire',
            categories: judiciaire,
            isDefault: true,
          },
          update: {
            categories: judiciaire,
            isDefault: true,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { onboardingStep: 3 },
        });

        return successResponse(res, { step: 3 }, 'Tree templates saved');
      }

      case 4: {
        // Intégrations (informative only)
        await prisma.user.update({
          where: { id: userId },
          data: { onboardingStep: 4 },
        });

        return successResponse(res, { step: 4 }, 'Integrations step acknowledged');
      }

      default:
        throw new BadRequestError('Step not implemented for saving');
    }
  } catch (error) {
    next(error);
  }
};

const complete = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        onboardingCompleted: true,
        onboardingStep: 5,
      },
    });

    return successResponse(res, { completed: true }, 'Onboarding completed');
  } catch (error) {
    next(error);
  }
};

module.exports = { getStatus, saveStep, complete };
