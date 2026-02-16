
import { SignupNav } from "@/component/Navbars/SignupNav"
import { SignupHeroSection } from "@/component/heroSections/SignupHeroSection"
export default function SignupPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <SignupNav signupcheck={true} />
            <div className="flex-1 flex flex-col justify-center bg-transparent">
                <SignupHeroSection />
            </div>
        </div>
    )
}