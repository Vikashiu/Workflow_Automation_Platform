"use client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "../ui/Button"
import Link from "next/link"

export function SignupNav({ signupcheck }: { signupcheck: boolean }) {
    const router = useRouter();
    const isSignup = signupcheck === true;
    const buttonText = isSignup ? "Log in" : "Sign up";
    const targetPath = isSignup ? "/signin" : "/signup";

    return (
        <nav className="flex h-16 border-b border-slate-200 dark:border-slate-800 justify-between items-center px-4 md:px-10 bg-white dark:bg-slate-950">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className="text-xl font-bold bg-clip-text text-slate-900 dark:text-white">
                    ZapClone
                </span>
            </Link>

            <div className="flex gap-6 items-center">
                <Link href="#" className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Explore apps
                </Link>
                <Link href="#" className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Contact Sales
                </Link>
                <Link
                    href={targetPath}
                    className={`inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none h-10 px-5 text-sm ${isSignup
                            ? "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            : "bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg"
                        }`}
                >
                    {buttonText}
                </Link>
            </div>
        </nav>
    );
}