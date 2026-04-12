import { FiHome } from 'react-icons/fi';

export default function ApplicationLogo(props) {
    return (
        <FiHome 
            {...props} 
            className={`fill-current ${props.className || ''}`}
        />
    );
}
