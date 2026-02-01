export { documentBlocksController, DocumentBlocksController } from './document-blocks.controller';
export { documentBlocksService, DocumentBlocksService } from './document-blocks.service';
export {
  createDocumentBlockSchema,
  updateDocumentBlockSchema,
  documentBlockQuerySchema,
  blockIdParamSchema,
} from './document-blocks.schemas';
export type {
  CreateDocumentBlockInput,
  UpdateDocumentBlockInput,
  DocumentBlockQuery,
  BlockIdParam,
} from './document-blocks.schemas';
export { default as documentBlocksRoutes } from './document-blocks.routes';
