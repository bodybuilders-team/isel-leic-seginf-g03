import axios from 'axios';


function Login() {

	// Return login with google button
	return (
		<div>
			<h1>Login</h1>
			<a href="/api/login/google" >Login with Google</a>
		</div>
	);
}

export default Login;