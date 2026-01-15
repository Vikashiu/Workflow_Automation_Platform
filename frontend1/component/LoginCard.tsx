"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthProviderButton from "./buttons/authProviderButton";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaMicrosoft } from "react-icons/fa";
import { PiShieldCheckBold } from "react-icons/pi";
import { BACKEND_URL } from "@/app/config";
import axios from "axios";


type LoginResponse = {
  
  token:string
  
}

export function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
    const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleContinue = async () => {
    if (!isValidEmail(email)) return;
    // Proceed with email login logic (e.g., send magic link, redirect)
    console.log("hi from login card ")
    const res = await axios.post<LoginResponse>(`${BACKEND_URL}/api/v1/user/signin`, {
      username: email,
      password,
    });
    console.log(res)
    localStorage.setItem("token", res.data.token );
    router.push("/dashboard");
  };
  const router = useRouter();
  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full">
      <h2 className="text-xl font-semibold text-center mb-4">Log in to your account</h2>

      <div className="flex flex-col gap-3">
        <AuthProviderButton
          icon={<FcGoogle size={20} />}
          text="Continue with Google"
          bgColor="bg-blue-500"
        />
        <AuthProviderButton
          icon={<FaFacebook size={20} />}
          text="Continue with Facebook"
          bgColor="bg-[#3b5998]"
        />
        <AuthProviderButton
          icon={<FaMicrosoft size={20} />}
          text="Continue with Microsoft"
          bgColor="bg-black"
        />
        
      </div>

      <div className="flex items-center my-6">
        <hr className="flex-grow border-gray-300" />
        <span className="mx-3 text-sm text-gray-500">OR</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Email <span className="text-red-500">*</span> <span className="text-gray-500">(required)</span>
        </label>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-2 border-purple-500 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Password <span className="text-red-500">*</span> <span className="text-gray-500">(required)</span>
        </label>
        <input
          type="Password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-2 border-purple-500 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />


      </div>

      <button
        onClick={handleContinue}
        disabled={!isValidEmail(email)}
        className={`w-full py-2 rounded-md font-semibold transition-all ${
          isValidEmail(email)
            ? "bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        Continue
      </button>

      <p className="text-center text-sm mt-4 text-gray-600">
        Don't have a Zapier account yet?{" "}
        <a href="#" onClick={() => {router.push("/signup")}} className="text-purple-700 underline">
          Sign Up
        </a>
      </p>
    </div>
  );
}
