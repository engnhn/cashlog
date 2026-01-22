import { createHashRouter } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Wallets from './pages/Wallets';
import Bills from './pages/Bills';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import Calendar from './pages/Calendar';
import CashFlow from './pages/CashFlow';

export const router = createHashRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/",
                element: <Dashboard />,
            },
            {
                path: "/transactions",
                element: <Transactions />,
            },
            {
                path: "/bills",
                element: <Bills />,
            },
            {
                path: "/wallets",
                element: <Wallets />,
            },
            {
                path: "/categories",
                element: <Categories />,
            },
            {
                path: "/calendar",
                element: <Calendar />,
            },
            {
                path: "/cashflow",
                element: <CashFlow />,
            },
            {
                path: "/settings",
                element: <Settings />,
            },
        ],
    },
]);
