import { SignupNav } from "@/component/Navbars/SignupNav"
import { SignupHeroSection } from "@/component/heroSections/SignupHeroSection"

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <SignupNav signupcheck={true} />
            <div className="flex-grow flex items-center justify-center w-full px-4 sm:px-6 lg:px-8">
                <SignupHeroSection />
            </div>
        </div>
    );
}