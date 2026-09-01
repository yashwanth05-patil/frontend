import TestimonialCard from "../TestimonyCard";
import React from "react";

function Testimony() {
    const testimonials = [
        {
            name: 'Alice Dorman',
            content: 'This platform has completely transformed how we manage our business. The intuitive interface and powerful features have saved us countless hours.'
        },
        {
            name: 'John Smith',
            content: 'Outstanding service and support. The team went above and beyond to ensure our success. Highly recommend to anyone looking for quality solutions.'
        },
        {
            name: 'Emma Wilson',
            content: 'The results speak for themselves. We have seen a 300% increase in efficiency since implementing this solution. A genuine change for our workflow.'
        },
        {
            name: 'Michael Brown',
            content: 'Exceptional quality and reliability. The attention to detail and customer-focused approach makes this stand out from the competition.'
        }
    ];

    return (
        <section className='w-full rounded-card bg-panel border border-slate mb-8 overflow-hidden'>
            <div className='w-full relative py-12'>
                <div className='w-full px-4 md:px-6 z-10 relative'>
                    <p className='mono-readout text-center mb-2'>FIELD REPORTS</p>
                    <h1 className='font-display text-display-sm text-center mb-8 text-mist'>What people notice</h1>
                    <div className='flex flex-col gap-4 md:flex-row md:flex-wrap md:justify-center'>
                        {testimonials.map((testimonial, index) => (
                            <React.Fragment key={index}>
                                {(index === 0 || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
                                    <TestimonialCard
                                        name={testimonial.name}
                                        content={testimonial.content}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Testimony;
