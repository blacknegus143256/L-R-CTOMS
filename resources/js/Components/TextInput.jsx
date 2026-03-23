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
                'rounded-lg border border-orchid-blue/20 bg-white/80 backdrop-blur-sm shadow-sm focus:border-orchid-blue focus:ring-orchid-blue/40 focus:ring-2 focus:outline-none transition-all duration-200 ' +
                className
            }
            ref={localRef}
        />
    );
});
