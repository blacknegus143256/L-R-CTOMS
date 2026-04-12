import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'flex items-center w-full px-4 py-3 rounded-xl mb-2 transition-all duration-200 ease-in-out focus:outline-none ' +
                (active
                    ? 'bg-white shadow-sm shadow-indigo-100/50 text-indigo-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700') +
                className
            }
        >
            {children}
        </Link>
    );
}
