"use client"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InputField } from "@/component/Inputfield";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";




export function SignupHeroSection(){
  
    return (
        <div className="flex justify-between  ">

            <div className="flex flex-col justify-center gap-8">
                
                <div className="font-[Prata] font-semibold text-3xl flex flex-col gap-4">
                    
                    <div>AI Automation starts and</div>

                    <div>scales with Zapier</div>

                </div>

                <div className="text-md flex flex-col text-gray-700 gap-1">
                    <p>Orchestrate AI across your teams, tools, and processes. Turn ideas </p>
                    <p>into automated action today, and power tomorrow's bussiness growth.
                    </p>
                </div>

                <div className="text-md text-gray-700 flex flex-col gap-4">
                    
                    <p className="flex gap-1">
                        <img src="./check-mark.svg" alt="" />
                         Integrate 8000+ apps and 300+ AI tools without code</p>

                    <p className="flex gap-1">
                        <img src="./check-mark.svg" alt="" />
                        Build AI-powered workflows in minutes, not weeks
                    </p>

                    <p className="flex gap-1">
                        <img src="./check-mark.svg" alt="" />
                        14-day trail of all premium features and apps
                    </p>

                </div>

            </div>
                
            <div>
                <SignupForm/>
            </div>

        </div>
    )
}


 function SignupForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    Name: "",
  });
  const router = useRouter();

  

  return (
    <div className="max-w-md mx-auto mt-10 border rounded-lg p-6 bg-white shadow">
      <button
        type="button"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium flex items-center justify-center gap-2"
      >
        <img src="/google-icon.png" alt="Google" className="w-5 h-5" />
        Sign up with Google
      </button>

      <div className="flex items-center my-4">
        <hr className="flex-grow border-gray-300" />
        <span className="mx-2 text-gray-500">OR</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      <p className="text-sm text-gray-700 mb-2">* indicates a required field.</p>

      <InputField
        label="Work email"
        required
        type="email"
        value={form.email}
        onChange={(val) => setForm({ ...form, email: val })}
      />

      <div className="flex gap-4">
        <InputField
          label="password"
          required
          value={form.password}
          onChange={(val) => setForm({ ...form, password: val })}
        />
        <InputField
          label="Name"
          required
          value={form.Name}
          onChange={(val) => setForm({ ...form, Name: val })}
        />
      </div>

      <p className="text-xs text-gray-600 my-4">
        By signing up, you agree to Zapier's{" "}
        <a href="#" className="text-blue-600 underline">
          terms of service
        </a>{" "}
        and{" "}
        <a href="#" className="text-blue-600 underline">
          privacy policy
        </a>
        .
      </p>

      <button
        type="submit" 
        onClick={ async () => {
          const res = await axios.post(`${BACKEND_URL}/api/v1/user/signup`, {
                  username: form.email,
                  password: form.password,
                  name:form.Name
          });
          router.push('/dashboard');
      }}
        className= "w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md font-semibold"
      >
        Get started for free
      </button>

      <div className=" flex justify-center text-center text-sm mt-4">
        Already have an account?{" "}
        <div onClick={() => {router.push("/signin")}} className="text-blue-600 cursor-pointer">Login</div>
      </div>
    </div>
  );
}
