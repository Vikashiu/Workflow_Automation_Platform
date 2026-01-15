import Image from "next/image";
import { Navbar } from "@/component/Navbars/Navbar";
import { HeroLanding } from "@/component/heroSections/HeroSection";
import { HeroVideo } from "@/component/heroSections/HeroVideo";
import { Footer } from "@/component/footer"
export default function Home() {
  return (
    <div className="h-screen bg-[#fffefa]">

      <Navbar></Navbar>
      <div className="mx-4 md:mx-10 lg:mx-20 xl:mx-32 border-x border-gray-200 ">
        <HeroLanding></HeroLanding>
        <div className="flex justify-center items-center pt-10">
          
          YOUR COMPLETE TOOLKIT FOR AI AUTOMATION</div>

        <HeroVideo></HeroVideo>
      </div>
      <Footer/>

    </div>
  );
}
// import Image from "next/image";
// // Assuming the correct component and path is ResponsiveNavbar.tsx, adjust if needed.
// import { Navbar } from "@/component/Navbars/Navbar"; 
// import { HeroLanding } from "@/component/heroSections/HeroSection";
// import { HeroVideo } from "@/component/heroSections/HeroVideo";
// // Assuming the correct component file is Footer.tsx
// import { Footer } from "@/component/footer"; 

// export default function Home() {
//   return (
//     // Using min-h-screen ensures the layout takes at least the full screen height
//     // and can grow if content overflows, which is better for responsiveness.
//     <div className="min-h-screen bg-[#fffefa] flex flex-col">
//       <Navbar />
      
//       {/* Main content area now has responsive horizontal margins */}
//       <main className="flex-grow">
//         {/* Responsive Margins Applied Here:
//           - Mobile (default): mx-4 (1rem horizontal margin)
//           - Tablet (md): mx-10 (2.5rem horizontal margin)
//           - Laptop (lg): mx-20 (5rem horizontal margin)
//           - Desktop (xl): mx-32 (8rem horizontal margin)
//         */}
//         <div className="mx-4 md:mx-10 lg:mx-20 xl:mx-32 border-x border-gray-200">
//           <HeroLanding />
//           <div className="flex justify-center items-center pt-10 text-center px-4 font-semibold text-gray-600 tracking-wider">
//             YOUR COMPLETE TOOLKIT FOR AI AUTOMATION
//           </div>
//           <HeroVideo />
//         </div>
//       </main>

//       <Footer />
//     </div>
//   );
// }