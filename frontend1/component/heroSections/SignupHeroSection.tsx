"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthProviderButton from "../buttons/authProviderButton";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

export function SignupHeroSection() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-8 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Left Content */}
      <div className="flex-1 space-y-8 text-center lg:text-left">
        <div className="space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 font-[Prata]">
            AI Automation starts<br className="hidden lg:block" /> and scales with Zapier
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Orchestrate AI across your teams, tools, and processes. Turn ideas into automated action today, and power tomorrow's business growth.
          </p>
        </div>

        <div className="space-y-4 max-w-md mx-auto lg:mx-0">
          <div className="flex gap-3 items-start text-gray-700">
            <CheckIcon />
            <span>Integrate 8000+ apps and 300+ AI tools without code</span>
          </div>
          <div className="flex gap-3 items-start text-gray-700">
            <CheckIcon />
            <span>Build AI-powered workflows in minutes, not weeks</span>
          </div>
          <div className="flex gap-3 items-start text-gray-700">
            <CheckIcon />
            <span>14-day trial of all premium features and apps</span>
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full max-w-md flex-shrink-0">
        <SignupForm />
      </div>
    </div>
  );
}

function SignupForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
  });
  const { signup, loading } = useAuth(); // Assuming signup exists in AuthContext
  const { error } = useToast();
  const router = useRouter();

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSignup = async () => {
    if (!isValidEmail(form.email) || !form.password || !form.name) {
      error("Please fill in all fields correctly.");
      return;
    }

    try {
      // Mapping fields to expected API payload if needed, assuming signup handles it
      await signup({ username: form.email, password: form.password, name: form.name });
    } catch (err) {
      console.error(err);
      error("Signup failed. Please try again.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full relative overflow-hidden">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-70"></div>

      <AuthProviderButton
        icon={<FcGoogle size={20} />}
        text="Sign up with Google"
        bgColor="bg-white hover:bg-gray-50 border border-gray-200 transition"
        textColor="text-gray-700"
      />

      <div className="flex items-center my-6">
        <hr className="flex-grow border-gray-200" />
        <span className="mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">OR</span>
        <hr className="flex-grow border-gray-200" />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Work Email
          </label>
          <input
            type="email"
            placeholder="name@work-email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 text-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 text-gray-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 text-gray-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] text-sm"
        >
          {loading ? "Creating Account..." : "Get Started Free"}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-4 text-center leading-relaxed">
        By signing up, you agree to Zapier's{" "}
        <a href="#" className="text-orange-600 hover:underline">terms of service</a> and{" "}
        <a href="#" className="text-orange-600 hover:underline">privacy policy</a>.
      </p>

      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); router.push("/signin"); }}
          className="text-orange-600 font-medium hover:underline cursor-pointer"
        >
          Log in
        </a>
      </div>
    </div>
  );
}

