import { prisma } from '@/config/database';
import { NotFoundError } from '@/utils/errors';
import type { UpdateCabinetInput } from './cabinets.schemas';

export class CabinetsService {
  /**
   * Get cabinet by ID
   */
  async getCabinet(cabinetId: string) {
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: {
        id: true,
        name: true,
        email: true,
        siret: true,
        address: true,
        postalCode: true,
        city: true,
        phone: true,
        status: true,
        trialEndsAt: true,
        maxUsers: true,
        maxStorage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!cabinet) {
      throw new NotFoundError('Cabinet not found');
    }

    // Convert BigInt to number for JSON serialization
    return {
      ...cabinet,
      maxStorage: Number(cabinet.maxStorage),
    };
  }

  /**
   * Update cabinet
   */
  async updateCabinet(cabinetId: string, data: UpdateCabinetInput, userId: string) {
    const cabinet = await prisma.cabinet.update({
      where: { id: cabinetId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        siret: true,
        address: true,
        postalCode: true,
        city: true,
        phone: true,
        status: true,
        updatedAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        cabinetId,
        userId,
        action: 'CABINET_UPDATED',
        entity: 'Cabinet',
        entityId: cabinetId,
        details: { changes: data },
      },
    });

    return cabinet;
  }

  /**
   * Get cabinet statistics
   */
  async getCabinetStats(cabinetId: string) {
    const [userCount, documentCount, folderCount, storageUsed] = await Promise.all([
      prisma.user.count({
        where: { cabinetId, deletedAt: null },
      }),
      prisma.document.count({
        where: { cabinetId, deletedAt: null },
      }),
      prisma.folder.count({
        where: { cabinetId, deletedAt: null },
      }),
      prisma.document.aggregate({
        where: { cabinetId, deletedAt: null },
        _sum: { size: true },
      }),
    ]);

    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { maxUsers: true, maxStorage: true },
    });

    return {
      totalUsers: userCount,
      totalDocuments: documentCount,
      totalFolders: folderCount,
      storageUsed: Number(storageUsed._sum?.size || 0),
      storageLimit: Number(cabinet?.maxStorage || 10737418240),
    };
  }
}

export const cabinetsService = new CabinetsService();
