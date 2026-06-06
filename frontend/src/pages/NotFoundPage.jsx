import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";
import Button from "@/components/ui/Button/Button";

/**
 * NotFoundPage — 404 fallback
 */
const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8">
            <p className="text-8xl font-black text-indigo-100 select-none">404</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Page not found</h1>
            <p className="text-gray-500 mt-2 text-sm max-w-xs">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link to={ROUTES.HOME} className="mt-6">
                <Button variant="primary">Go back home</Button>
            </Link>
        </div>
    );
};

export default NotFoundPage;
