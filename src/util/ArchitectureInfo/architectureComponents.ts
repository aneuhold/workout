import type { Component } from 'svelte';
import CssIcon from '$lib/svgs/CSSIcon.svelte';
import DenoIcon from '$lib/svgs/DenoIcon.svelte';
import DigitalOceanIcon from '$lib/svgs/DigitalOceanIcon.svelte';
import GitHubIcon from '$lib/svgs/GitHubIcon.svelte';
import GoogleDomainsIcon from '$lib/svgs/GoogleDomainsIcon.svelte';
import HtmlIcon from '$lib/svgs/HTMLIcon.svelte';
import JavaScriptIcon from '$lib/svgs/JavaScriptIcon.svelte';
import JestIcon from '$lib/svgs/JestIcon.svelte';
import MongoDbIcon from '$lib/svgs/MongoDBIcon.svelte';
import NetlifyIcon from '$lib/svgs/NetlifyIcon.svelte';
import NodeJsIcon from '$lib/svgs/NodeJSIcon.svelte';
import NpmIcon from '$lib/svgs/NPMIcon.svelte';
import SentryIcon from '$lib/svgs/SentryIcon.svelte';
import SvelteIcon from '$lib/svgs/SvelteIcon.svelte';
import TypeScriptIcon from '$lib/svgs/TypeScriptIcon.svelte';
import VitestIcon from '$lib/svgs/VitestIcon.svelte';
import {
  type ArchitectureCategoryInfo,
  backendCategories,
  devOpsCategories,
  frontendCategories
} from './architectureCategories';

/**
 * A paritcular component that can be chosen within an architecture category.
 *
 * For example, "Svelte", "Node.js", or "TypeScript".
 */
export type ArchitectureComponent = {
  title: string;
  type: ArchitectureComponentType;
  categories: ArchitectureCategoryInfo[];
  generalDescription?: string;
  docsUrl?: string;
  latestExampleProjectUrl?: string;
  /**
   * An optional URL which navigates to the configuration for the architecture
   * component.
   */
  configurationUrl?: string;
  icon?: Component;
  /**
   * Optional dependencies listing. These should be the title of the dependency
   * from the components here.
   */
  dependencies?: ArchitectureComponent[];
};

export const ArchitectureComponentType = {
  tool: 'tool',
  framework: 'framework',
  language: 'language'
} as const;
export type ArchitectureComponentType =
  (typeof ArchitectureComponentType)[keyof typeof ArchitectureComponentType];

/* --- Core Components --- */

const coreTypeScriptLibrary: ArchitectureComponent = {
  title: 'Core TypeScript Library (core-ts-lib)',
  generalDescription:
    'A personal TypeScript library that can be pulled in to any project. This is the main library used in all projects. It should only contain tools that are used in every project, backend or frontend.',
  icon: GitHubIcon,
  type: ArchitectureComponentType.tool,
  docsUrl: 'https://github.com/aneuhold/core-ts-lib',
  categories: [backendCategories.library, frontendCategories.library]
};
const coreDatabaseLibrary: ArchitectureComponent = {
  title: 'Core Database Library (core-ts-db-lib)',
  generalDescription:
    'A personal database library that provides types for the database everywhere it is needed.',
  icon: GitHubIcon,
  docsUrl: 'https://github.com/aneuhold/core-ts-db-lib',
  type: ArchitectureComponentType.tool,
  categories: [backendCategories.library, frontendCategories.library]
};
const coreApiLibrary: ArchitectureComponent = {
  title: 'Core API Library (core-ts-api-lib)',
  generalDescription:
    'A core TypeScript API library that will provide the input and output types for any personal API, and methods to call the API which can be used on the backend or frontend. At first, this will just provide inputs and outputs to Digital Ocean Functions. In the future, it might be helpful to build a separate library, that uses this one, for common functionality on the backend specifically. Ideally this library should re-export types from the core database library.',
  icon: GitHubIcon,
  docsUrl: 'https://github.com/aneuhold/core-ts-api-lib',
  type: ArchitectureComponentType.tool,
  categories: [frontendCategories.library, backendCategories.library],
  dependencies: [coreDatabaseLibrary, coreTypeScriptLibrary]
};
const backendTypeScriptLibrary: ArchitectureComponent = {
  title: 'Backend TypeScript Library (be-ts-lib)',
  generalDescription:
    'A personal backend TypeScript library that can be pulled in to any backend project. This contains common functionality for any backend project, such as configuration.',
  icon: GitHubIcon,
  type: ArchitectureComponentType.tool,
  docsUrl: 'https://github.com/aneuhold/be-ts-lib',
  categories: [backendCategories.library, frontendCategories.library],
  dependencies: [coreTypeScriptLibrary]
};
const backendDatabaseLibrary: ArchitectureComponent = {
  title: 'Backend Database Library (be-ts-db-lib)',
  generalDescription:
    'A personal backend database library that can be used to interact with ideally, any other database. So it is abstracted. At first it will interact with MongoDB. This should only be pulled in to backend code.',
  icon: GitHubIcon,
  type: ArchitectureComponentType.tool,
  docsUrl: 'https://github.com/aneuhold/be-ts-db-lib',
  categories: [backendCategories.library],
  dependencies: [coreDatabaseLibrary, backendTypeScriptLibrary, coreTypeScriptLibrary]
};
const svelte: ArchitectureComponent = {
  title: 'Svelte',
  type: ArchitectureComponentType.framework,
  categories: [frontendCategories.framework],
  generalDescription: 'A frontend framework that compiles to vanilla JavaScript.',
  docsUrl: 'https://svelte.dev/docs',
  icon: SvelteIcon
};
const mongoDb: ArchitectureComponent = {
  title: 'MongoDB',
  generalDescription:
    'Currently using MongoDB Atlas to manage. Login with Google account. This is setup to allow access from anywhere at the moment (to allow DO Functions to use it). This is potentially a security issue, but in theory, someone would need to guess not only the URL, but the username and password as well.',
  type: ArchitectureComponentType.tool,
  categories: [backendCategories.database],
  docsUrl: 'https://docs.mongodb.com/',
  configurationUrl: 'https://cloud.mongodb.com/v2/655933be7ffb754535fbb6af#/overview',
  icon: MongoDbIcon
};

