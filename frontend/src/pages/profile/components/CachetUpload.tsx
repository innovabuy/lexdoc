import React from 'react';
import SignatureUpload from './SignatureUpload';

interface CachetUploadProps {
  currentImageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => void;
  isUploading?: boolean;
}

export const CachetUpload: React.FC<CachetUploadProps> = ({
  currentImageUrl,
  onUpload,
  onDelete,
  isUploading = false,
}) => {
  return (
    <SignatureUpload
      label="Cachet / Logo du cabinet"
      description="Utilisez ce cachet pour officialiser vos documents. Il sera insere automatiquement selon vos preferences."
      currentImageUrl={currentImageUrl}
      onUpload={onUpload}
      onDelete={onDelete}
      isUploading={isUploading}
      acceptedFormats={['image/png', 'image/jpeg', 'image/jpg']}
      maxSizeMB={2}
    />
  );
};

export default CachetUpload;
