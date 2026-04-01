import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Spinner } from '@librechat/client';
import useSvgProcessing from './useSvgProcessing';
import useMermaidZoom from './useMermaidZoom';
import MermaidDialog from './MermaidDialog';
import MermaidHeader from './MermaidHeader';
import ZoomControls from './ZoomControls';
import { useLocalize } from '~/hooks';
import cn from '~/utils/cn';

interface MermaidProps {
  children: string;
  id?: string;
  theme?: string;
}

const Mermaid: React.FC<MermaidProps> = memo(({ children, id, theme }) => {
  const localize = useLocalize();
  const [showCode, setShowCode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamingCodeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const {
    blobUrl,
    svgDimensions,
    isLoading,
    error,
    lastValidSvgRef,
    initialScale,
    calculatedHeight,
  } = useSvgProcessing({ content: children, id, theme, retryCount, containerRef });

  const { zoom, pan, isPanning, handleZoomIn, handleZoomOut, handleResetZoom, handleMouseDown } =
    useMermaidZoom({ containerRef, wheelDep: blobUrl });

  useEffect(() => {
    if (isLoading && streamingCodeRef.current) {
      streamingCodeRef.current.scrollTop = streamingCodeRef.current.scrollHeight;
    }
  }, [children, isLoading]);

  const handleToggleCode = useCallback(() => setShowCode((prev) => !prev), []);
  const handleRetry = useCallback(() => setRetryCount((prev) => prev + 1), []);
  const handleExpand = useCallback(() => setIsDialogOpen(true), []);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isTouchDevice) {
        return;
      }
      const target = e.target as HTMLElement;
      if (!target.closest('button, a, [role="button"]')) {
        setShowMobileControls((prev) => !prev);
      }
    },
    [isTouchDevice],
  );

  const showControls = isTouchDevice
    ? showMobileControls || showCode
    : isHovered || isFocusWithin || showCode;

  const hoverHandlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onFocus: () => setIsFocusWithin(true),
    onBlur: (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsFocusWithin(false);
      }
    },
  };

  const diagramStyle = {
    width: svgDimensions ? `${svgDimensions.width * initialScale}px` : 'auto',
    height: svgDimensions ? `${svgDimensions.height * initialScale}px` : 'auto',
  };

  if (isLoading) {
    if (lastValidSvgRef.current && blobUrl) {
      return (
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-lg border transition-all duration-200',
            showControls ? 'border-border-light' : 'border-transparent',
          )}
          {...hoverHandlers}
          onClick={handleContainerClick}
        >
          <MermaidHeader
            className={cn(
              'absolute top-0 right-0 left-0 z-20',
              showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            codeContent={children}
            showCode={showCode}
            onToggleCode={handleToggleCode}
          />
          <div
            ref={containerRef}
            className={cn(
              'relative overflow-hidden rounded-md p-4 transition-colors duration-200',
              'bg-surface-primary-alt dark:bg-white/[0.03]',
              isPanning ? 'cursor-grabbing' : 'cursor-grab',
            )}
            style={{ height: `${calculatedHeight}px` }}
            onMouseDown={handleMouseDown}
          >
            <div className="border-border-light bg-surface-secondary text-text-secondary absolute top-2 left-2 z-10 flex items-center gap-1 rounded border px-2 py-1 text-xs">
              <Spinner className="h-3 w-3" />
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isPanning ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              <img
                src={blobUrl}
                alt="Mermaid diagram"
                className="opacity-70 select-none"
                style={diagramStyle}
                draggable={false}
              />
            </div>
            <ZoomControls
              zoom={zoom}
              pan={pan}
              codeContent={children}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleResetZoom}
              className={cn(
                'absolute right-2 bottom-2 z-10 transition-opacity duration-200',
                showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="border-border-light w-full overflow-hidden rounded-lg border">
        <div className="border-border-light bg-surface-secondary text-text-secondary flex items-center gap-2 border-b px-4 py-2 font-sans text-xs">
          <Spinner className="h-3 w-3" />
          <span className="font-medium">{localize('com_ui_mermaid')}</span>
        </div>
        <pre
          ref={streamingCodeRef}
          className="bg-surface-primary-alt text-text-secondary max-h-[350px] min-h-[150px] overflow-auto p-4 font-mono text-xs whitespace-pre-wrap"
        >
          {children}
        </pre>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-border-light w-full overflow-hidden rounded-lg border">
        <MermaidHeader codeContent={children} showCode={showCode} onToggleCode={handleToggleCode} />
        <div className="border-border-light bg-surface-tertiary border-t p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-red-600 dark:text-red-400">
              {localize('com_ui_mermaid_failed')}
            </span>
            <button
              type="button"
              onClick={handleRetry}
              className="text-text-secondary hover:bg-surface-hover flex items-center gap-1 rounded px-2 py-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              {localize('com_ui_retry')}
            </button>
          </div>
          <pre className="overflow-auto text-xs text-red-600 dark:text-red-300">
            {error.message}
          </pre>
          {showCode && (
            <div className="border-border-light mt-4 border-t pt-4">
              <div className="text-text-secondary mb-2 text-xs">
                {localize('com_ui_mermaid_source')}
              </div>
              <pre className="text-text-secondary overflow-auto text-xs whitespace-pre-wrap">
                {children}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!blobUrl) {
    return null;
  }

  return (
    <>
      <MermaidDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        triggerRef={expandButtonRef}
        blobUrl={blobUrl}
        codeContent={children}
      />
      <div
        className="border-border-light relative w-full overflow-hidden rounded-lg border transition-all duration-200"
        {...hoverHandlers}
        onClick={handleContainerClick}
      >
        <MermaidHeader
          className="border-border-light bg-surface-secondary border-b"
          actionsClassName="transition-opacity duration-200"
          codeContent={children}
          showCode={showCode}
          showExpandButton
          expandButtonRef={expandButtonRef}
          onExpand={handleExpand}
          onToggleCode={handleToggleCode}
        />
        {showCode && (
          <div className="border-border-light bg-surface-secondary border-b p-4">
            <pre className="text-text-secondary overflow-auto text-xs whitespace-pre-wrap">
              {children}
            </pre>
          </div>
        )}
        <div
          ref={containerRef}
          className={cn(
            'relative overflow-hidden p-4 transition-colors duration-200',
            'bg-surface-primary-alt dark:bg-white/[0.03]',
            isPanning ? 'cursor-grabbing' : 'cursor-grab',
          )}
          style={{ height: `${calculatedHeight}px` }}
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <img
              src={blobUrl}
              alt="Mermaid diagram"
              className="select-none"
              style={diagramStyle}
              draggable={false}
            />
          </div>
          <ZoomControls
            zoom={zoom}
            pan={pan}
            codeContent={children}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetZoom}
            className={cn(
              'absolute right-2 bottom-2 z-10 transition-opacity duration-200',
              showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          />
        </div>
      </div>
    </>
  );
});

Mermaid.displayName = 'Mermaid';

export default Mermaid;
