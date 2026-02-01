export { generatedDocumentsController, GeneratedDocumentsController } from './generated-documents.controller';
export { generatedDocumentsService, GeneratedDocumentsService } from './generated-documents.service';
export {
  createGeneratedDocumentSchema,
  updateGeneratedDocumentSchema,
  generatedDocumentQuerySchema,
  documentIdParamSchema,
  finalizeDocumentSchema,
} from './generated-documents.schemas';
export type {
  CreateGeneratedDocumentInput,
  UpdateGeneratedDocumentInput,
  GeneratedDocumentQuery,
  DocumentIdParam,
  FinalizeDocumentInput,
} from './generated-documents.schemas';
export { default as generatedDocumentsRoutes } from './generated-documents.routes';