/* --- End Core Components --- */

export const frontendComponents = {
  svelteKit: {
    title: 'SvelteKit',
    type: ArchitectureComponentType.framework,
    generalDescription:
      'Things related to the backend in SvelteKit such as server-side rendering is not being used. This is because a separate backend would be required to be bundled with the frontend, which would make the project more complicated. Instead, the backend is contacted via HTTP requests to Digital Ocean functions.',
    categories: [frontendCategories.framework, frontendCategories.build],
    docsUrl: 'https://kit.svelte.dev/docs',
    icon: SvelteIcon,
    dependencies: [svelte]
  },
  svelte,
  react: {
    title: 'React',
    type: ArchitectureComponentType.framework,
    categories: [frontendCategories.framework],
    docsUrl: 'https://reactjs.org/docs/getting-started.html'
  },
  vue: {
    title: 'Vue',
    type: ArchitectureComponentType.framework,
    categories: [frontendCategories.framework],
    docsUrl: 'https://vuejs.org/v2/guide/'
  },
  angular: {
    title: 'Angular',
    type: ArchitectureComponentType.framework,
    categories: [frontendCategories.framework],
    docsUrl: 'https://angular.io/docs'
  },
  html: {
    title: 'HTML',
    type: ArchitectureComponentType.language,
    categories: [frontendCategories.language],
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
    icon: HtmlIcon
  },
  css: {
    title: 'CSS',
    type: ArchitectureComponentType.language,
    categories: [frontendCategories.language],
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
    icon: CssIcon
  },
  sass: {
    title: 'Sass',
    type: ArchitectureComponentType.language,
    categories: [frontendCategories.language],
    docsUrl: 'https://sass-lang.com/documentation'
  },
  personalAuthLibrary: {
    title: '🚧❗️ Frontend Auth Library (fe-ts-auth-lib)',
    generalDescription:
      'A frontend authentication library that has yet to be built. The main objective of this library is to use the backend APIs to authenticate users on the frontend. If the situation arises that types are needed on the backend as well for some reason, then a core auth lib can be created.',
    type: ArchitectureComponentType.tool,
    categories: [frontendCategories.library],
    icon: GitHubIcon,
    dependencies: [coreApiLibrary, coreTypeScriptLibrary]
  },
  coreApiLibrary,
  coreTypeScriptLibrary,
  typescript: {
    title: 'TypeScript',
    type: ArchitectureComponentType.language,
    categories: [frontendCategories.language, backendCategories.language],
    docsUrl: 'https://www.typescriptlang.org/docs/',
    icon: TypeScriptIcon
  },
  javascript: {
    title: 'JavaScript',
    type: ArchitectureComponentType.language,
    categories: [frontendCategories.language, backendCategories.language],
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    icon: JavaScriptIcon
  }
} satisfies Record<string, ArchitectureComponent>;

export const frontendTestingComponents = {
  cypress: {
    title: 'Cypress',
    type: ArchitectureComponentType.tool,
    categories: [frontendCategories.e2eTesting],
    docsUrl: 'https://docs.cypress.io/guides/overview/why-cypress'
  },
  jest: {
    title: 'Jest',
    type: ArchitectureComponentType.tool,
    categories: [
      frontendCategories.unitTesting,
      frontendCategories.integrationTesting,
      backendCategories.unitTesting,
      backendCategories.integrationTesting
    ],
    docsUrl: 'https://jestjs.io/docs/getting-started',
    icon: JestIcon
  },
  vitest: {
    title: 'Vitest',
    generalDescription:
      'A testing framework for Vite. This is not compatible with the backend as far as is known at the moment.',
    type: ArchitectureComponentType.tool,
    categories: [frontendCategories.unitTesting, frontendCategories.integrationTesting],
    docsUrl: 'https://vitest.dev/guide/',
    icon: VitestIcon
  },
  coreTypeScriptLibrary,
  typescript: frontendComponents.typescript
} satisfies Record<string, ArchitectureComponent>;

