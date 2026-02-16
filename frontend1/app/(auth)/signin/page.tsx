
import { LoginCard } from "@/component/LoginCard";
import { SignupNav } from "@/component/Navbars/SignupNav";
export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SignupNav signupcheck={false} />

      <div className="flex-1 flex items-center justify-center -mt-16 p-6">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-center max-w-6xl w-full">

          <div className="flex-1 text-center lg:text-left space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 font-[Prata]">
              Automate across <br className="hidden lg:block" /> your teams
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Zapier Enterprise empowers everyone in your business to securely automate their work in minutes, not months—no coding required.
            </p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
              Explore Zapier Enterprise
            </button>
          </div>

          <div className="w-full max-w-md flex-shrink-0">
            <LoginCard />
          </div>

        </div>
      </div>
    </div>
  );
}
