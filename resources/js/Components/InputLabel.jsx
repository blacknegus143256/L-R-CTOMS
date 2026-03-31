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
                `block text-xs font-black uppercase tracking-tight text-stone-900 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
