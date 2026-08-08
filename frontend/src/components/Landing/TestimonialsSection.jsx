import React from 'react';
import { Quote, Star } from 'lucide-react';

const testimonials = [
    { name: 'Hrishika Sharma', role: 'Student, Hyderabad', quote: 'The interface is calmer, clearer, and feels more trustworthy. The SOS path is now obvious.', img: 'https://i.pravatar.cc/100?img=32' },
    { name: 'Megha Verma', role: 'Engineer, Pune', quote: 'It looks like a real premium SaaS product instead of a simple utility. The experience feels much stronger.', img: 'https://i.pravatar.cc/100?img=33' },
    { name: 'Arya Singh', role: 'Traveler, Mumbai', quote: 'The new hierarchy and surfaces make it much easier to focus when navigating quickly.', img: 'https://i.pravatar.cc/100?img=34' },
];

export default function TestimonialsSection() {
    return (
        <section className="py-24">
            <div className="mx-auto max-w-7xl px-6 md:px-8">
                <div className="mb-12 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">User feedback</p>
                    <h2 className="mt-3 font-headline text-3xl font-semibold text-white md:text-5xl">What users notice first</h2>
                    <div className="mt-4 flex items-center justify-center gap-1 text-violet-200">
                        {[1,2,3,4,5].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {testimonials.map((item) => (
                        <div key={item.name} className="card-premium relative overflow-hidden">
                            <Quote className="absolute right-5 top-5 h-10 w-10 text-white/10" />
                            <div className="flex items-center gap-4">
                                <img src={item.img} alt={item.name} className="h-14 w-14 rounded-2xl border border-white/10 object-cover" />
                                <div>
                                    <p className="font-semibold text-white">{item.name}</p>
                                    <p className="text-xs text-slate-400">{item.role}</p>
                                </div>
                            </div>
                            <p className="mt-6 text-sm leading-relaxed text-slate-300">“{item.quote}”</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
