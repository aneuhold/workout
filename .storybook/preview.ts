import '../src/globalStyles/global.css';
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview, SvelteRenderer } from '@storybook/sveltekit';
import { spyOn } from 'storybook/test';
import TestSetup from '$testUtils/TestSetup';

// This is called at the top level to ensure that global mocks are set up
// before any other modules are loaded. This is important because some
// modules have side effects that call the API when they are imported.
TestSetup.setupGlobalMocks(spyOn);

const preview: Preview = {
  tags: ['autodocs'],
  beforeEach: () => {
    TestSetup.setupGlobalMocks(spyOn);
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },
  decorators: [
    withThemeByClassName<SvelteRenderer>({
      themes: {
        light: 'light',
        dark: 'dark'
      },
      defaultTheme: 'dark'
    })
  ]
};

export default preview;
