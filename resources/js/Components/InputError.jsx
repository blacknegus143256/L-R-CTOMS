export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p
            {...props}
            className={'text-xs font-medium text-red-500 mt-1 ring-1 ring-red-500/20 inline-block px-2 py-1 rounded-full bg-red-50/50 backdrop-blur-sm ' + className}
        >
            {message}
        </p>
    ) : null;
}
