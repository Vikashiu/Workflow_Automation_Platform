"use client"

import Image from "next/image"
import { LinkButton } from "../buttons/LinkButtons"
import { OrrButton } from "../buttons/OrrButton"
import { useRouter } from "next/navigation";


export function Navbar() {

    const router = useRouter();
    function onClickHandler() {
        router.push('/signup')
    }
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
            <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto w-full">

                <div className="flex items-center gap-6">
                    {/* Logo remains visible on all screen sizes */}
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => router.push('/')}>
                        <Image
                            src="/images/zapier_logo.png"
                            alt="logo"
                            width={100}
                            height={28}
                            className="object-contain"
                        />
                    </div>

                    {/* This container and its links will be hidden on screens smaller than 'md' */}
                    <div className="hidden lg:flex items-center gap-1">
                        <LinkButton text="Products"></LinkButton>
                        <LinkButton text="Solutions"></LinkButton>
                        <LinkButton text="Resources"></LinkButton>
                        <LinkButton text="Enterprise"></LinkButton>
                        <LinkButton text="Pricing"></LinkButton>
                    </div>
                </div>

                <div className="flex gap-3 justify-center items-center">

                    {/* This container and its links will also be hidden on screens smaller than 'md' */}
                    <div className="hidden md:flex gap-1 items-center mr-2">
                        <LinkButton text="Contact sales"></LinkButton>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block">
                            <LinkButton text="Log in" onClickHandler={() => { router.push('/signin') }}></LinkButton>
                        </div>
                        <OrrButton text="Sign up" onClickhandler={onClickHandler}></OrrButton>
                    </div>
                </div>

            </div>
        </nav>
    )
}