/**
 * The different components of any architecture you have used in the past or
 * have experience with.
 */
export const backendComponents = {
  nodeJs: {
    title: 'Node.js',
    type: ArchitectureComponentType.framework,
    categories: [backendCategories.runtime],
    docsUrl: 'https://nodejs.org/en/docs/',
    icon: NodeJsIcon
  },
  typescript: frontendComponents.typescript,
  javascript: frontendComponents.javascript,
  deno: {
    title: 'Deno',
    type: ArchitectureComponentType.framework,
    categories: [backendCategories.runtime],
    docsUrl: 'https://deno.land/manual',
    icon: DenoIcon
  },
  rust: {
    title: 'Rust',
    type: ArchitectureComponentType.language,
    categories: [backendCategories.language],
    docsUrl: 'https://doc.rust-lang.org/book/'
  },
  digitalOceanFunctions: {
    title: 'DigitalOcean Functions',
    type: ArchitectureComponentType.tool,
    categories: [backendCategories.cloudFunctions],
    docsUrl: 'https://docs.digitalocean.com/products/functions/',
    configurationUrl:
      'https://cloud.digitalocean.com/functions/fn-66dd3ef6-c21d-46dc-b7ae-caf2ac8041ec?i=228288',
    icon: DigitalOceanIcon
  },
  digitalOceanFunctionsRepo: {
    title: 'digital-ocean-functions Repo',
    generalDescription:
      'Contains all the DigitalOcean functions code used personally for every project. This is where the backend API endpoints are built.',
    type: ArchitectureComponentType.tool,
    categories: [backendCategories.repository],
    docsUrl: 'https://github.com/aneuhold/digital-ocean-functions',
    icon: GitHubIcon,
    dependencies: [coreApiLibrary, backendDatabaseLibrary]
  },
  coreApiLibrary,
  backendDatabaseLibrary,
  coreDatabaseLibrary,
  backendTypeScriptLibrary,
  coreTypeScriptLibrary,
  mongoose: {
    title: 'Mongoose',
    generalDescription:
      'Notes on this are in the wiki. Need to play with this again to see if it is still useful, or build a personal library that interacts with it.',
    type: ArchitectureComponentType.tool,
    categories: [backendCategories.orm, backendCategories.library],
    docsUrl: 'https://mongoosejs.com/docs/guide.html',
    icon: MongoDbIcon,
    dependencies: [mongoDb]
  },
  mongoDb
} satisfies Record<string, ArchitectureComponent>;

export const backendTestingComponents = {
  jest: frontendTestingComponents.jest,
  backendTypeScriptLibrary,
  coreTypeScriptLibrary,
  typescript: frontendComponents.typescript
} satisfies Record<string, ArchitectureComponent>;

export const devOpsComponents = {
  netlify: {
    title: 'Netlify',
    generalDescription:
      'Use the same style of deployment as the portfolio using GitHub Actions. See the project reference for an example. Also, make sure to create new sites by deploying manually and just dropping the build folder into Netlify to get it started. Then update configuration at that point.',
    type: ArchitectureComponentType.tool,
    categories: [devOpsCategories.staticSiteDeploymentTool],
    docsUrl: 'https://docs.netlify.com/',
    latestExampleProjectUrl:
      'https://github.com/aneuhold/portfolio/blob/main/.github/workflows/main-branch.yml',
    configurationUrl: 'https://app.netlify.com/teams/aneuhold/sites',
    icon: NetlifyIcon
  },
  githubActions: {
    title: 'GitHub Actions',
    type: ArchitectureComponentType.tool,
    categories: [devOpsCategories.continuousIntegration],
    docsUrl: 'https://docs.github.com/en/actions',
    latestExampleProjectUrl: 'https://github.com/aneuhold/portfolio/tree/main/.github/workflows',
    icon: GitHubIcon
  },
  sentry: {
    title: 'Sentry',
    type: ArchitectureComponentType.tool,
    categories: [devOpsCategories.monitoring],
    docsUrl: 'https://docs.sentry.io/platforms/javascript/',
    icon: SentryIcon
  },
  googleDomains: {
    title: 'Google Domains',
    generalDescription:
      "Google's domain registration service. This is expiring soon though, so it might be good to switch at some point.",
    type: ArchitectureComponentType.tool,
    categories: [devOpsCategories.domainProvider],
    docsUrl: 'https://support.google.com/domains',
    icon: GoogleDomainsIcon
  },
  npm: {
    title: 'npm',
    type: ArchitectureComponentType.tool,
    categories: [devOpsCategories.packageManager],
    docsUrl: 'https://docs.npmjs.com/',
    icon: NpmIcon
  }
} satisfies Record<string, ArchitectureComponent>;
