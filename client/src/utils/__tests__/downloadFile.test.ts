import { FileSources } from 'librechat-data-provider';
import {
  getDownloadFilename,
  isHttpDownloadTarget,
  registerDownloadFilename,
  triggerDownload,
  unregisterDownloadFilename,
} from '../downloadFile';

describe('downloadFile utilities', () => {
  let clickSpy: jest.SpyInstance;
  let appendSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;
  let revokeSpy: jest.Mock;
  let appendedLink: HTMLAnchorElement | null;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    appendedLink = null;
    originalRevokeObjectURL = URL.revokeObjectURL;
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation();
    appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      appendedLink = node as HTMLAnchorElement;
      return node;
    });
    removeSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node: Node) => node);
    revokeSpy = jest.fn();
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeSpy,
    });
  });

  afterEach(() => {
    clickSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    });
    jest.useRealTimers();
  });

  it('detects absolute http download targets', () => {
    expect(isHttpDownloadTarget('https://cdn.example.com/file.pdf')).toBe(true);
    expect(isHttpDownloadTarget('http://cdn.example.com/file.pdf')).toBe(true);
    expect(isHttpDownloadTarget('blob:https://app.example.com/id')).toBe(false);
    expect(isHttpDownloadTarget('/api/files/code/download/session/file')).toBe(false);
    expect(isHttpDownloadTarget(undefined)).toBe(false);
  });

  it('navigates http URLs in the same tab without revoking them', () => {
    triggerDownload('https://cdn.example.com/file.pdf?Policy=abc', 'file.pdf');

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(appendedLink?.href).toBe('https://cdn.example.com/file.pdf?Policy=abc');
    expect(appendedLink?.download).toBe('file.pdf');
    expect(appendedLink?.target).toBe('');
    expect(appendedLink?.rel).toBe('');
    jest.runOnlyPendingTimers();
    expect(revokeSpy).not.toHaveBeenCalled();
  });

  it('revokes blob URLs after the click', () => {
    triggerDownload('blob:https://app.example.com/download-id', 'file.pdf');

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(appendedLink?.target).toBe('');
    expect(appendedLink?.rel).toBe('');
    expect(revokeSpy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(revokeSpy).toHaveBeenCalledWith('blob:https://app.example.com/download-id');
  });

  it('uses registered response metadata to name blob downloads', () => {
    const target = 'blob:https://app.example.com/text-download';
    registerDownloadFilename(target, 'report.pdf.txt');

    triggerDownload(target, 'report.pdf');

    expect(appendedLink?.download).toBe('report.pdf.txt');
  });

  it('keeps registered names available for concurrent blob downloads', () => {
    const target = 'blob:https://app.example.com/concurrent-download';
    registerDownloadFilename(target, 'report.pdf.txt');

    triggerDownload(target, 'report.pdf');
    expect(appendedLink?.download).toBe('report.pdf.txt');

    triggerDownload(target, 'report.pdf');
    expect(appendedLink?.download).toBe('report.pdf.txt');
  });

  it('clears registered names when blob URLs are released', () => {
    const target = 'blob:https://app.example.com/released-download';
    registerDownloadFilename(target, 'report.pdf.txt');
    unregisterDownloadFilename(target);

    triggerDownload(target, 'report.pdf');

    expect(appendedLink?.download).toBe('report.pdf');
  });
});

describe('getDownloadFilename', () => {
  it('adds a text extension for text-source files', () => {
    expect(getDownloadFilename('report.pdf', 'file-1', FileSources.text)).toBe('report.pdf.txt');
  });

  it('recognizes existing text extensions case-insensitively', () => {
    expect(getDownloadFilename('NOTES.TXT', 'file-2', FileSources.text)).toBe('NOTES.TXT');
  });

  it('preserves filenames for other storage sources', () => {
    expect(getDownloadFilename('report.pdf', 'file-3', FileSources.local)).toBe('report.pdf');
  });
});
