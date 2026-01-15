"use client"
import { useRouter } from "next/navigation"

export function HeroLanding(){
    const router = useRouter();
    return (
        <div className="h-140  flex justify-between p-3 overflow-hidden px-25">

            <div className="flex flex-col justify-center gap-6 pt-30">
                <p className="text-sm ">SCALE AI AGENTS WITH ZAPIER</p>

                <div className="font-[Prata] font-semibold text-5xl ">

                    <div> The most connected AI </div>
                    <div> orchestration platform </div>

                </div>
                
                <div className="text-xl py-3">
                    <div >
                        Build and ship AI workflows in minutes - no IT
                    </div>
                    <div>
                        bottlenecks, no complexity. Just results.
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="bg-orange-600 text-white py-3 px-6 rounded-md font-semibold cursor-pointer " onClick={() => {
                        router.push('/signup')
                    }}>Start free with email</div>

                    <div className="border flex justify-center items-center rounded-md py-3 px-6 font-semibold">
                        Start free with Google
                    </div>
                </div>

                

                
            </div>

            <div className="hidden lg:block ">
                <img src="./images/artwork.png" alt="artwork"
                className="w-full h-full object-contain" />
            </div>

        </div>
    )
}