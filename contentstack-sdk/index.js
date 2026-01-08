import Contentstack from "contentstack";

// Check if Live Preview is enabled via environment variable
const isLivePreviewEnabled = process.env.NEXT_PUBLIC_CONTENTSTACK_LIVE_PREVIEW_ENABLE === 'true';

// Get the appropriate host based on region
function getLivePreviewHost() {
  const region = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION || 'NA';
  const hosts = {
    'NA': 'rest-preview.contentstack.com',
    'EU': 'eu-rest-preview.contentstack.com',
    'AZURE_NA': 'azure-na-rest-preview.contentstack.com',
    'AZURE_EU': 'azure-eu-rest-preview.contentstack.com',
    'GCP_NA': 'gcp-na-rest-preview.contentstack.com',
    'GCP_EU': 'gcp-eu-rest-preview.contentstack.com'
  };
  return hosts[region] || hosts['NA'];
}

// Base SDK configuration
const baseConfig = {
  api_key: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY,
  delivery_token: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN,
  environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT,
};

// Add Live Preview configuration if enabled
if (isLivePreviewEnabled && process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN) {
  baseConfig.live_preview = {
    enable: true,
    preview_token: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN,
    host: getLivePreviewHost(),
  };
}

// Create the default Stack instance
const Stack = Contentstack.Stack(baseConfig);

// Export for creating new instances (needed for SSR Live Preview)
export function createStackInstance() {
  const config = {
    api_key: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY,
    delivery_token: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN,
    environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT,
  };

  if (isLivePreviewEnabled && process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN) {
    config.live_preview = {
      enable: true,
      preview_token: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN,
      host: getLivePreviewHost(),
    };
  }

  return Contentstack.Stack(config);
}

// Export configuration for client-side initialization
export const livePreviewConfig = {
  enable: isLivePreviewEnabled,
  previewToken: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN,
  host: getLivePreviewHost(),
  apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY,
  environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT,
  branch: process.env.NEXT_PUBLIC_CONTENTSTACK_BRANCH || 'main',
  
};

export default Stack;
