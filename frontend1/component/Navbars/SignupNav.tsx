"use client"
import { useRouter } from "next/navigation"

import { LinkButton } from "../buttons/LinkButtons"
import Image from "next/image"
import { OrrButton } from "../buttons/OrrButton"


export function SignupNav({ signupcheck }: { signupcheck?: boolean }) {
    const router = useRouter();
    const actionText = signupcheck ? "Log in" : "Sign up";
    const actionPage = signupcheck ? "signin" : "signup";

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
            <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto w-full">
                <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
                    <Image
                        src="/images/zapier_logo.png"
                        alt="logo"
                        width={100}
                        height={28}
                        className="object-contain"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-1">
                        <LinkButton text="Explore apps" />
                        <LinkButton text="Contact sales" />
                    </div>
                    <OrrButton
                        text={actionText}
                        onClickhandler={() => router.push(`/${actionPage}`)}
                    />
                </div>
            </div>
        </nav>
    );
}