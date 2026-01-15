
import { SignupNav } from "@/component/Navbars/SignupNav"
import { SignupHeroSection } from "@/component/heroSections/SignupHeroSection"
export default function SignupPage(){
    
    return <div className="h-screen ">
        <SignupNav signupcheck={true}></SignupNav>
        <div className="flex justify-center items-center h-9/10">
            <div className=" h-7/9 w-6/10 flex justify-between"
            >
                <SignupHeroSection/>
            </div>
        </div>
    </div>
}