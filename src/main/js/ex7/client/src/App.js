import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Tasks from './components/Tasks';
import Login from './components/Login';
import cookie from 'cookie';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let parsed = cookie.parse(document.cookie);
    console.log(parsed);

    setLoggedIn('user_id' in parsed);
  }, []);

  async function logout() {
    setLoggedIn(false);
    console.log("Logging out");

    const res = await fetch("/api/logout", {
      method: 'post'
    })
  }


  return (
    <Router>
      <div className="App">
        <ul>
          {
            !loggedIn ?
              <li>
                <Link to="/login">Login</Link>
              </li>
              :
              <>
                <li>
                  <Link to="/tasks">Tasks</Link>
                </li>
                <li>
                  <Link onClick={logout}>Logout</Link>
                </li>
              </>
          }
        </ul>
      </div>

      <Routes>
        <Route exact path='/tasks' element={< Tasks />}></Route>
        <Route exact path='/login' element={< Login />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
