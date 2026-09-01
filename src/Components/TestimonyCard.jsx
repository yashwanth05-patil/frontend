const TestimonialCard = ({ name, content }) => (
    <div className='w-full p-5 bg-paper-raised rounded-card border border-slate-line md:w-[45%]'>
        <p className='font-display text-[1.05rem] leading-snug text-ink min-h-[6rem]'>
            {content}
        </p>
        <p className='mt-4 mono-readout'>{name}</p>
    </div>
);

export default TestimonialCard
