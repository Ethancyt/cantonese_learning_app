// Never display a provider response body: it may echo credentials or submitted text.
export function speechRejection(
  status: number,
  provider: "Azure Speech" | "Voice provider" | "Knowlez",
  operation: "Lesson audio" | "Speech transcription",
) {
  const prefix = `${operation} provider rejected the request: ${provider} HTTP ${status}.`;
  switch (status) {
    case 401:
      return `${prefix} Authentication failed. ${provider === "Azure Speech" ? "Copy a key from your Azure Speech resource’s Keys and Endpoint page and use that resource’s exact region." : provider === "Knowlez" ? "Use the Knowlez key for this service’s subscription. Microsoft Azure resource keys do not authenticate with Knowlez." : "Check the API key and make sure it belongs to the selected provider."}`;
    case 403:
      return `${prefix} Access was denied. Check resource permissions, subscription status, and network restrictions.`;
    case 400:
    case 422:
      return `${prefix} The request format or selected ${operation === "Lesson audio" ? "voice/model" : "audio format"} was not accepted. ${operation === "Lesson audio" && provider === "Azure Speech" ? "Update the app and select a listed Hong Kong Cantonese voice." : "Check the provider’s supported request format."}`;
    case 404:
      return `${prefix} The endpoint was not found. Check ${provider === "Azure Speech" ? "the Speech resource’s region" : "the endpoint URL and model"}.`;
    case 402:
      return `${prefix} Check the provider’s billing balance or subscription.`;
    case 429:
      return `${prefix} A rate limit, quota, or service capacity limit was reached. Retry later and check your provider’s usage limits.`;
    default:
      return status >= 500
        ? `${prefix} The provider had a service error. Retry later.`
        : `${prefix} Check the selected provider and its connection settings.`;
  }
}
