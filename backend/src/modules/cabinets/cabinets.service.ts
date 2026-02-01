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
      users: {
        count: userCount,
        max: cabinet?.maxUsers || 5,
      },
      documents: {
        count: documentCount,
      },
      folders: {
        count: folderCount,
      },
      storage: {
        used: Number(storageUsed._sum?.size || 0),
        max: Number(cabinet?.maxStorage || 10737418240),
        usedFormatted: this.formatBytes(Number(storageUsed._sum?.size || 0)),
        maxFormatted: this.formatBytes(Number(cabinet?.maxStorage || 10737418240)),
      },
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const cabinetsService = new CabinetsService();
