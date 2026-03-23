export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
`inline-flex items-center rounded-lg bg-gradient-to-r from-orchid-blue to-orchid-purple hover:from-orchid-purple hover:to-orchid-blue hover:shadow-[0_10px_25px_rgba(69,104,220,0.4)] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-all duration-300 ease-out hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-orchid-blue/50 focus:ring-offset-2 active:scale-[0.98] ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
