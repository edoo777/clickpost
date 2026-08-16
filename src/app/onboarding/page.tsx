import { OnboardingView } from "@/components/onboarding/OnboardingView";
import { getProductText } from "@/lib/admin/product-texts";

export default async function OnboardingPage() {
  const [welcomeTitle, welcomeSubtitle] = await Promise.all([
    getProductText("onboarding_welcome_title"),
    getProductText("onboarding_welcome_subtitle"),
  ]);

  return <OnboardingView welcomeTitle={welcomeTitle} welcomeSubtitle={welcomeSubtitle} />;
}
