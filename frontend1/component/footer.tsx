import React from 'react';

const linkColumns = [
    {
        title: 'Top searches',
        links: ['Slack integrations', 'Salesforce integrations', 'HubSpot CRM integrations', 'PayPal integrations', 'Asana integrations'],
    },
    {
        title: 'Popular apps',
        links: ['Dropbox', 'Google Sheets', 'DocuSign', 'WordPress', 'Office 365', 'Medium'],
    },
    {
        title: 'Trending apps',
        links: ['Twitch', 'Calendly', 'Microsoft To-Do', 'Microsoft Outlook', 'Medium'],
    },
    {
        title: 'Top apps by category',
        links: ['Project management', 'Calendar', 'Email', 'CRM', 'Marketing'],
    },
    {
        title: 'Our best content',
        links: ['Best Video Conferencing Apps', 'Best Email Apps', 'Best CRM Apps', 'Best Note Taking Apps', 'Best Calendar Apps'],
    },
];

const bottomLinks = [
    "Pricing", "Help", "Developer Platform", "Press", "Jobs", "Enterprise", "Templates", "App Integrations", "Partners Program"
];

const legalLinks = ["Manage cookies", "Legal", "Privacy"];

const alphabet = "0-9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(',');

const FacebookIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>;
const LinkedInIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>;
const TwitterIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>;
const RssIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 11a9 9 0 019 9H4v-9zm0-5a14 14 0 0114 14h-3A11 11 0 004 9V6zm0-4a18 18 0 0118 18h-3A15 15 0 004 5V2zm-1 1a1 1 0 100 2 1 1 0 000-2z" /></svg>;

// Using currentColor for the logo to adapt to theme
const ZapierLogo = () => (
    <svg width="70" height="26" viewBox="0 0 90 34" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M25.9231 0.461538L14.7692 16.9231V0.461538H0V33.5385H14.7692V18L25.9231 33.5385H40.2308L26.3846 16.9231L40.2308 0.461538H25.9231Z" />
        <path d="M64.5385 0.461538H50V33.5385H88.6923V21.2308H64.5385V0.461538Z" />
    </svg>
);


export function Footer() {
    return (
        <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 w-full">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">

                {/* Alphabetical Links */}
                <div className="mb-12">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-widest mb-6">Apps by title</h3>
                    <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-500">
                        {alphabet.map(letter => (
                            <a key={letter} href="#" className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-800">
                                {letter.replace(/,/g, ' ')}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Main Footer Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16">
                    {linkColumns.map(column => (
                        <div key={column.title}>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 tracking-wide mb-4">{column.title}</h3>
                            <ul className="space-y-3">
                                {column.links.map(link => (
                                    <li key={link}>
                                        <a href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                                <li>
                                    <a href="#" className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                                        Show more
                                    </a>
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
                    {/* Top row of bottom bar */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">Follow us</span>
                            <div className="flex space-x-4">
                                <a href="#" className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"><FacebookIcon /></a>
                                <a href="#" className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"><LinkedInIcon /></a>
                                <a href="#" className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"><TwitterIcon /></a>
                                <a href="#" className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"><RssIcon /></a>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {bottomLinks.map(link => (
                                <a key={link} href="#" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                    {link}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Copyright row */}
                    <div className="flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-primary-600 dark:text-white">
                            <a href="#"><ZapierLogo /></a>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-500">
                            <span>&copy; {new Date().getFullYear()} ZapClone Inc.</span>
                            {legalLinks.map(link => (
                                <a key={link} href="#" className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors">
                                    {link}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    );
}
