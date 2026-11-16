import type { ComposerHost } from '@librechat/chat/react';
import { useShortcutAriaKey, useShortcutDisplay } from '~/hooks/useKeyboardShortcuts';
import useComposerBindings from '~/hooks/Input/useComposerBindings';
import VideoSubMenu from '~/components/Chat/Input/VideoSubMenu';
import CommandList from '~/components/Chat/Input/CommandList';

/** The app's capabilities for the composer controls in `@librechat/chat`. */
export const appComposerHost: ComposerHost = {
  useComposerBindings,
  useShortcutDisplay,
  useShortcutAriaKey,
  renderCommandList: (props) => <CommandList {...props} />,
  renderPaletteTools: () => <VideoSubMenu />,
};

export { ComposerHostProvider, useComposerHost } from '@librechat/chat/react';
