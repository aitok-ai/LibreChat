import type { TFile } from 'librechat-data-provider';
import type { ExtendedFile } from '~/common';
import { getFileType, cn } from '~/utils';
import FilePreview from './FilePreview';
import RemoveFile from './RemoveFile';

const FileContainer = ({
  file,
  overrideType,
  buttonClassName,
  containerClassName,
  onDelete,
  onClick,
}: {
  file: Partial<ExtendedFile | TFile>;
  overrideType?: string;
  buttonClassName?: string;
  containerClassName?: string;
  onDelete?: () => void;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) => {
  const fileType = getFileType(overrideType ?? file.type);
  const displayName =
    file.originalname ?? file.filename ?? (file as ExtendedFile).file?.name ?? 'File';

  return (
    <div
      className={cn('group text-text-primary relative inline-block text-sm', containerClassName)}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={displayName}
        className={cn(
          'border-border-light bg-surface-hover-alt relative overflow-hidden rounded-2xl border',
          buttonClassName,
        )}
      >
        <div className="w-56 p-1.5">
          <div className="flex flex-row items-center gap-2">
            <FilePreview file={file} fileType={fileType} className="relative" />
            <div className="overflow-hidden">
              <div className="truncate font-medium" title={displayName}>
                {displayName}
              </div>
              <div className="text-text-secondary truncate" title={fileType.title}>
                {fileType.title}
              </div>
            </div>
          </div>
        </div>
      </button>
      {onDelete && <RemoveFile onRemove={onDelete} />}
    </div>
  );
};

export default FileContainer;
