"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";

// Svg icons for checklist
const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export function SignupHeroSection() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:grid lg:grid-cols-2 lg:gap-20 items-center py-8 lg:py-16">
      {/* Left Column: Text */}
      <div className="hidden lg:flex flex-col gap-8">
        <div className="font-[Prata] text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
          AI Automation starts and scales with ZapClone
        </div>

        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg">
          Orchestrate AI across your teams, tools, and processes. Turn ideas into automated action today, and power tomorrow's business growth.
        </p>

        <div className="space-y-5 mt-4">
          {[
            "Integrate 8000+ apps and 300+ AI tools without code",
            "Build AI-powered workflows in minutes, not weeks",
            "14-day trial of all premium features and apps"
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-1 bg-green-100 dark:bg-green-900/30 rounded-full p-0.5">
                <CheckIcon />
              </div>
              <span className="text-slate-700 dark:text-slate-300 font-medium text-lg">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full max-w-md mx-auto lg:mx-0">
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.name) return;
    setLoading(true);
    try {
      const res = await axios.post<{ token: string }>(`${BACKEND_URL}/api/v1/user/signup`, {
        username: form.email,
        password: form.password,
        name: form.name
      });
      // Auto-login after signup
      localStorage.setItem("token", res.data.token);
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center lg:text-left">Get started free</h2>

      <Button
        variant="outline"
        className="w-full justify-start pl-4 mb-6 relative hover:bg-slate-50 dark:hover:bg-slate-800"
        leftIcon={<img src="/google-icon.png" alt="Google" className="w-5 h-5 object-contain" />}
      >
        Sign up with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
          <span className="px-3 bg-white dark:bg-slate-900 text-slate-400">OR</span>
        </div>
      </div>

      <div className="space-y-5">
        <Input
          label="Work Email"
          type="email"
          required
          placeholder="name@company.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            required
            placeholder="Jane"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <Button
          onClick={handleSignup}
          isLoading={loading}
          className="w-full mt-2"
          size="lg"
          disabled={!form.email || !form.password || !form.name}
        >
          Get Started For Free
        </Button>
      </div>

      <p className="text-xs text-slate-500 mt-6 text-center leading-relaxed">
        By signing up, you agree to ZapClone's <a href="#" className="underline hover:text-primary-600 transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-primary-600 transition-colors">Privacy Policy</a>.
      </p>
    </div>
  );
}
