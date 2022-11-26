import './App.css';
import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Tasks from './components/Tasks';
import Login from './components/Login';
import cookie from 'cookie';
import NavBar from "./components/NavBar.js";
import Home from "./components/Home.js";

/**
 * App component.
 */
function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const navigate = useNavigate();
    const [user, setUser] = useState({});

    /**
     * Fetches the user from the server.
     */
    async function getProfile() {
        const res = await fetch('/api/profile');

        if (res.status !== 200) return;

        const profile = await res.json();

        setUser(profile);
    }

    useEffect(() => {
        const parsed = cookie.parse(document.cookie);
        console.log(parsed);

        setLoggedIn('user_id' in parsed);


        getProfile();
    }, []);

    /**
     * Logs the user out.
     */
    async function logout() {
        setLoggedIn(false);
        console.log("Logging out");

        await fetch("/api/logout", { method: 'post' });

        navigate("/");
    }

    /**
     * Upgrades the user.
     */
    async function upgrade() {
        console.log("Upgrading user");

        await fetch("/api/upgrade", { method: 'post' });

        getProfile();
    }

    return (<>
        <NavBar loggedIn={loggedIn} logout={logout} upgrade={upgrade} user={user} />

        <div className="app-content">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route exact path='/tasks' element={<Tasks />} />
                <Route exact path='/login' element={<Login />} />
            </Routes>
        </div>

        <footer>
            <p>
                Made with ❤️ by group 3 of SegInf@ISEL in 2022/2023<br />
                48089 André Páscoa<br />
                48280 André Jesus<br />
                48287 Nyckollas Brandão
            </p>
        </footer>
    </>
    );
}

export default App;
