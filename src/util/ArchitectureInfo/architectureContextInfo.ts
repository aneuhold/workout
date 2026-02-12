import {
  type ArchitectureComponent,
  backendComponents,
  backendTestingComponents,
  devOpsComponents,
  frontendComponents,
  frontendTestingComponents
} from './architectureComponents';

export type ArchitectureContext = {
  title: string;
  description?: string;
  frontendComponents?: ArchitectureContextComponent[];
  frontendTestingComponents?: ArchitectureContextComponent[];
  backendComponents?: ArchitectureContextComponent[];
  backendTestingComponents?: ArchitectureContextComponent[];
  devOpsComponents?: ArchitectureContextComponent[];
};

export type ArchitectureContextComponent = {
  component: ArchitectureComponent;
  contextSpecificDescription?: string;
};

export type ArchitectureContextName = keyof typeof architectureContextInfo;

const architectureContextInfo = {
  frontendWithoutBackend: {
    title: '🎨 Frontend App with no Backend API',
    description:
      'A frontend app that does not need a backend API. It can be deployed to a static hosting service, such as Netlify.',
    frontendComponents: [
      { component: frontendComponents.svelteKit },
      { component: frontendComponents.svelte },
      { component: frontendComponents.html },
      { component: frontendComponents.css },
      { component: frontendComponents.typescript },
      { component: frontendComponents.javascript }
    ],
    frontendTestingComponents: [
      {
        contextSpecificDescription:
          'This is just being used with Svelte because it comes bundled. It might be good to switch to Jest at some point so it aligns with the backend.',
        component: frontendTestingComponents.vitest
      },
      { component: frontendTestingComponents.typescript }
    ],
    devOpsComponents: [
      { component: devOpsComponents.netlify },
      { component: devOpsComponents.sentry },
      { component: devOpsComponents.githubActions },
      { component: devOpsComponents.googleDomains }
    ]
  },
  frontendWithBackendAPI: {
    title: '🏢 Frontend App with Backend API',
    description:
      'A frontend app that needs a backend API for any reason. This is generalized at the moment, but it might be good to add specific things to this.',
    frontendComponents: [
      { component: frontendComponents.svelteKit },
      { component: frontendComponents.svelte },
      { component: frontendComponents.html },
      { component: frontendComponents.css },
      { component: frontendComponents.personalAuthLibrary },
      { component: frontendComponents.coreApiLibrary },
      { component: frontendComponents.coreTypeScriptLibrary },
      { component: frontendComponents.typescript },
      { component: frontendComponents.javascript }
    ],
    frontendTestingComponents: [
      {
        contextSpecificDescription:
          'This is just being used with Svelte because it comes bundled. It might be good to switch to Jest at some point so it aligns with the backend.',
        component: frontendTestingComponents.vitest
      },
      { component: frontendTestingComponents.coreTypeScriptLibrary },
      { component: frontendTestingComponents.typescript }
    ],
    backendComponents: [
      { component: backendComponents.digitalOceanFunctions },
      { component: backendComponents.digitalOceanFunctionsRepo },
      { component: backendComponents.coreApiLibrary },
      { component: backendComponents.backendDatabaseLibrary },
      { component: backendComponents.coreDatabaseLibrary },
      { component: backendComponents.backendTypeScriptLibrary },
      { component: backendComponents.coreTypeScriptLibrary },
      { component: backendComponents.typescript },
      { component: backendComponents.javascript },
      { component: backendComponents.nodeJs },
      { component: backendComponents.mongoDb }
    ],
    backendTestingComponents: [
      { component: backendTestingComponents.jest },
      { component: backendTestingComponents.coreTypeScriptLibrary },
      { component: backendTestingComponents.typescript }
    ],
    devOpsComponents: [
      { component: devOpsComponents.netlify },
      { component: devOpsComponents.sentry },
      { component: devOpsComponents.githubActions },
      { component: devOpsComponents.googleDomains }
    ]
  },
  frontendUILibrary: {
    title: '🖌️ Frontend UI Library',
    description:
      'A frontend library that can be used by other projects. This hasnt been built yet, so a tech stack hasnt been developed.'
  },
  typeScriptLibrary: {
    title: '🛠️ TypeScript Library',
    description: 'A TypeScript library that can be pulled in to a backend or frontend project.',
    backendComponents: [
      {
        component: backendComponents.typescript,
        contextSpecificDescription:
          'Use core-ts-lib as an example. Basically tsc just needs to be ran to build to a lib folder, which is then deployed with npm.'
      }
    ],
    devOpsComponents: [{ component: devOpsComponents.npm }]
  },
  cliTool: {
    title: '🧑‍💻 CLI Tool',
    description:
      'A CLI tool that can be used in ideally any environment. It might be interesting to look into if this can be done in Rust.'
  }
} satisfies Record<string, ArchitectureContext>;

export default architectureContextInfo;
