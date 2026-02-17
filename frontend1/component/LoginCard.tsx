"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { BACKEND_URL } from "@/app/config";
import axios from "axios";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import Link from "next/link";

type LoginResponse = {
  token: string;
};

export function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleContinue = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValidEmail(email)) return;
    setLoading(true);
    try {
      const res = await axios.post<LoginResponse>(
        `${BACKEND_URL}/api/v1/user/signin`,
        {
          username: email,
          password,
        }
      );
      localStorage.setItem("token", res.data.token);
      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || "Login failed"); // Better error handling would be a toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-sm mx-auto transition-all hover:shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Log in to your account to continue
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          className="w-full justify-start pl-4"
          leftIcon={<FcGoogle size={20} />}
        >
          Continue with Google
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start pl-4"
          leftIcon={<FaFacebook size={20} className="text-blue-600" />}
        >
          Continue with Facebook
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start pl-4"
          leftIcon={<FaGithub size={20} />}
        >
          Continue with GitHub
        </Button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleContinue} className="space-y-3">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-end mt-1">
            <button type="button" className="text-xs text-primary-600 hover:text-primary-700 font-medium">Forgot password?</button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!isValidEmail(email)}
          isLoading={loading}
          className="w-full mt-2"
          size="lg"
        >
          Continue
        </Button>
      </form>

      <p className="text-center text-xs mt-4 text-slate-600 dark:text-slate-400">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="text-primary-600 font-semibold hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
