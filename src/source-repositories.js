export const repositoryGroups = [
  {id: 'research', title: 'Research & data science', description: 'Research methods, evaluation code, and data-quality analysis.'},
  {id: 'applied', title: 'Applied systems', description: 'Application prototypes for voice support, communication practice, and writing-process records.'},
  {id: 'archive', title: 'Earlier prototypes', description: 'Earlier versions and experiments that informed later work.', collapsed: true},
  {id: 'commercial', title: 'Freelance & commercial projects', description: 'Business websites, storefronts, reporting tools, and application scaffolds. These projects demonstrate software delivery for practical business needs.'},
];

export const sourceRepositories = [
  {name: 'DecisionLens', repo: 'DecisionLens', scope: 'Counterfactual search, feature costs, and explicit graph assumptions. Research prototype with open evaluation issues.', group: 'research'},
  {name: 'Kasa', repo: 'Kasa', scope: 'Telephony, context retrieval, policy checks, and tool execution. 25 service tests passed using fixtures and mocks.', group: 'applied'},
  {name: 'The Representational Imprint', repo: 'Representational-Imprint', scope: 'Association metrics, baseline checks, and a development-pilot notebook. Eight unit tests passed; research is ongoing.', group: 'research'},
  {name: 'Articulate', repo: 'Griot-Labs-Articulate-AI', scope: 'Communication-practice interface and FastAPI backend. Learning outcomes have not been evaluated.', group: 'applied'},
  {name: 'Strata', repo: 'Strata-biometric-verification', scope: 'Browser extension for recording and replaying writing events. It does not determine authorship or detect generated text.', group: 'applied'},
  {name: 'Bank of Ghana data audit', repo: 'Bank-of-Ghana-Data-Audit', scope: 'CSV profiling and data-quality checks. Source datasets are not redistributed.', group: 'research'},
  {name: 'Articulate: earlier prototype', repo: 'Articulate_ai', scope: 'Earlier React and TypeScript version from AI Studio.', group: 'archive'},
  {name: 'Customer-support prototype', repo: 'Customer-Support-Prototype', scope: 'FastAPI, keyword retrieval, session storage, and optional text and speech services.', group: 'archive'},
  {name: 'Soil report prototype', repo: 'Soil-Report-Prototype', scope: 'Workbook rules, measurement classification, and document generation. No agronomic validation is claimed.', group: 'commercial'},
  {name: 'Vesto', repo: 'Vesto', scope: 'Apparel storefront and local demonstration-order handling.', group: 'commercial'},
  {name: 'Kwans Concepts', repo: 'Kwans-Concepts', scope: 'Website source with deployment setup documented separately.', group: 'commercial'},
  {name: 'Tee Shop', repo: 'Tee-Shop', scope: 'Storefront source; payment and hosting services require configuration.', group: 'commercial'},
  {name: 'Creative Hands Media', repo: 'Creative-Hands-Media', scope: 'Static website and booking interface; private media and customer records are excluded.', group: 'commercial'},
  {name: 'GuardianBridge', repo: 'GuardianBridge', scope: 'Laravel and React scaffold. Product-specific functionality remains to be implemented.', group: 'commercial'},
];
export const repositoryUrl = repo => `https://github.com/1SonOfGlory/${repo}`;
