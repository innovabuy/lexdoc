import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  FolderOpen,
  User,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Copy,
  PenTool,
  Mail,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import type { GeneratedDocument, GeneratedDocumentStatus } from '@/lib/types/documentBuilder';
import { DOCUMENT_TYPE_LABELS, GENERATED_STATUS_LABELS } from '@/lib/types/documentBuilder';

interface GeneratedDocumentCardProps {
  document: GeneratedDocument;
  onView?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSendSignature?: () => void;
  onSendLrar?: () => void;
}

const STATUS_COLORS: Record<GeneratedDocumentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  FINALIZED: 'bg-green-100 text-green-700',
  SENT: 'bg-blue-100 text-blue-700',
  SIGNED: 'bg-purple-100 text-purple-700',
};

const STATUS_VARIANTS: Record<GeneratedDocumentStatus, 'gray' | 'success' | 'warning' | 'error' | 'primary'> = {
  DRAFT: 'gray',
  FINALIZED: 'success',
  SENT: 'primary',
  SIGNED: 'success',
};

export const GeneratedDocumentCard: React.FC<GeneratedDocumentCardProps> = ({
  document: doc,
  onView,
  onDownload,
  onDuplicate,
  onDelete,
  onSendSignature,
  onSendLrar,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      window.document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMenuAction = (action: () => void) => {
    setShowMenu(false);
    action();
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-lg flex-shrink-0 ${STATUS_COLORS[doc.status]}`}>
          <FileText className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                to={`/document-generation/documents/${doc.id}`}
                className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
              >
                {doc.title}
              </Link>
              {doc.template && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {DOCUMENT_TYPE_LABELS[doc.template.documentType] || doc.template.name}
                </p>
              )}
            </div>
            <Badge variant={STATUS_VARIANTS[doc.status]} className="flex-shrink-0">
              {GENERATED_STATUS_LABELS[doc.status]}
            </Badge>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(doc.createdAt)}</span>
            </div>
            {doc.folder && (
              <div className="flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                <span>{doc.folder.name}</span>
              </div>
            )}
            {doc.createdBy && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{doc.createdBy.firstName} {doc.createdBy.lastName}</span>
              </div>
            )}
          </div>

          {/* Workflow Status */}
          {doc.workflowStatus && Object.keys(doc.workflowStatus).length > 0 && (
            <div className="flex gap-2 mt-3">
              {doc.workflowStatus.signature && (
                <Badge variant="gray" className="text-xs flex items-center gap-1">
                  <PenTool className="h-3 w-3" />
                  Signature: {doc.workflowStatus.signature.status}
                </Badge>
              )}
              {doc.workflowStatus.lrar && (
                <Badge variant="gray" className="text-xs flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  LRAR: {doc.workflowStatus.lrar.status}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          {onDownload && doc.status !== 'DRAFT' && (
            <Button variant="ghost" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          <div className="relative" ref={menuRef}>
            <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical className="h-4 w-4" />
            </Button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => handleMenuAction(onView || (() => {}))}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Eye className="h-4 w-4" />
                  Voir le document
                </button>
                {onDownload && doc.status !== 'DRAFT' && (
                  <button
                    onClick={() => handleMenuAction(onDownload)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Download className="h-4 w-4" />
                    Telecharger
                  </button>
                )}
                {onDuplicate && (
                  <button
                    onClick={() => handleMenuAction(onDuplicate)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4" />
                    Dupliquer
                  </button>
                )}
                <Link
                  to={`/document-generation/documents/${doc.id}`}
                  target="_blank"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowMenu(false)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir dans un nouvel onglet
                </Link>

                {(onSendSignature || onSendLrar) && doc.status === 'FINALIZED' && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    {onSendSignature && (
                      <button
                        onClick={() => handleMenuAction(onSendSignature)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <PenTool className="h-4 w-4" />
                        Envoyer pour signature
                      </button>
                    )}
                    {onSendLrar && (
                      <button
                        onClick={() => handleMenuAction(onSendLrar)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Mail className="h-4 w-4" />
                        Preparer LRAR
                      </button>
                    )}
                  </>
                )}

                {onDelete && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={() => handleMenuAction(onDelete)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GeneratedDocumentCard;
