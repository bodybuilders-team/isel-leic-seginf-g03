/**
 * Login component.
 */
import GoogleButton from "react-google-button";

function Login() {
    return (
        <div>
            <h1>Login</h1>
            <div style={{margin: "auto", width: "fit-content"}}>
                <GoogleButton onClick={() => {
                    window.location.href = "/api/login/google"
                }}/>
            </div>
        </div>
    );
}

export default Login;
