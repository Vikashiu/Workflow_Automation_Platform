"use client"
import { useRouter } from "next/navigation"

import { LinkButton } from "../buttons/LinkButtons"
import Image from "next/image"
import { OrrButton } from "../buttons/OrrButton"


export function SignupNav({signupcheck} :{
    signupcheck:boolean
}) {
    const router = useRouter();
    let text, page;
    if(signupcheck == true){
        text = "Log in";
        page = "signin"
    }else{
        text = "Sign up"
        page = "signup"
    }
    
    return <>
            <div className="flex h-1/10 border-b justify-between items-center pl-10 pr-10">
    
                <div className="flex items-center
                ">
                    <Image src="/images/zapier_logo.png"
                        alt="logo"
                        width={100}                     
                        height={40}
                    ></Image>
                    
                    
                </div>
    
                <div className="flex gap-2 justify-center items-center">
    
                    <LinkButton text="explore apps"></LinkButton>
                    <LinkButton text="Contact sales"></LinkButton>
                    <OrrButton text={text} onClickhandler={() => {router.push(`/${page}`)}}/>
                    
                    
                </div>
    
            </div>
        </>
}