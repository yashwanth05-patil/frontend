const TestimonialCard = ({ name, content }) => (
    <div className='w-full p-5 bg-panel rounded-card border border-slate md:w-[45%]'>
        <p className='font-display text-[1.05rem] leading-snug text-mist min-h-[6rem]'>
            {content}
        </p>
        <p className='mt-4 mono-readout'>{name}</p>
    </div>
);

export default TestimonialCard
