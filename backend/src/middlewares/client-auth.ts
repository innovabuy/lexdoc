import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ClientTokenPayload {
  clientAccessId: string;
  email: string;
  cabinetId: string;
  type: 'client';
}

export interface AuthenticatedClientRequest extends Request {
  clientAccess?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    cabinetId: string;
    folderId: string | null;
    allowedFolders: string[];
    permissions: {
      canSign: boolean;
      canDownload: boolean;
      canComment: boolean;
    };
  };
}

export const clientAuthMiddleware = async (
  req: AuthenticatedClientRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token d\'authentification requis' });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_CLIENT_SECRET || process.env.JWT_SECRET;

    if (!secret) {
      logger.error('JWT secret not configured');
      res.status(500).json({ error: 'Configuration serveur incorrecte' });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, secret) as ClientTokenPayload;

    if (decoded.type !== 'client') {
      res.status(401).json({ error: 'Token invalide' });
      return;
    }

    // Fetch client access from database
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { id: decoded.clientAccessId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cabinetId: true,
        folderId: true,
        allowedFolders: true,
        permissions: true,
        isActivated: true,
      },
    });

    if (!clientAccess) {
      res.status(401).json({ error: 'Accès non trouvé' });
      return;
    }

    if (!clientAccess.isActivated) {
      res.status(403).json({ error: 'Compte non activé' });
      return;
    }

    // Attach client info to request
    req.clientAccess = {
      id: clientAccess.id,
      email: clientAccess.email,
      firstName: clientAccess.firstName,
      lastName: clientAccess.lastName,
      cabinetId: clientAccess.cabinetId,
      folderId: clientAccess.folderId,
      allowedFolders: clientAccess.allowedFolders,
      permissions: clientAccess.permissions as {
        canSign: boolean;
        canDownload: boolean;
        canComment: boolean;
      },
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token invalide' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expiré' });
      return;
    }

    logger.error('Client auth middleware error:', error);
    res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

// Helper to check if client can access a folder
export const canAccessFolder = (
  clientAccess: AuthenticatedClientRequest['clientAccess'],
  folderId: string
): boolean => {
  if (!clientAccess) return false;

  // Check if it's the main assigned folder
  if (clientAccess.folderId === folderId) return true;

  // Check if it's in allowed folders
  return clientAccess.allowedFolders.includes(folderId);
};

// Helper to check if client can access a document
export const canAccessDocument = async (
  clientAccess: AuthenticatedClientRequest['clientAccess'],
  documentId: string
): Promise<boolean> => {
  if (!clientAccess) return false;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { folderId: true, cabinetId: true },
  });

  if (!document) return false;

  // Must be same cabinet
  if (document.cabinetId !== clientAccess.cabinetId) return false;

  // Must have access to the folder
  if (!document.folderId) return false;

  return canAccessFolder(clientAccess, document.folderId);
};

export default clientAuthMiddleware;
