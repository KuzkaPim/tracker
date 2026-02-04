import { Dashboard } from "@/views/dashboard";
import { AuthGuard } from "@/shared/components/AuthGuard";

const DashboardPage = () => {
    return (
        <AuthGuard>
            <Dashboard />
        </AuthGuard>
    );
};  

export default DashboardPage;
