import './App.css'
import { Routes, Route, HashRouter } from 'react-router-dom'
import Map from './Components/Map';
import Signup from './pages/Signup/Signup';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Home from './pages/Home/Home';
import AddItemPage from "./pages/Item/AddItemPage";
import RecentLostItemsPage from "./pages/Item/RecentLostItemsPage";
import EditItemPage from "./pages/Item/EditItemPage";
import ChatPage from "./pages/Item/ChatPage";

function App() {
  return (
    <HashRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/map" element={<Map />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
    </HashRouter>
  )
}

export default App

/*to run item page: 
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


document.body.style.margin = "0";
document.getElementById("root").style.width = "100%";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/items" replace />} />
        <Route path="/add" element={<AddItemPage />} />
        <Route path="/items" element={<RecentLostItemsPage />} />
        <Route path="/items/:id/edit" element={<EditItemPage />} />
        <Route path="/chat/:username" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

*/
