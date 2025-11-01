import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ManagerUsers from './pages/ManagerUsers';
import ManagerRequests from './pages/ManagerRequests';
import ManagerAnalytics from './pages/ManagerAnalytics';
import UserForm from './pages/UserForm';
import EmployeeRequests from './pages/EmployeeRequests';
import RequestForm from './pages/RequestForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/manager/users" element={<ManagerUsers />} />
        <Route path="/manager/requests" element={<ManagerRequests />} />
        <Route path="/manager/analytics" element={<ManagerAnalytics />} />
        <Route path="/manager/users/create" element={<UserForm />} />
        <Route path="/manager/users/:id" element={<UserForm />} />
        <Route path="/employee/requests" element={<EmployeeRequests />} />
        <Route path="/employee/requests/create" element={<RequestForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
