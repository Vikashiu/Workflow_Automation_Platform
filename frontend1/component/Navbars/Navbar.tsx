"use client"

import Image from "next/image"
import { LinkButton } from "../buttons/LinkButtons"
import { OrrButton } from "../buttons/OrrButton"
import { useRouter } from "next/navigation";


export function Navbar(){
    
    const router = useRouter();
    function onClickHandler(){
        router.push('/signup')
    }
    return <>
        <div className="flex h-1/10 border-b border-b-gray-200 justify-between items-center px-4 md:px-10 bg-[#fcfaf7]" >

            <div className="flex items-center">
                {/* Logo remains visible on all screen sizes */}
                <Image 
                    src="/images/zapier_logo.png"
                    alt="logo"
                    width={100}                    
                    height={40}
                    className="flex-shrink-0" // Prevents logo from shrinking
                ></Image>
                
                {/* This container and its links will be hidden on screens smaller than 'md' */}
                <div className="hidden lg:flex items-center ml-4">
                    <LinkButton text="Products"></LinkButton>
                    <LinkButton text="Solutions"></LinkButton>
                    <LinkButton text="Resources"></LinkButton>
                    <LinkButton text="Enterprice"></LinkButton>
                    <LinkButton text="Pricing"></LinkButton>
                </div>
            </div>

            <div className="flex gap-2 justify-center items-center">
                
                {/* This container and its links will also be hidden on screens smaller than 'md' */}
                <div className="hidden md:flex gap-2 items-center">
                    <LinkButton text="explore apps"></LinkButton>
                    <LinkButton text="Contact sales"></LinkButton>
                </div>

                {/* These buttons remain visible on all screen sizes */}
                <div className="flex-shrink-0"> {/* Wrapper to prevent shrinking */}
                  <LinkButton text="Log in" onClickHandler={() => {router.push('/signin')}}></LinkButton>
                </div>
                <div className="flex-shrink-0"> {/* Wrapper to prevent shrinking */}
                  <OrrButton text = "Sign up" onClickhandler={onClickHandler}></OrrButton>
                </div>
            </div>

        </div>
    </>
}
