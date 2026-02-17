"use client"
import { useRouter } from "next/navigation"
import { Button } from "../ui/Button"

export function HeroLanding() {
    const router = useRouter();
    return (
        <div className="bg-white dark:bg-slate-950 pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">

                    {/* Text Section */}
                    <div className="lg:col-span-6 text-center lg:text-left">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 text-xs font-bold uppercase tracking-wide mb-6">
                            Scale AI Agents with ZapClone
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white font-[Prata] leading-tight">
                            The most connected AI <span className="text-primary-600">orchestration platform</span>
                        </h1>

                        <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0">
                            Build and ship AI workflows in minutes — no IT bottlenecks, no complexity. Just results.
                        </p>

                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Button
                                size="lg"
                                onClick={() => router.push('/signup')}
                                className="w-full sm:w-auto shadow-primary-500/20"
                            >
                                Start free with email
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => router.push('/signup')}
                                className="w-full sm:w-auto"
                                leftIcon={
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                }
                            >
                                Start free with Google
                            </Button>
                        </div>
                    </div>

                    {/* Image Section */}
                    <div className="mt-12 lg:mt-0 lg:col-span-6 relative">
                        {/* Decorative blob */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>

                        <div className="relative rounded-2xl p-2 bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 shadow-2xl glass-dark">
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-500/20 dark:bg-primary-500/30 flex items-center justify-center">
                                        <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Workflow Dashboard</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Build and run automations</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}