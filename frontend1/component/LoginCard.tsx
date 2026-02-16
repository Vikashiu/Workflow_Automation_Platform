"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthProviderButton from "./buttons/authProviderButton";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaMicrosoft } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signin, loading } = useAuth();
  const { error } = useToast();
  const router = useRouter();

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleContinue = async () => {
    if (!isValidEmail(email)) return;

    try {
      await signin({ username: email, password });
      // Navigation is handled by AuthContext
    } catch (err) {
      console.error(err);
      error("Login failed. Please check your credentials.");
    }
  };
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm relative overflow-hidden">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70"></div>

      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 tracking-tight">
        Welcome back
      </h2>

      <div className="flex flex-col gap-3">
        <AuthProviderButton
          icon={<FcGoogle size={20} />}
          text="Continue with Google"
          bgColor="bg-white hover:bg-gray-50 border border-gray-200 transition"
          textColor="text-gray-700"
        />
        <AuthProviderButton
          icon={<FaFacebook size={20} className="text-[#1877F2]" />}
          text="Continue with Facebook"
          bgColor="bg-white hover:bg-gray-50 border border-gray-200 transition"
          textColor="text-gray-700"
        />
        <AuthProviderButton
          icon={<FaMicrosoft size={20} />}
          text="Continue with Microsoft"
          bgColor="bg-white hover:bg-gray-50 border border-gray-200 transition"
          textColor="text-gray-700"
        />
      </div>

      <div className="flex items-center my-6">
        <hr className="flex-grow border-gray-200" />
        <span className="mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">OR</span>
        <hr className="flex-grow border-gray-200" />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Email
          </label>
          <input
            type="email"
            placeholder="name@work-email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400 text-gray-900"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400 text-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={!isValidEmail(email) || loading}
          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm ${isValidEmail(email) && !loading
            ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20 shadow-lg transform hover:-translate-y-0.5"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
        >
          {loading ? "Signing in..." : "Continue"}
        </button>
      </form>

      <p className="text-center text-sm mt-6 text-gray-500">
        No account?{" "}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); router.push("/signup"); }}
          className="text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
        >
          Sign Up
        </a>
      </p>
    </div>
  );
}
