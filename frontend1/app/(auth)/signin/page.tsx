
import { LoginCard } from "@/component/LoginCard";
import { SignupNav } from "@/component/Navbars/SignupNav";
export default function SignInPage() {
  const signupcheck = 0;
  return (
    <div className="h-screen">
        <SignupNav signupcheck={false}/>
        <div className="h-9/10 flex items-center justify-center bg-[#fdfaf6] px-4">
      <div className="flex flex-col md:flex-row gap-12 items-center max-w-5xl w-full">
        <div className="text-center md:text-left max-w-md">
          <h1 className="text-3xl font-bold mb-4">Automate across your teams</h1>
          <p className="text-gray-700 mb-6">
            Zapier Enterprise empowers everyone in your business to securely automate
            their work in minutes, not months—no coding required.
          </p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-semibold">
            Explore Zapier Enterprise
          </button>
        </div>
        <LoginCard />
      </div>
    </div>
    </div>
    
  );
}
