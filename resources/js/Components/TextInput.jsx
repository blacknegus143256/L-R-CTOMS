import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-xl border border-stone-200 bg-stone-50/50 backdrop-blur-sm shadow-sm focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20 focus:outline-none transition-all duration-200 ' +
                className
            }
            ref={localRef}
        />
    );
});
