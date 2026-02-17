import { LoginCard } from "@/component/LoginCard";
import { SignupNav } from "@/component/Navbars/SignupNav";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <SignupNav signupcheck={false} />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="flex flex-col md:flex-row gap-8 md:gap-20 items-center max-w-6xl w-full">
          <div className="text-center md:text-left max-w-sm hidden md:block">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
              Automate across your teams
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              ZapClone Enterprise empowers everyone in your business to securely automate their work in minutes, not months—no coding required.
            </p>
            <button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm">
              Explore ZapClone Enterprise
            </button>
          </div>

          <div className="w-full max-w-md mx-auto">
            <LoginCard />
          </div>
        </div>
      </div>
    </div>
  );
}
