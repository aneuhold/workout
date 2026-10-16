import '../src/globalStyles/global.css';
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview, SvelteRenderer } from '@storybook/sveltekit';
import mockBackendService from '$services/MockBackendService/MockBackend.service';
import { allSingletonsDecoratorFunction } from './decorators';

// This is called at the top level to ensure that global mocks are set up
// before any other modules are loaded. This is important because some
// modules have side effects that call the API when they are imported.
mockBackendService.setupGlobalMocks();

const preview: Preview = {
  tags: ['autodocs'],
  beforeEach: () => {
    mockBackendService.setupGlobalMocks();
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    viewport: {
      options: {
        mobile: {
          name: 'Mobile (450x800)',
          styles: { width: '450px', height: '800px' },
          type: 'mobile'
        }
      }
    },
    options: {
      storySort: {
        order: [
          'Full App',
          'Pages',
          'Components',
          'Singletons',
          'UI Components',
          'Design System',
          '*'
        ]
      }
    }
  },
  decorators: [
    allSingletonsDecoratorFunction,
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
