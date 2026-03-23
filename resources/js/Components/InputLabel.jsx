export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-xs font-bold uppercase tracking-widest text-stone-600 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
