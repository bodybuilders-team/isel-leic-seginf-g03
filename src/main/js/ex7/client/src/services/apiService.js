const DEV_MODE = true

const API_ENDPOINT = DEV_MODE ? 'http://localhost' : 'https://www.secure-server.edu';

export async function getTaskLists() {
	return await fetch(`${API_ENDPOINT}/api/taskLists`).json()
}

export async function getTasks(taskListId) {
	return await fetch(`${API_ENDPOINT}/api/taskLists/${taskListId}/tasks`).json()
}
