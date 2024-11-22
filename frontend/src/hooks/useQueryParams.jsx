import { useLocation } from 'react-router-dom';
    
function useQueryParams() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    let params = {};

    for (let param of searchParams) {
        params[param[0]] = param[1];
    }

    return params;
}
export default useQueryParams;
